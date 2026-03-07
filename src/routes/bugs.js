// Copyright (c) 2026 MiraNova Studios
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

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

// GET /bugs/search — advanced search with filters
router.get('/search', (req, res) => {
  const q          = (req.query.q        || '').trim();
  const typeFilter = (req.query.type     || '').trim();
  const statusFilter = (req.query.status || '').trim();
  const priorityFilter = (req.query.priority || '').trim();
  const projectSlug = (req.query.project || '').trim();
  const assigneeId  = (req.query.assignee || '').trim();
  const advOpen     = req.query.adv === '1';

  const hasAdvancedFilter = typeFilter || statusFilter || priorityFilter || projectSlug || assigneeId;
  const hasAnyFilter = q || hasAdvancedFilter;

  const projects = db.prepare('SELECT id, name, slug FROM projects WHERE active = 1 ORDER BY name').all();
  const users    = db.prepare('SELECT id, display_name FROM users WHERE active = 1 ORDER BY display_name').all();

  let results = [];
  if (hasAnyFilter) {
    const conditions = ['1=1'];
    const params = [];

    if (q) {
      conditions.push('(b.title LIKE ? OR b.description LIKE ?)');
      params.push('%' + q + '%', '%' + q + '%');
    }
    if (typeFilter && ['bug','feature','todo'].includes(typeFilter)) {
      conditions.push('b.type = ?');
      params.push(typeFilter);
    }
    if (statusFilter === 'open') {
      conditions.push("b.status = 'open'");
    } else if (statusFilter === 'in_progress') {
      conditions.push("b.status = 'in_progress'");
    } else if (statusFilter === 'closed') {
      conditions.push("b.status = 'closed'");
    }
    if (priorityFilter && ['critical','high','medium','low'].includes(priorityFilter)) {
      conditions.push('b.priority = ?');
      params.push(priorityFilter);
    }
    if (projectSlug) {
      conditions.push('p.slug = ?');
      params.push(projectSlug);
    }
    if (assigneeId === 'unassigned') {
      conditions.push('b.assignee_id IS NULL');
    } else if (assigneeId) {
      conditions.push('b.assignee_id = ?');
      params.push(assigneeId);
    }
    results = db.prepare(`
      SELECT b.id, b.title, b.type, b.status, b.priority, b.display_number, b.created_at,
        p.name as project_name, p.slug as project_slug,
        u1.display_name as assignee_name,
        u2.display_name as reporter_name
      FROM bugs b
      JOIN projects p ON b.project_id = p.id
      LEFT JOIN users u1 ON b.assignee_id = u1.id
      LEFT JOIN users u2 ON b.reporter_id = u2.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY b.updated_at DESC
      LIMIT 200
    `).all(...params);
  }

  res.render('bugs/search', {
    title: 'Search',
    q, typeFilter, statusFilter, priorityFilter, projectSlug, assigneeId,
    hasAnyFilter, hasAdvancedFilter, advOpen, results, projects, users,
  });
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

  const files = bug.type === 'bug'
    ? db.prepare('SELECT f.*, u.display_name as uploader_name FROM bug_files f LEFT JOIN users u ON f.uploaded_by = u.id WHERE f.bug_id = ? ORDER BY f.uploaded_at ASC').all(bug.id)
    : [];

  const prefixes = { bug: 'BUG', feature: 'REQ' };
  const prefix = prefixes[bug.type];
  let displayId;
  if (prefix && bug.display_number) {
    displayId = `${prefix}-${String(bug.display_number).padStart(3, '0')}`;
  } else if (bug.type === 'todo') {
    const openTodos = db.prepare("SELECT id FROM bugs WHERE project_id = ? AND type = 'todo' AND status != 'closed' ORDER BY created_at").all(bug.project_id);
    const idx = openTodos.findIndex(t => t.id === bug.id);
    displayId = idx >= 0 ? `Task ${idx + 1}` : 'Task';
  } else {
    displayId = `#${bug.id}`;
  }
  res.render('bugs/show', { title: displayId, bug, comments, users, displayId, files });
});

