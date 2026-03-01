// Copyright (c) 2026 MiraNova Studios
function init(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      public INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bugs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      reporter_id INTEGER NOT NULL,
      assignee_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'closed', 'wontfix')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('critical', 'high', 'medium', 'low')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (reporter_id) REFERENCES users(id),
      FOREIGN KEY (assignee_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bug_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (bug_id) REFERENCES bugs(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY
    );
  `);

  // Migrations
  migrate(db, 'add_public_to_projects', `
    ALTER TABLE projects ADD COLUMN public INTEGER NOT NULL DEFAULT 0
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_bugs_project ON bugs(project_id);
    CREATE INDEX IF NOT EXISTS idx_bugs_status ON bugs(status);
    CREATE INDEX IF NOT EXISTS idx_bugs_assignee ON bugs(assignee_id);
    CREATE INDEX IF NOT EXISTS idx_comments_bug ON comments(bug_id);
  `);
}

function migrate(db, name, sql) {
  const exists = db.prepare('SELECT 1 FROM _migrations WHERE name = ?').get(name);
  if (!exists) {
    db.exec(sql);
    db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(name);
  }
}

module.exports = { init };
