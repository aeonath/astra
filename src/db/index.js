// Copyright (c) 2026 MiraNova Studios
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH;

// Require DB_PATH to be set explicitly
if (!dbPath) {
  console.error('FATAL: DB_PATH environment variable is not set.');
  console.error('Astra requires an explicit database path to start.');
  console.error('Set DB_PATH in your .env file or environment to the absolute path of your database.');
  console.error('Example: DB_PATH=/var/lib/astra/astra.db');
  console.error('\nIf this is a new installation, run: npm run db:init');
  process.exit(1);
}

// Require absolute path
if (!path.isAbsolute(dbPath)) {
  console.error('FATAL: DB_PATH must be an absolute path.');
  console.error(`Got: ${dbPath}`);
  console.error('Example: DB_PATH=/var/lib/astra/astra.db');
  process.exit(1);
}

// Refuse to start if DB file does not exist — never auto-create
if (!fs.existsSync(dbPath)) {
  console.error(`FATAL: Database file not found: ${dbPath}`);
  console.error('Astra will not auto-create a database. This is by design.');
  console.error('\nTo initialize a new database, run: npm run db:init');
  console.error('To run pending migrations, run: npm run db:migrate');
  process.exit(1);
}

const db = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Verify schema_migrations table exists (indicates a properly initialized DB)
const hasSchemaMigrations = db.prepare(
  "SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migrations'"
).get();

if (!hasSchemaMigrations) {
  console.error('FATAL: Database is missing the schema_migrations table.');
  console.error('This database was not initialized with the Astra migration system.');
  console.error('\nRun: npm run db:migrate');
  console.error('This will bridge any legacy migrations and set up the schema_migrations table.');
  process.exit(1);
}

// Check for pending migrations — refuse to start if any exist
const { loadMigrations } = require('./migrate');
const migrations = loadMigrations();
const applied = new Set(
  db.prepare('SELECT version FROM schema_migrations').all().map(r => r.version)
);
const pending = migrations.filter(m => !applied.has(m.version));

if (pending.length > 0) {
  console.error(`FATAL: ${pending.length} pending migration(s) must be applied before starting:`);
  for (const m of pending) {
    console.error(`  → ${String(m.version).padStart(3, '0')}-${m.name}`);
  }
  console.error('\nRun: npm run db:migrate');
  process.exit(1);
}

module.exports = db;
