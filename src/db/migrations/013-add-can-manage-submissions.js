// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 13,
  name: 'add-can-manage-submissions',
  up(db) {
    db.exec('ALTER TABLE users ADD COLUMN can_manage_submissions INTEGER NOT NULL DEFAULT 0');
  },
};
