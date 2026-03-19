// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 25,
  name: 'add-archived-to-projects',
  up(db) {
    // Add archived column; copy inverse of current active flag so existing
    // archived projects (active=0) get archived=1
    db.exec(`
      ALTER TABLE projects ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;
      UPDATE projects SET archived = CASE WHEN active = 0 THEN 1 ELSE 0 END;
    `);
  },
};
