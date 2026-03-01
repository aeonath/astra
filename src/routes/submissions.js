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
    SELECT s.*, p.name as project_name
    FROM public_submissions s
    JOIN projects p ON s.project_id = p.id
    ORDER BY s.created_at DESC
  `).all();
  res.render('submissions', { title: 'Submissions', submissions });
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
