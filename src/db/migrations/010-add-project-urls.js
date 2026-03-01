// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 10,
  name: 'add-project-urls',
  up(db) {
    db.exec(`
      ALTER TABLE projects ADD COLUMN homepage_url TEXT;
      ALTER TABLE projects ADD COLUMN github_url TEXT;
      ALTER TABLE projects ADD COLUMN github_private INTEGER NOT NULL DEFAULT 0;
    `);
  },
};
