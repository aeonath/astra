// Copyright (c) 2026 MiraNova Studios
require('dotenv').config();
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH;

if (!dbPath) {
  console.error('ERROR: DB_PATH environment variable is not set.');
  console.error('Example: DB_PATH=/var/lib/astra/astra.db');
  process.exit(1);
}

if (!path.isAbsolute(dbPath)) {
  console.error('ERROR: DB_PATH must be an absolute path.');
  console.error(`Got: ${dbPath}`);
  process.exit(1);
}

if (!fs.existsSync(dbPath)) {
  console.error(`ERROR: Database file not found: ${dbPath}`);
  console.error('Run "npm run db:init" first to create the database.');
  process.exit(1);
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

async function seed() {
  // Create default admin user
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!existing) {
    const hash = await bcrypt.hash('admin', 12);
    db.prepare(`
      INSERT INTO users (username, display_name, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin', 'Administrator', 'admin@astra.local', hash, 'admin');
    console.log('Created default admin user (username: admin, password: admin)');
  } else {
    console.log('Admin user already exists, skipping.');
  }

  // Create a sample project
  const existingProject = db.prepare('SELECT id FROM projects WHERE slug = ?').get('astra');
  if (!existingProject) {
    db.prepare(`
      INSERT INTO projects (name, slug, description, public)
      VALUES (?, ?, ?, 1)
    `).run('Astra', 'astra', 'Bug tracker for the Astra project itself');
    console.log('Created sample project: Astra');
  }

  db.close();
  console.log('Seed complete.');
}

seed().catch(console.error);
