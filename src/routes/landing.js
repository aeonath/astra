// Copyright (c) 2026 MiraNova Studios
const db = require('../db');

module.exports = function landing(req, res) {
  const isLoggedIn = !!req.session.userId;
  const projects = db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND type = 'bug' AND status = 'open') as open_count,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND type = 'bug' AND status = 'in_progress') as in_progress_count,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND type = 'bug' AND status = 'resolved') as resolved_count,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND type = 'bug' AND status = 'closed') as closed_count,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND type = 'bug') as total_bugs,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND type = 'feature' AND status IN ('open','in_progress')) as open_features,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND type = 'feature') as total_features
    FROM projects p
    WHERE p.active = 1 ${isLoggedIn ? '' : 'AND p.public = 1'}
    ORDER BY p.name
  `).all();

  res.render('landing', { title: 'Astra', projects });
};
