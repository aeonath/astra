// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 4,
  name: 'add-todo-type-simplify-status',
  up(db) {
    db.exec(`
      PRAGMA foreign_keys = OFF;

      CREATE TABLE bugs_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        reporter_id INTEGER NOT NULL,
        assignee_id INTEGER,
        type TEXT NOT NULL DEFAULT 'bug' CHECK(type IN ('bug', 'feature', 'todo')),
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'closed')),
        priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('critical', 'high', 'medium', 'low')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (reporter_id) REFERENCES users(id),
        FOREIGN KEY (assignee_id) REFERENCES users(id)
      );

      INSERT INTO bugs_new (id, project_id, reporter_id, assignee_id, type, title, description, status, priority, created_at, updated_at)
      SELECT id, project_id, reporter_id, assignee_id, type, title, description,
        CASE WHEN status = 'open' THEN 'open' ELSE 'closed' END,
        priority, created_at, updated_at
      FROM bugs;

      DROP TABLE bugs;
      ALTER TABLE bugs_new RENAME TO bugs;

      CREATE INDEX idx_bugs_project ON bugs(project_id);
      CREATE INDEX idx_bugs_status ON bugs(status);
      CREATE INDEX idx_bugs_assignee ON bugs(assignee_id);
      CREATE INDEX idx_bugs_type ON bugs(type);

      PRAGMA foreign_keys = ON;
    `);
  },
};
