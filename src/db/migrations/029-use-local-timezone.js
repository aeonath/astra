// Copyright (c) 2026 MiraNova Studios
module.exports = {
  version: 29,
  name: 'use-local-timezone',
  up(db) {
    // Convert existing UTC timestamps to local time
    // SQLite datetime() with 'localtime' modifier converts from UTC to local
    db.exec(`
      UPDATE projects SET
        created_at = datetime(created_at, 'localtime'),
        updated_at = datetime(updated_at, 'localtime');

      UPDATE bugs SET
        created_at = datetime(created_at, 'localtime'),
        updated_at = datetime(updated_at, 'localtime');

      UPDATE users SET
        created_at = datetime(created_at, 'localtime'),
        updated_at = datetime(updated_at, 'localtime');

      UPDATE comments SET
        created_at = datetime(created_at, 'localtime');

      UPDATE public_submissions SET
        created_at = datetime(created_at, 'localtime');
    `);
  },
};
