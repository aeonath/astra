// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 11,
  name: 'add-public-project-access-setting',
  up(db) {
    db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?)').run('public_project_access', '1');
  },
};
