// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 6,
  name: 'add-default-assignee-to-projects',
  up(db) {
    db.exec(`
      ALTER TABLE projects ADD COLUMN default_assignee_id INTEGER REFERENCES users(id);
    `);
  },
};
