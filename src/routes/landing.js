// Copyright (c) 2026 MiraNova Studios
const db = require('../db');

module.exports = function landing(req, res) {
  const isLoggedIn = !!req.session.userId;
  const projects = db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND type = 'bug' AND status = 'open') as open_bugs,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND type = 'feature' AND status = 'open') as open_features,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND type = 'todo' AND status = 'open') as open_todos
    FROM projects p
    WHERE p.active = 1 ${isLoggedIn ? '' : 'AND p.public = 1'}
    ORDER BY p.name
  `).all();

  res.render('landing', { title: 'Astra', projects });
};
