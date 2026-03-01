// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 12,
  name: 'add-public-submissions',
  up(db) {
    db.exec(`
      CREATE TABLE public_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('bug', 'feature')),
        project_id INTEGER NOT NULL REFERENCES projects(id),
        name TEXT NOT NULL,
        email TEXT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'reviewed', 'dismissed')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  },
};
