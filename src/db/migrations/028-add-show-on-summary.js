// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 28,
  name: 'add-show-on-summary',
  up(db) {
    db.exec(`
      ALTER TABLE projects ADD COLUMN show_on_summary INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE categories ADD COLUMN show_on_summary INTEGER NOT NULL DEFAULT 1;
    `);
  },
};
