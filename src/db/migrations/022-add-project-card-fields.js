// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 22,
  name: 'add-project-card-fields',
  up(db) {
    db.exec(`
      ALTER TABLE projects ADD COLUMN nickname TEXT NOT NULL DEFAULT '';
      ALTER TABLE projects ADD COLUMN scope TEXT NOT NULL DEFAULT '';
      ALTER TABLE projects ADD COLUMN purpose TEXT NOT NULL DEFAULT '';
      ALTER TABLE projects ADD COLUMN project_status TEXT NOT NULL DEFAULT '';
      ALTER TABLE projects ADD COLUMN keywords TEXT NOT NULL DEFAULT '';
    `);
  },
};
