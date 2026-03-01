// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 7,
  name: 'add-categories',
  up(db) {
    db.exec(`
      CREATE TABLE categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      ALTER TABLE projects ADD COLUMN category_id INTEGER REFERENCES categories(id);
    `);

    // Seed default categories
    const insert = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)');
    insert.run('Apps', 0);
    insert.run('Games', 1);
    insert.run('Websites', 2);
    insert.run('Extensions', 3);
  },
};