// POST /bugs/:id — update bug
router.post('/:id', (req, res) => {
  const bug = db.prepare('SELECT b.*, p.slug as project_slug FROM bugs b JOIN projects p ON p.id = b.project_id WHERE b.id = ?').get(req.params.id);
  if (!bug) {
    req.session.flash = { type: 'error', message: 'Bug not found.' };
    return res.redirect('/projects');
  }

  const { title, description, status, priority, assignee_id } = req.body;
  const validStatuses = ['open', 'in_progress', 'closed'];
  const newStatus = validStatuses.includes(status) ? status : bug.status;

  // When closing, preserve existing priority and assignee — they can't be changed while closed
  const newPriority = newStatus === 'closed' ? bug.priority : (priority || bug.priority);
  const newAssigneeId = newStatus === 'closed' ? bug.assignee_id : (assignee_id || null);

  db.prepare(`
    UPDATE bugs SET title = ?, description = ?, status = ?, priority = ?, assignee_id = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title || bug.title,
    description ?? bug.description,
    newStatus,
    newPriority,
    newAssigneeId,
    bug.id
  );

  req.session.flash = { type: 'success', message: 'Updated.' };
  if (newStatus === 'closed' && bug.status !== 'closed') {
    return res.redirect(`/projects/${bug.project_slug}`);
  }
  res.redirect(`/bugs/${bug.id}`);
});

// POST /bugs/:id/comment/:commentId/edit — edit a comment
router.post('/:id/comment/:commentId/edit', (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    req.session.flash = { type: 'error', message: 'Comment cannot be empty.' };
    return res.redirect(`/bugs/${req.params.id}`);
  }

  const comment = db.prepare('SELECT * FROM comments WHERE id = ? AND bug_id = ?').get(req.params.commentId, req.params.id);
  if (!comment) {
    req.session.flash = { type: 'error', message: 'Comment not found.' };
    return res.redirect(`/bugs/${req.params.id}`);
  }

  db.prepare('UPDATE comments SET content = ? WHERE id = ?').run(content.trim(), comment.id);
  db.prepare("UPDATE bugs SET updated_at = datetime('now') WHERE id = ?").run(req.params.id);

  req.session.flash = { type: 'success', message: 'Comment updated.' };
  res.redirect(`/bugs/${req.params.id}`);
});

// POST /bugs/:id/comment/:commentId/delete — delete a comment (admin only)
router.post('/:id/comment/:commentId/delete', (req, res) => {
  if (req.session.userRole !== 'admin') {
    req.session.flash = { type: 'error', message: 'Access denied.' };
    return res.redirect(`/bugs/${req.params.id}`);
  }

  const comment = db.prepare('SELECT * FROM comments WHERE id = ? AND bug_id = ?').get(req.params.commentId, req.params.id);
  if (!comment) {
    req.session.flash = { type: 'error', message: 'Comment not found.' };
    return res.redirect(`/bugs/${req.params.id}`);
  }

  db.prepare('DELETE FROM comments WHERE id = ?').run(comment.id);

  req.session.flash = { type: 'success', message: 'Comment deleted.' };
  res.redirect(`/bugs/${req.params.id}`);
});

// POST /bugs/:id/comment — add comment
router.post('/:id/comment', (req, res) => {
  const bug = db.prepare('SELECT status FROM bugs WHERE id = ?').get(req.params.id);
  if (!bug) return res.redirect('/projects');
  if (bug.status === 'closed') {
    req.session.flash = { type: 'error', message: 'Cannot add comments to a closed item.' };
    return res.redirect(`/bugs/${req.params.id}`);
  }

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

// POST /bugs/:id/files — attach a file to a bug
router.post('/:id/files', upload.single('file'), (req, res) => {
  if (!process.env.FILES_DIR) {
    req.session.flash = { type: 'error', message: 'File storage is not configured on this server.' };
    return res.redirect(`/bugs/${req.params.id}`);
  }

  if (!req.file) {
    req.session.flash = { type: 'error', message: 'No file selected.' };
    return res.redirect(`/bugs/${req.params.id}`);
  }

  const bug = db.prepare(`
    SELECT b.*, p.slug as project_slug FROM bugs b
    JOIN projects p ON b.project_id = p.id
    WHERE b.id = ?
  `).get(req.params.id);

  if (!bug || bug.type !== 'bug') {
    req.session.flash = { type: 'error', message: 'Bug not found.' };
    return res.redirect('/projects');
  }

  const filename = path.basename(req.file.originalname);

  const existing = db.prepare('SELECT id FROM bug_files WHERE bug_id = ? AND filename = ?').get(bug.id, filename);
  if (existing) {
    req.session.flash = { type: 'error', message: `A file named "${filename}" is already attached to this bug.` };
    return res.redirect(`/bugs/${bug.id}`);
  }

  const dir = path.join(process.env.FILES_DIR, bug.project_slug, String(bug.id));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), req.file.buffer);

  db.prepare('INSERT INTO bug_files (bug_id, filename, size, uploaded_by) VALUES (?, ?, ?, ?)').run(
    bug.id, filename, req.file.size, req.session.userId
  );

  req.session.flash = { type: 'success', message: `"${filename}" attached.` };
  res.redirect(`/bugs/${bug.id}`);
});

// GET /bugs/:id/files/:filename — download an attached file
router.get('/:id/files/:filename', (req, res) => {
  const bug = db.prepare(`
    SELECT b.*, p.slug as project_slug FROM bugs b
    JOIN projects p ON b.project_id = p.id
    WHERE b.id = ?
  `).get(req.params.id);

  if (!bug) {
    req.session.flash = { type: 'error', message: 'Bug not found.' };
    return res.redirect('/projects');
  }

  const filename = path.basename(req.params.filename);

  const fileRecord = db.prepare('SELECT * FROM bug_files WHERE bug_id = ? AND filename = ?').get(bug.id, filename);
  if (!fileRecord) {
    req.session.flash = { type: 'error', message: 'File not found.' };
    return res.redirect(`/bugs/${bug.id}`);
  }

  const filePath = path.join(process.env.FILES_DIR, bug.project_slug, String(bug.id), filename);
  if (!fs.existsSync(filePath)) {
    req.session.flash = { type: 'error', message: `"${filename}" is no longer available on disk.` };
    return res.redirect(`/bugs/${bug.id}`);
  }

  res.download(filePath, filename);
});

module.exports = router;
