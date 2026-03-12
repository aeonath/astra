// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 20,
  name: 'add-internally-visible-to-projects',
  up(db) {
    db.exec('ALTER TABLE projects ADD COLUMN internally_visible INTEGER NOT NULL DEFAULT 1');
  },
};
