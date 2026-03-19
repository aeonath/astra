// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 26,
  name: 'add-summary-sort-order',
  up(db) {
    db.exec(`ALTER TABLE projects ADD COLUMN summary_sort_order INTEGER NOT NULL DEFAULT 0`);
    // Initialize sort order from current name-alphabetical order
    const projects = db.prepare('SELECT id FROM projects WHERE active = 1 AND archived = 0 ORDER BY name').all();
    const stmt = db.prepare('UPDATE projects SET summary_sort_order = ? WHERE id = ?');
    projects.forEach((p, i) => stmt.run(i, p.id));
  },
};
