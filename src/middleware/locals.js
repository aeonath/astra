const db = require('../db');

// Inject common locals into all views
module.exports = function locals(req, res, next) {
  res.locals.currentUser = null;
  res.locals.isAdmin = false;
  res.locals.currentPath = req.path;

  if (req.session.userId) {
    const user = db.prepare('SELECT id, username, display_name, role FROM users WHERE id = ?').get(req.session.userId);
    if (user) {
      res.locals.currentUser = user;
      res.locals.isAdmin = user.role === 'admin';
    }
  }

  next();
};
