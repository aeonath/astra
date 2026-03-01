// Copyright (c) 2026 MiraNova Studios
// Simple flash message middleware using session
module.exports = function flash(req, res, next) {
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
};
