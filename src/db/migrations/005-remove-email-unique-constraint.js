// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 5,
  name: 'remove-email-unique-constraint',
  disableForeignKeys: true,
  up(db) {
    db.exec(`
      CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      INSERT INTO users_new (id, username, display_name, email, password_hash, role, active, created_at, updated_at)
      SELECT id, username, display_name, email, password_hash, role, active, created_at, updated_at
      FROM users;

      DROP TABLE users;
      ALTER TABLE users_new RENAME TO users;
    `);
  },
};
