// Copyright (c) 2026 MiraNova Studios
require('dotenv').config();
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { validateDbPath, ensureSchemaMigrationsTable, runMigrations } = require('./migrate');

const dbPath = process.env.DB_PATH;
validateDbPath(dbPath);

if (fs.existsSync(dbPath)) {
  console.error(`ERROR: Database file already exists: ${dbPath}`);
  console.error('Refusing to overwrite an existing database.');
  console.error('To run pending migrations on an existing database, use: npm run db:migrate');
  process.exit(1);
}

// Create parent directory if needed
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
  console.log(`Created directory: ${dir}`);
}

console.log(`Initializing new database: ${dbPath}`);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

try {
  ensureSchemaMigrationsTable(db);
  const count = runMigrations(db);
  console.log(`\nDatabase initialized successfully at: ${dbPath}`);
  console.log(`Applied ${count} migration(s).`);
  console.log('\nNext steps:');
  console.log('  1. Run "npm run seed" to create the default admin user');
  console.log('  2. Run "npm start" to start Astra');
} catch (err) {
  console.error('Initialization failed:', err.message);
  // Clean up the partially created file
  db.close();
  fs.unlinkSync(dbPath);
  console.error('Removed partially created database file.');
  process.exit(1);
} finally {
  db.close();
}
