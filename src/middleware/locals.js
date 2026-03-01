// Copyright (c) 2026 MiraNova Studios
const db = require('../db');

// Inject common locals into all views
module.exports = function locals(req, res, next) {
  res.locals.currentUser = null;
  res.locals.isAdmin = false;
  res.locals.currentPath = req.path;

  if (req.session.userId) {
    const user = db.prepare('SELECT id, username, display_name, role, can_manage_submissions FROM users WHERE id = ?').get(req.session.userId);
    if (user) {
      res.locals.currentUser = user;
      res.locals.isAdmin = user.role === 'admin';
      res.locals.canManageSubmissions = user.role === 'admin' || user.can_manage_submissions === 1;
    }
  }

  // Load site settings as a simple object
  const rows = db.prepare('SELECT key, value FROM site_settings').all();
  const siteSettings = {};
  for (const row of rows) {
    siteSettings[row.key] = row.value;
  }
  res.locals.siteSettings = siteSettings;

  next();
};
