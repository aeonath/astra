// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 24,
  name: 'add-summary-notes-to-projects',
  up(db) {
    db.exec(`ALTER TABLE projects ADD COLUMN summary_notes TEXT NOT NULL DEFAULT ''`);
  },
};
