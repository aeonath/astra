// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 9,
  name: 'add-display-number-to-bugs',
  up(db) {
    db.exec(`ALTER TABLE bugs ADD COLUMN display_number INTEGER`);

    // Backfill: assign sequential numbers per project + type (bug/feature only)
    const rows = db.prepare(
      "SELECT id, project_id, type FROM bugs WHERE type IN ('bug', 'feature') ORDER BY project_id, type, created_at"
    ).all();

    const counters = {};
    const update = db.prepare('UPDATE bugs SET display_number = ? WHERE id = ?');
    for (const row of rows) {
      const key = `${row.project_id}:${row.type}`;
      counters[key] = (counters[key] || 0) + 1;
      update.run(counters[key], row.id);
    }
  },
};
