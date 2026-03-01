// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 14,
  name: 'add-notes-to-projects',
  up(db) {
    db.exec("ALTER TABLE projects ADD COLUMN notes TEXT NOT NULL DEFAULT ''");
  },
};
