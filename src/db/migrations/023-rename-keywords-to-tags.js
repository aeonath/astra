// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 23,
  name: 'rename-keywords-to-tags',
  up(db) {
    db.exec(`ALTER TABLE projects RENAME COLUMN keywords TO tags`);
  },
};
