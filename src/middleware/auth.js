function requireLogin(req, res, next) {
  if (!req.session.userId) {
    req.session.flash = { type: 'error', message: 'Please log in to continue.' };
    return res.redirect('/login');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    req.session.flash = { type: 'error', message: 'Please log in to continue.' };
    return res.redirect('/login');
  }
  if (req.session.userRole !== 'admin') {
    req.session.flash = { type: 'error', message: 'Access denied.' };
    return res.redirect('/projects');
  }
  next();
}

module.exports = { requireLogin, requireAdmin };
