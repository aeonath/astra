// Copyright (c) 2026 MiraNova Studios
const express = require('express');
const db = require('../db');
const router = express.Router();

// Middleware: require projects permission
function requireProjectsAccess(req, res, next) {
  if (!res.locals.canManageProjects) {
    req.session.flash = { type: 'error', message: 'Access denied.' };
    return res.redirect('/projects');
  }
  next();
}

router.use(requireProjectsAccess);

// GET /manage/projects — list all projects
router.get('/', (req, res) => {
  const projects = db.prepare(`
    SELECT p.*, u.display_name as assignee_name, c.name as category_name
    FROM projects p
    LEFT JOIN users u ON p.default_assignee_id = u.id
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.name
  `).all();
  const users = db.prepare('SELECT id, display_name FROM users WHERE active = 1 ORDER BY display_name').all();
  const categories = db.prepare('SELECT id, name FROM categories ORDER BY sort_order').all();
  res.render('admin/projects', { title: 'Manage Projects', projects, users, categories });
});

// POST /manage/projects — create or edit project
router.post('/', (req, res) => {
  const { edit_id, name, description, default_assignee_id, category_id, homepage_url } = req.body;
  let github_url = req.body.github_url ? req.body.github_url.trim() : '';
  if (github_url && !github_url.startsWith('http')) {
    github_url = 'https://github.com/' + github_url;
  }
  const projectActive = req.body.project_active === 'on' ? 1 : 0;
  const isPublic = req.body.public === 'on' ? 1 : 0;
  const githubPrivate = req.body.github_private === 'on' ? 1 : 0;

  // Edit existing project
  if (edit_id) {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(edit_id);
    if (!project) {
      req.session.flash = { type: 'error', message: 'Project not found.' };
      return res.redirect('/manage/projects');
    }

    if (!description && !name) {
      req.session.flash = { type: 'error', message: 'Project name is required.' };
      return res.redirect('/manage/projects');
    }

    db.prepare(`UPDATE projects SET description = ?, active = ?, public = ?, default_assignee_id = ?, category_id = ?, homepage_url = ?, github_url = ?, github_private = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(description || null, projectActive, isPublic, default_assignee_id || null, category_id || null, homepage_url || null, github_url || null, githubPrivate, project.id);
    req.session.flash = { type: 'success', message: `Project "${project.name}" updated.` };
    return res.redirect('/manage/projects');
  }

  // Create new project
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  if (!name || !slug) {
    req.session.flash = { type: 'error', message: 'Project name is required.' };
    return res.redirect('/manage/projects');
  }

  try {
    db.prepare('INSERT INTO projects (name, slug, description, active, public, default_assignee_id, category_id, homepage_url, github_url, github_private) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(name, slug, description || null, projectActive, isPublic, default_assignee_id || null, category_id || null, homepage_url || null, github_url || null, githubPrivate);
    req.session.flash = { type: 'success', message: `Project "${name}" created.` };
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      req.session.flash = { type: 'error', message: 'A project with that name already exists.' };
    } else {
      throw err;
    }
  }
  res.redirect('/manage/projects');
});

// POST /manage/projects/:id/toggle — toggle active flag
router.post('/:id/toggle', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (project) {
    db.prepare(`UPDATE projects SET archived = ?, updated_at = datetime('now') WHERE id = ?`).run(project.archived ? 0 : 1, project.id);
    req.session.flash = { type: 'success', message: `Project "${project.name}" ${project.archived ? 'restored' : 'archived'}.` };
  }
  res.redirect('/manage/projects');
});

// POST /manage/projects/:id/delete — delete project
router.post('/:id/delete', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (project) {
    const bugCount = db.prepare('SELECT COUNT(*) as count FROM bugs WHERE project_id = ?').get(project.id).count;
    if (bugCount > 0) {
      req.session.flash = { type: 'error', message: `Cannot delete "${project.name}" — it has ${bugCount} bug(s). Archive it instead.` };
    } else {
      db.prepare('DELETE FROM projects WHERE id = ?').run(project.id);
      req.session.flash = { type: 'success', message: `Project "${project.name}" deleted.` };
    }
  }
  res.redirect('/manage/projects');
});

module.exports = router;
