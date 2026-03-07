// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 17,
  name: 'add-public-button-settings',
  up(db) {
    db.prepare("INSERT OR IGNORE INTO site_settings (key, value) VALUES ('show_report_bug_button', '1')").run();
    db.prepare("INSERT OR IGNORE INTO site_settings (key, value) VALUES ('show_request_feature_button', '1')").run();
  },
};
