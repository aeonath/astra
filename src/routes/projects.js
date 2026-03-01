// Copyright (c) 2026 MiraNova Studios
const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /projects — list all active projects
router.get('/', (req, res) => {
  const projects = db.prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND status IN ('open','in_progress')) as open_bugs,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id) as total_bugs
    FROM projects p
    WHERE p.active = 1
    ORDER BY p.name
  `).all();

  res.render('projects/index', { title: 'Projects', projects });
});

// GET /projects/:slug — show project bugs
router.get('/:slug', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE slug = ? AND active = 1').get(req.params.slug);
  if (!project) {
    req.session.flash = { type: 'error', message: 'Project not found.' };
    return res.redirect('/projects');
  }

  const status = req.query.status || 'open';
  const validStatuses = ['all', 'open', 'in_progress', 'resolved', 'closed', 'wontfix'];
  const filterStatus = validStatuses.includes(status) ? status : 'open';

  let bugsQuery = `
    SELECT b.*,
      u1.display_name as reporter_name,
      u2.display_name as assignee_name
    FROM bugs b
    LEFT JOIN users u1 ON b.reporter_id = u1.id
    LEFT JOIN users u2 ON b.assignee_id = u2.id
    WHERE b.project_id = ?
  `;

  const params = [project.id];
  if (filterStatus !== 'all') {
    bugsQuery += ' AND b.status = ?';
    params.push(filterStatus);
  }
  bugsQuery += ' ORDER BY b.created_at DESC';

  const bugs = db.prepare(bugsQuery).all(...params);

  const counts = db.prepare(`
    SELECT status, COUNT(*) as count FROM bugs WHERE project_id = ? GROUP BY status
  `).all(project.id);

  const statusCounts = { open: 0, in_progress: 0, resolved: 0, closed: 0, wontfix: 0 };
  counts.forEach(c => { statusCounts[c.status] = c.count; });

  res.render('projects/show', {
    title: project.name,
    project,
    bugs,
    filterStatus,
    statusCounts,
  });
});

module.exports = router;
