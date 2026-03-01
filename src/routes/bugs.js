// Copyright (c) 2026 MiraNova Studios
const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /bugs/new?project=:slug&type=bug|feature|todo — new item form
router.get('/new', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE slug = ? AND active = 1').get(req.query.project);
  if (!project) {
    req.session.flash = { type: 'error', message: 'Project not found.' };
    return res.redirect('/projects');
  }
  const validTypes = ['bug', 'feature', 'todo'];
  const issueType = validTypes.includes(req.query.type) ? req.query.type : 'bug';
  const users = db.prepare('SELECT id, display_name FROM users WHERE active = 1 ORDER BY display_name').all();
  const titles = { bug: 'Report Bug', feature: 'Request Feature', todo: 'Add Todo' };
  res.render('bugs/new', { title: titles[issueType], project, users, issueType });
});

// POST /bugs — create bug, feature, or todo
router.post('/', (req, res) => {
  const { project_id, title, description, priority, assignee_id } = req.body;
  const validTypes = ['bug', 'feature', 'todo'];
  const issueType = validTypes.includes(req.body.type) ? req.body.type : 'bug';

  const project = db.prepare('SELECT * FROM projects WHERE id = ? AND active = 1').get(project_id);
  if (!project) {
    req.session.flash = { type: 'error', message: 'Project not found.' };
    return res.redirect('/projects');
  }

  if (!title || !title.trim()) {
    req.session.flash = { type: 'error', message: 'Title is required.' };
    return res.redirect(`/bugs/new?project=${project.slug}&type=${issueType}`);
  }

  // Assign next display_number for bugs and features (per project+type)
  let displayNumber = null;
  if (issueType !== 'todo') {
    const max = db.prepare('SELECT MAX(display_number) as max FROM bugs WHERE project_id = ? AND type = ?').get(project_id, issueType);
    displayNumber = (max.max || 0) + 1;
  }

  const result = db.prepare(`
    INSERT INTO bugs (project_id, reporter_id, assignee_id, title, description, priority, type, display_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    project_id,
    req.session.userId,
    assignee_id || project.default_assignee_id || null,
    title.trim(),
    description || null,
    priority || 'medium',
    issueType,
    displayNumber
  );

  const prefixes = { bug: 'BUG', feature: 'REQ' };
  const prefix = prefixes[issueType];
  const displayId = prefix ? `${prefix}-${String(displayNumber).padStart(3, '0')}` : 'Todo';
  req.session.flash = { type: 'success', message: `${displayId} created.` };
  res.redirect(`/bugs/${result.lastInsertRowid}`);
});

// GET /bugs/:id — view bug
router.get('/:id', (req, res) => {
  const bug = db.prepare(`
    SELECT b.*,
      p.name as project_name, p.slug as project_slug,
      u1.display_name as reporter_name,
      u2.display_name as assignee_name
    FROM bugs b
    JOIN projects p ON b.project_id = p.id
    LEFT JOIN users u1 ON b.reporter_id = u1.id
    LEFT JOIN users u2 ON b.assignee_id = u2.id
    WHERE b.id = ?
  `).get(req.params.id);

  if (!bug) {
    req.session.flash = { type: 'error', message: 'Bug not found.' };
    return res.redirect('/projects');
  }

  const comments = db.prepare(`
    SELECT c.*, u.display_name as author_name
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.bug_id = ?
    ORDER BY c.created_at ASC
  `).all(bug.id);

  const users = db.prepare('SELECT id, display_name FROM users WHERE active = 1 ORDER BY display_name').all();

  const prefixes = { bug: 'BUG', feature: 'REQ' };
  const prefix = prefixes[bug.type];
  let displayId;
  if (prefix && bug.display_number) {
    displayId = `${prefix}-${String(bug.display_number).padStart(3, '0')}`;
  } else if (bug.type === 'todo') {
    const openTodos = db.prepare("SELECT id FROM bugs WHERE project_id = ? AND type = 'todo' AND status = 'open' ORDER BY created_at").all(bug.project_id);
    const idx = openTodos.findIndex(t => t.id === bug.id);
    displayId = idx >= 0 ? `Task ${idx + 1}` : 'Task';
  } else {
    displayId = `#${bug.id}`;
  }
  res.render('bugs/show', { title: displayId, bug, comments, users, displayId });
});

// POST /bugs/:id — update bug
router.post('/:id', (req, res) => {
  const bug = db.prepare('SELECT * FROM bugs WHERE id = ?').get(req.params.id);
  if (!bug) {
    req.session.flash = { type: 'error', message: 'Bug not found.' };
    return res.redirect('/projects');
  }

  const { title, description, status, priority, assignee_id } = req.body;
  const validStatuses = ['open', 'closed'];
  const newStatus = validStatuses.includes(status) ? status : bug.status;

  db.prepare(`
    UPDATE bugs SET title = ?, description = ?, status = ?, priority = ?, assignee_id = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title || bug.title,
    description ?? bug.description,
    newStatus,
    priority || bug.priority,
    assignee_id || null,
    bug.id
  );

  req.session.flash = { type: 'success', message: 'Updated.' };
  res.redirect(`/bugs/${bug.id}`);
});

// POST /bugs/:id/comment — add comment
router.post('/:id/comment', (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    req.session.flash = { type: 'error', message: 'Comment cannot be empty.' };
    return res.redirect(`/bugs/${req.params.id}`);
  }

  db.prepare('INSERT INTO comments (bug_id, user_id, content) VALUES (?, ?, ?)').run(
    req.params.id,
    req.session.userId,
    content.trim()
  );

  // Also bump the bug's updated_at
  db.prepare("UPDATE bugs SET updated_at = datetime('now') WHERE id = ?").run(req.params.id);

  req.session.flash = { type: 'success', message: 'Comment added.' };
  res.redirect(`/bugs/${req.params.id}`);
});

module.exports = router;
