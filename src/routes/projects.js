// Copyright (c) 2026 MiraNova Studios
const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /projects — list all active projects
router.get('/', (req, res) => {
  const isLoggedIn = !!req.session.userId;
  const projects = db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND type = 'bug' AND status IN ('open','in_progress')) as open_bugs,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND type = 'bug') as total_bugs,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND type = 'feature' AND status IN ('open','in_progress')) as open_features,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND type = 'feature') as total_features
    FROM projects p
    WHERE p.active = 1 ${isLoggedIn ? '' : 'AND p.public = 1'}
    ORDER BY p.name
  `).all();

  res.render('projects/index', { title: 'Projects', projects });
});

// GET /projects/:slug — show project bugs
router.get('/:slug', (req, res) => {
  const isLoggedIn = !!req.session.userId;
  const project = db.prepare('SELECT * FROM projects WHERE slug = ? AND active = 1').get(req.params.slug);
  if (!project || (!project.public && !isLoggedIn)) {
    req.session.flash = { type: 'error', message: 'Project not found.' };
    return res.redirect('/projects');
  }

  const viewType = req.query.view === 'features' ? 'feature' : 'bug';
  const status = req.query.status || 'open';
  const validStatuses = ['all', 'open', 'in_progress', 'resolved', 'closed', 'wontfix'];
  const filterStatus = validStatuses.includes(status) ? status : 'open';

  let itemsQuery = `
    SELECT b.*,
      u1.display_name as reporter_name,
      u2.display_name as assignee_name
    FROM bugs b
    LEFT JOIN users u1 ON b.reporter_id = u1.id
    LEFT JOIN users u2 ON b.assignee_id = u2.id
    WHERE b.project_id = ? AND b.type = ?
  `;

  const params = [project.id, viewType];
  if (filterStatus !== 'all') {
    itemsQuery += ' AND b.status = ?';
    params.push(filterStatus);
  }
  itemsQuery += ' ORDER BY b.created_at DESC';

  const items = db.prepare(itemsQuery).all(...params);

  const counts = db.prepare(`
    SELECT status, COUNT(*) as count FROM bugs WHERE project_id = ? AND type = ? GROUP BY status
  `).all(project.id, viewType);

  const statusCounts = { open: 0, in_progress: 0, resolved: 0, closed: 0, wontfix: 0 };
  counts.forEach(c => { statusCounts[c.status] = c.count; });

  // Totals for the view toggle tabs
  const bugTotal = db.prepare("SELECT COUNT(*) as count FROM bugs WHERE project_id = ? AND type = 'bug'").get(project.id).count;
  const featureTotal = db.prepare("SELECT COUNT(*) as count FROM bugs WHERE project_id = ? AND type = 'feature'").get(project.id).count;

  res.render('projects/show', {
    title: project.name,
    project,
    items,
    viewType,
    filterStatus,
    statusCounts,
    bugTotal,
    featureTotal,
  });
});

module.exports = router;
