// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 8,
  name: 'add-site-settings',
  up(db) {
    db.exec(`
      CREATE TABLE site_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    const insert = db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?)');
    insert.run('tagline', 'Bug Tracker \u2014 MiraNova Studios');
    insert.run('footer_text', '\u00A9 2026 MiraNova Studios');
  },
};
