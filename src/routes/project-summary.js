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
    WHERE p.active = 1 AND p.archived = 0
    ORDER BY p.summary_sort_order, p.name
  `).all();

  res.render('projects/summary', { title: 'Projects Summary', projects, categories });
});

// POST /projects/summary/reorder — save new card order (JSON)
router.post('/reorder', (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) {
    return res.status(400).json({ error: 'Invalid order.' });
  }
  const stmt = db.prepare('UPDATE projects SET summary_sort_order = ? WHERE id = ?');
  const run = db.transaction(() => {
    order.forEach((id, i) => stmt.run(i, id));
  });
  run();
  res.json({ success: true });
});

// POST /projects/summary/:id/card — save project card details
router.post('/:id/card', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) {
    if (req.headers['accept'] === 'application/json') {
      return res.status(404).json({ error: 'Project not found.' });
    }
    req.session.flash = { type: 'error', message: 'Project not found.' };
    return res.redirect('/projects/summary');
  }

  const { nickname, scope, purpose, project_status, tags } = req.body;
  db.prepare(`
    UPDATE projects
    SET nickname = ?, scope = ?, purpose = ?, project_status = ?, tags = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    (nickname || '').trim(),
    (scope || '').trim(),
    (purpose || '').trim(),
    (project_status || '').trim(),
    (tags || '').trim(),
    project.id
  );

  if (req.headers['accept'] === 'application/json') {
    return res.json({ success: true });
  }

  const returnTo = req.body.return_to || '/projects/summary';
  req.session.flash = { type: 'success', message: `Project card for "${project.name}" updated.` };
  res.redirect(returnTo);
});

// POST /projects/summary/:id/summary-notes — save project card summary notes (JSON)
router.post('/:id/summary-notes', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }
  const summaryNotes = (req.body.summary_notes || '').trim();
  db.prepare("UPDATE projects SET summary_notes = ?, updated_at = datetime('now') WHERE id = ?").run(summaryNotes, project.id);
  res.json({ success: true });
});

module.exports = router;
