// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 19,
  name: 'add-imported-bug-id-to-submissions',
  up(db) {
    db.exec('ALTER TABLE public_submissions ADD COLUMN imported_bug_id INTEGER REFERENCES bugs(id)');
  },
};
