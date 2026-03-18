// Copyright (c) 2026 MiraNova Studios
const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /projects/summary — project summary page showing active projects
router.get('/', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
  const projects = db.prepare(`
    SELECT p.*,
      c.name as category_name, c.sort_order as category_sort,
      u.display_name as assignee_name,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND type = 'bug' AND status != 'closed') as open_bugs,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND type = 'feature' AND status != 'closed') as open_features,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND type = 'todo' AND status != 'closed') as open_todos
    FROM projects p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN users u ON p.default_assignee_id = u.id
    WHERE p.active = 1
    ORDER BY c.sort_order, p.name
  `).all();

  res.render('projects/summary', { title: 'Projects Summary', projects, categories });
});

module.exports = router;
