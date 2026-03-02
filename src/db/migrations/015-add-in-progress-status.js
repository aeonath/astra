// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 15,
  name: 'add-in-progress-status',
  up(db) {
    // SQLite doesn't support ALTER CHECK constraints, so we recreate the table
    db.exec(`
      CREATE TABLE bugs_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL REFERENCES projects(id),
        reporter_id INTEGER REFERENCES users(id),
        assignee_id INTEGER REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'closed')),
        priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('critical', 'high', 'medium', 'low')),
        type TEXT NOT NULL DEFAULT 'bug' CHECK(type IN ('bug', 'feature', 'todo')),
        display_number INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      INSERT INTO bugs_new (id, project_id, reporter_id, assignee_id, title, description, status, priority, type, display_number, created_at, updated_at)
        SELECT id, project_id, reporter_id, assignee_id, title, description,
          CASE
            WHEN status = 'in_progress' THEN 'in_progress'
            WHEN status IN ('closed', 'resolved', 'wontfix') THEN 'closed'
            ELSE 'open'
          END,
          priority, type, display_number, created_at, updated_at
        FROM bugs;
      DROP TABLE bugs;
      ALTER TABLE bugs_new RENAME TO bugs;
    `);
  },
};
