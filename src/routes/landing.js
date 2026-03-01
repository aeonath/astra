// Copyright (c) 2026 MiraNova Studios
const db = require('../db');

module.exports = function landing(req, res) {
  const isLoggedIn = !!req.session.userId;
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
  const projects = db.prepare(`
    SELECT p.*,
      c.name as category_name, c.sort_order as category_sort,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND type = 'bug' AND status = 'open') as open_bugs,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND type = 'feature' AND status = 'open') as open_features,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND type = 'todo' AND status = 'open') as open_todos
    FROM projects p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.active = 1 ${isLoggedIn ? '' : 'AND p.public = 1'}
    ORDER BY c.sort_order, p.name
  `).all();

  res.render('landing', { title: 'Astra', projects, categories });
};
