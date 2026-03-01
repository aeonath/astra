// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 2,
  name: 'add-public-to-projects',
  up(db) {
    db.exec(`
      ALTER TABLE projects ADD COLUMN public INTEGER NOT NULL DEFAULT 0
    `);
  },
};
