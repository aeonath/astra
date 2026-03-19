// Copyright (c) 2026 MiraNova Studios
require('dotenv').config();
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Legacy migration name → version mapping for bridging old _migrations table
const LEGACY_MIGRATION_MAP = {
  'add_public_to_projects': 2,
  'add_type_column_to_bugs': 3,
  'add_todo_type_simplify_status': 4,
};

function validateDbPath(dbPath) {
  if (!dbPath) {
    console.error('ERROR: DB_PATH environment variable is not set.');
    console.error('Set DB_PATH to the absolute path of your Astra database file.');
    console.error('Example: DB_PATH=/var/lib/astra/astra.db');
    process.exit(1);
  }
  if (!path.isAbsolute(dbPath)) {
    console.error('ERROR: DB_PATH must be an absolute path.');
    console.error(`Got: ${dbPath}`);
    console.error('Example: DB_PATH=/var/lib/astra/astra.db');
    process.exit(1);
  }
}

function loadMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.js'))
    .sort();

  return files.map(f => {
    const migration = require(path.join(migrationsDir, f));
    if (!migration.version || !migration.name || !migration.up) {
      console.error(`ERROR: Invalid migration file ${f} — must export { version, name, up }.`);
      process.exit(1);
    }
    return migration;
  });
}

function ensureSchemaMigrationsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);
}

function bridgeLegacyMigrations(db) {
  // Check if old _migrations table exists
  const hasLegacy = db.prepare(
    "SELECT 1 FROM sqlite_master WHERE type='table' AND name='_migrations'"
  ).get();

  if (!hasLegacy) return;

  // Check if schema_migrations is empty (first time bridging)
  const hasEntries = db.prepare('SELECT 1 FROM schema_migrations LIMIT 1').get();
  if (hasEntries) return;

  console.log('Detected legacy _migrations table — bridging to schema_migrations...');

  // The initial schema (version 1) is always applied if tables exist
  db.prepare(
    'INSERT OR IGNORE INTO schema_migrations (version, name) VALUES (?, ?)'
  ).run(1, 'initial-schema');

  // Map old named migrations to version numbers
  const oldMigrations = db.prepare('SELECT name FROM _migrations').all();
  for (const { name } of oldMigrations) {
    const version = LEGACY_MIGRATION_MAP[name];
    if (version) {
      db.prepare(
        'INSERT OR IGNORE INTO schema_migrations (version, name) VALUES (?, ?)'
      ).run(version, name);
      console.log(`  Bridged: ${name} → version ${version}`);
    }
  }

  console.log('Legacy migration bridge complete.');
}

function runMigrations(db) {
  const migrations = loadMigrations();
  const applied = new Set(
    db.prepare('SELECT version FROM schema_migrations').all().map(r => r.version)
  );

  const pending = migrations.filter(m => !applied.has(m.version));

  if (pending.length === 0) {
    console.log('Database is up to date. No pending migrations.');
    return 0;
  }

  console.log(`Found ${pending.length} pending migration(s):`);
  for (const m of pending) {
    console.log(`  → ${String(m.version).padStart(3, '0')}-${m.name}`);
  }

  for (const m of pending) {
    console.log(`\nApplying ${String(m.version).padStart(3, '0')}-${m.name}...`);
    if (m.disableForeignKeys) {
      db.pragma('foreign_keys = OFF');
    }
    const runInTransaction = db.transaction(() => {
      m.up(db);
      db.prepare(
        'INSERT INTO schema_migrations (version, name) VALUES (?, ?)'
      ).run(m.version, m.name);
    });
    runInTransaction();
    if (m.disableForeignKeys) {
      db.pragma('foreign_keys = ON');
    }
    console.log(`  Done.`);
  }

  console.log(`\nAll migrations applied successfully.`);
  return pending.length;
}

// When run directly as a CLI script
if (require.main === module) {
  const dbPath = process.env.DB_PATH;
  validateDbPath(dbPath);

  if (!fs.existsSync(dbPath)) {
    console.error(`ERROR: Database file not found: ${dbPath}`);
    console.error('Run "npm run db:init" first to create the database.');
    process.exit(1);
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  try {
    ensureSchemaMigrationsTable(db);
    bridgeLegacyMigrations(db);
    runMigrations(db);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

module.exports = { validateDbPath, loadMigrations, ensureSchemaMigrationsTable, bridgeLegacyMigrations, runMigrations };
