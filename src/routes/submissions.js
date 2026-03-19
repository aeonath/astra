// Copyright (c) 2026 MiraNova Studios
const express = require('express');
const db = require('../db');
const router = express.Router();

// Middleware: require submissions permission
function requireSubmissionsAccess(req, res, next) {
  if (!res.locals.canManageSubmissions) {
    req.session.flash = { type: 'error', message: 'Access denied.' };
    return res.redirect('/projects');
  }
  next();
}

router.use(requireSubmissionsAccess);

// GET /submissions — list all submissions
router.get('/', (req, res) => {
  const submissions = db.prepare(`
    SELECT s.*, p.name as project_name, b.display_number as imported_display_number
    FROM public_submissions s
    JOIN projects p ON s.project_id = p.id
    LEFT JOIN bugs b ON s.imported_bug_id = b.id
    ORDER BY s.created_at DESC
  `).all();
  res.render('submissions', { title: 'Submissions', submissions });
});

// POST /submissions/:id/import — create a bug/feature from this submission
router.post('/:id/import', (req, res) => {
  const sub = db.prepare('SELECT * FROM public_submissions WHERE id = ?').get(req.params.id);
  if (!sub) {
    req.session.flash = { type: 'error', message: 'Submission not found.' };
    return res.redirect('/submissions');
  }
  if (sub.imported_bug_id) {
    req.session.flash = { type: 'error', message: 'Already imported.' };
    return res.redirect('/submissions');
  }

  const project = db.prepare('SELECT * FROM projects WHERE id = ? AND archived = 0').get(sub.project_id);
  if (!project) {
    req.session.flash = { type: 'error', message: 'Project not found or inactive.' };
    return res.redirect('/submissions');
  }

  const max = db.prepare('SELECT MAX(display_number) as max FROM bugs WHERE project_id = ? AND type = ?').get(sub.project_id, sub.type);
  const displayNumber = (max.max || 0) + 1;

  const result = db.prepare(`
    INSERT INTO bugs (project_id, reporter_id, assignee_id, title, description, priority, type, display_number, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'medium', ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))
  `).run(
    sub.project_id,
    req.session.userId,
    project.default_assignee_id || null,
    sub.title,
    sub.description || null,
    sub.type,
    displayNumber
  );

  db.prepare('UPDATE public_submissions SET imported_bug_id = ?, status = ? WHERE id = ?').run(
    result.lastInsertRowid, 'reviewed', sub.id
  );
  db.prepare("UPDATE projects SET updated_at = datetime('now', 'localtime') WHERE id = ?").run(sub.project_id);

  const prefix = sub.type === 'bug' ? 'BUG' : 'REQ';
  req.session.flash = { type: 'success', message: `Imported as ${prefix}-${String(displayNumber).padStart(3, '0')}.` };
  res.redirect(`/bugs/${result.lastInsertRowid}`);
});

// POST /submissions/:id/status — update submission status
router.post('/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['new', 'reviewed', 'dismissed'];
  if (!validStatuses.includes(status)) {
    return res.redirect('/submissions');
  }
  db.prepare('UPDATE public_submissions SET status = ? WHERE id = ?').run(status, req.params.id);
  req.session.flash = { type: 'success', message: 'Submission status updated.' };
  res.redirect('/submissions');
});

module.exports = router;
