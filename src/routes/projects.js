// Copyright (c) 2026 MiraNova Studios
const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /projects — list all active projects
router.get('/', (req, res) => {
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

  res.render('projects/index', { title: 'Projects', projects });
});

// GET /projects/:slug — show project detail with todos, features, and bugs
router.get('/:slug', (req, res) => {
  const isLoggedIn = !!req.session.userId;
  const project = db.prepare('SELECT * FROM projects WHERE slug = ? AND active = 1').get(req.params.slug);
  if (!project || (!project.public && !isLoggedIn)) {
    req.session.flash = { type: 'error', message: 'Project not found.' };
    return res.redirect('/projects');
  }

  const showAll = req.query.show === 'all';
  const statusFilter = showAll ? '' : "AND b.status = 'open'";

  const itemQuery = `
    SELECT b.*,
      u1.display_name as reporter_name,
      u2.display_name as assignee_name
    FROM bugs b
    LEFT JOIN users u1 ON b.reporter_id = u1.id
    LEFT JOIN users u2 ON b.assignee_id = u2.id
    WHERE b.project_id = ? AND b.type = ? ${statusFilter}
    ORDER BY b.created_at DESC
  `;

  const todos = db.prepare(itemQuery).all(project.id, 'todo');
  const features = db.prepare(itemQuery).all(project.id, 'feature');
  const bugs = db.prepare(itemQuery).all(project.id, 'bug');

  const countQuery = `SELECT
    SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count,
    SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_count
    FROM bugs WHERE project_id = ? AND type = ?`;

  const todoRaw = db.prepare(countQuery).get(project.id, 'todo');
  const featureRaw = db.prepare(countQuery).get(project.id, 'feature');
  const bugRaw = db.prepare(countQuery).get(project.id, 'bug');

  res.render('projects/show', {
    title: project.name,
    project,
    todos,
    features,
    bugs,
    todoCounts: { open: todoRaw.open_count || 0, closed: todoRaw.closed_count || 0 },
    featureCounts: { open: featureRaw.open_count || 0, closed: featureRaw.closed_count || 0 },
    bugCounts: { open: bugRaw.open_count || 0, closed: bugRaw.closed_count || 0 },
    showAll,
  });
});

module.exports = router;
