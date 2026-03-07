// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 16,
  name: 'add-bug-files',
  up(db) {
    db.prepare(`
      CREATE TABLE bug_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bug_id INTEGER NOT NULL REFERENCES bugs(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        size INTEGER,
        uploaded_by INTEGER REFERENCES users(id),
        uploaded_at DATETIME DEFAULT (datetime('now')),
        UNIQUE(bug_id, filename)
      )
    `).run();
  }
};
