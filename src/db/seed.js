// Copyright (c) 2026 MiraNova Studios
require('dotenv').config();
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');
const schema = require('./schema');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'astra.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

schema.init(db);

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
      INSERT INTO projects (name, slug, description)
      VALUES (?, ?, ?)
    `).run('Astra', 'astra', 'Bug tracker for the Astra project itself');
    console.log('Created sample project: Astra');
  }

  db.close();
  console.log('Seed complete.');
}

seed().catch(console.error);
