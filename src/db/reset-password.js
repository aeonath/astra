// Copyright (c) 2026 MiraNova Studios
require('dotenv').config();
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH;

if (!dbPath) {
  console.error('ERROR: DB_PATH environment variable is not set.');
  process.exit(1);
}

if (!path.isAbsolute(dbPath)) {
  console.error('ERROR: DB_PATH must be an absolute path.');
  process.exit(1);
}

if (!fs.existsSync(dbPath)) {
  console.error(`ERROR: Database file not found: ${dbPath}`);
  process.exit(1);
}

const username = process.argv[2];
const newPassword = process.argv[3];

if (!username || !newPassword) {
  console.error('Usage: npm run reset-password -- <username> <new-password>');
  console.error('Example: npm run reset-password -- admin mynewpassword');
  process.exit(1);
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

async function resetPassword() {
  const user = db.prepare('SELECT id, username FROM users WHERE username = ?').get(username);
  if (!user) {
    console.error(`ERROR: User "${username}" not found.`);
    db.close();
    process.exit(1);
  }

  const hash = await bcrypt.hash(newPassword, 12);
  db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now', 'localtime') WHERE id = ?`).run(hash, user.id);

  db.close();
  console.log(`Password reset for user "${username}".`);
}

resetPassword().catch((err) => {
  console.error('Failed:', err.message);
  db.close();
  process.exit(1);
});
