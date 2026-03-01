// Copyright (c) 2026 MiraNova Studios
const db = require('../db');

module.exports = function landing(req, res) {
  const isLoggedIn = !!req.session.userId;
  const projects = db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND status = 'open') as open_count,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND status = 'in_progress') as in_progress_count,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND status = 'resolved') as resolved_count,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND status = 'closed') as closed_count,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id) as total_count
    FROM projects p
    WHERE p.active = 1 ${isLoggedIn ? '' : 'AND p.public = 1'}
    ORDER BY p.name
  `).all();

  res.render('landing', { title: 'Astra', projects });
};
