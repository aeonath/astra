// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 21,
  name: 'add-can-manage-projects',
  up(db) {
    db.exec('ALTER TABLE users ADD COLUMN can_manage_projects INTEGER NOT NULL DEFAULT 0');
  },
};
