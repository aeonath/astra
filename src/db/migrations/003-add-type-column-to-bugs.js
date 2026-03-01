// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 3,
  name: 'add-type-column-to-bugs',
  up(db) {
    db.exec(`
      ALTER TABLE bugs ADD COLUMN type TEXT NOT NULL DEFAULT 'bug'
    `);
  },
};
