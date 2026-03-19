// Copyright (c) 2026 MiraNova Studios
const express = require('express');
const db = require('../db');
const notifications = require('../notifications');
const router = express.Router();

// GET /projects — list all active projects grouped by category
router.get('/', (req, res) => {
  const isLoggedIn = !!req.session.userId;
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
  const projects = db.prepare(`
    SELECT p.*,
      c.name as category_name, c.sort_order as category_sort,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND type = 'bug' AND status != 'closed') as open_bugs,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND type = 'feature' AND status != 'closed') as open_features,
      (SELECT COUNT(*) FROM bugs WHERE project_id = p.id AND type = 'todo' AND status != 'closed') as open_todos
    FROM projects p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.archived = 0 ${isLoggedIn ? 'AND p.active = 1' : 'AND p.public = 1'}
    ORDER BY c.sort_order, p.name
  `).all();

  res.render('projects/index', { title: 'Projects', projects, categories });
});

// GET /projects/submit — public bug report / feature request form
router.get('/submit', (req, res) => {
  const validTypes = ['bug', 'feature'];
  const type = validTypes.includes(req.query.type) ? req.query.type : 'bug';
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
  const titles = { bug: 'Report a Bug', feature: 'Request a Feature' };
  const preselect = { categoryId: req.query.category_id || '', projectId: req.query.project_id || '' };
  res.render('public-submit', { title: titles[type], type, categories, preselect });
});

// GET /projects/submit/projects — JSON API for project dropdown
router.get('/submit/projects', (req, res) => {
  const categoryId = req.query.category_id;
  let projects;
  if (categoryId) {
    projects = db.prepare('SELECT id, name FROM projects WHERE archived = 0 AND public = 1 AND category_id = ? ORDER BY name').all(categoryId);
  } else {
    projects = db.prepare('SELECT id, name FROM projects WHERE archived = 0 AND public = 1 ORDER BY name').all();
  }
  res.json(projects);
});

// POST /projects/submit — process public submission
router.post('/submit', async (req, res) => {
  const { type, project_id, name, email, title, description } = req.body;
  const validTypes = ['bug', 'feature'];
  if (!validTypes.includes(type) || !project_id || !name || !title) {
    req.session.flash = { type: 'error', message: 'Please fill in all required fields.' };
    return res.redirect(`/projects/submit?type=${type || 'bug'}`);
  }

  // Verify reCAPTCHA if configured
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (secretKey) {
    const token = req.body['g-recaptcha-response'];
    if (!token) {
      req.session.flash = { type: 'error', message: 'Please complete the reCAPTCHA verification.' };
      return res.redirect(`/projects/submit?type=${type}`);
    }
    try {
      const params = new URLSearchParams({ secret: secretKey, response: token });
      const verify = await fetch(`https://www.google.com/recaptcha/api/siteverify`, { method: 'POST', body: params });
      const result = await verify.json();
      if (!result.success) {
        req.session.flash = { type: 'error', message: 'reCAPTCHA verification failed. Please try again.' };
        return res.redirect(`/projects/submit?type=${type}`);
      }
    } catch (err) {
      req.session.flash = { type: 'error', message: 'Could not verify reCAPTCHA. Please try again.' };
      return res.redirect(`/projects/submit?type=${type}`);
    }
  }

  const project = db.prepare('SELECT id FROM projects WHERE id = ? AND archived = 0 AND public = 1').get(project_id);
  if (!project) {
    req.session.flash = { type: 'error', message: 'Invalid project selected.' };
    return res.redirect(`/projects/submit?type=${type}`);
  }

  const projectRow = db.prepare('SELECT name FROM projects WHERE id = ?').get(project_id);
  db.prepare("INSERT INTO public_submissions (type, project_id, name, email, title, description, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))").run(type, project_id, name.trim(), email ? email.trim() : null, title.trim(), description ? description.trim() : null);

  notifications.broadcast('new-submission', {
    type,
    title: title.trim(),
    submitter: name.trim(),
    project: projectRow ? projectRow.name : '',
  });

  const label = type === 'feature' ? 'feature request' : 'bug report';
  req.session.flash = { type: 'success', message: `Your ${label} has been submitted and will be reviewed by our team. Thank you!` };
  res.redirect('/');
});

// GET /projects/:slug — show project detail with todos, features, and bugs (login required)
router.get('/:slug', (req, res) => {
  if (!req.session.userId) {
    req.session.flash = { type: 'error', message: 'Please log in to view project details.' };
    return res.redirect('/login');
  }
  const isLoggedIn = true;
  const project = db.prepare('SELECT * FROM projects WHERE slug = ? AND archived = 0').get(req.params.slug);
  if (!project) {
    req.session.flash = { type: 'error', message: 'Project not found.' };
    return res.redirect('/projects');
  }

  // Public users always see open items only
  const showStatus = isLoggedIn && req.query.show === 'closed' ? 'closed' : 'open';
  const statusFilter = showStatus === 'closed' ? "AND b.status = 'closed'" : "AND b.status != 'closed'";

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
    SUM(CASE WHEN status != 'closed' THEN 1 ELSE 0 END) as open_count,
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
    showStatus,
  });
});

// POST /projects/:slug/notes — save project notes (requires login)
router.post('/:slug/notes', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  const project = db.prepare('SELECT * FROM projects WHERE slug = ? AND archived = 0').get(req.params.slug);
  if (!project) {
    req.session.flash = { type: 'error', message: 'Project not found.' };
    return res.redirect('/projects');
  }
  const notes = req.body.notes || '';
  db.prepare('UPDATE projects SET notes = ? WHERE id = ?').run(notes, project.id);
  req.session.flash = { type: 'success', message: 'Notes saved.' };
  res.redirect('/projects/' + project.slug);
});

module.exports = router;
