// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 18,
  name: 'add-table-column-settings',
  up(db) {
    db.prepare("INSERT OR IGNORE INTO site_settings (key, value) VALUES ('table_col_priority', '1')").run();
    db.prepare("INSERT OR IGNORE INTO site_settings (key, value) VALUES ('table_col_status', '1')").run();
    db.prepare("INSERT OR IGNORE INTO site_settings (key, value) VALUES ('table_col_assignee', '1')").run();
    db.prepare("INSERT OR IGNORE INTO site_settings (key, value) VALUES ('table_col_created', '1')").run();
  },
};
