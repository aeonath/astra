// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 27,
  name: 'remove-internally-visible',
  disableForeignKeys: true,
  up(db) {
    // Copy internally_visible into active since active now controls
    // Projects Page visibility (what internally_visible used to do)
    db.exec(`UPDATE projects SET active = internally_visible`);
    db.exec(`ALTER TABLE projects DROP COLUMN internally_visible`);
  },
};
