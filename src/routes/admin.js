// Copyright (c) 2026 MiraNova Studios
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const router = express.Router();

// --- Dashboard ---
router.get('/', (req, res) => {
  const stats = {
    users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    projects: db.prepare('SELECT COUNT(*) as count FROM projects').get().count,
    openBugs: db.prepare("SELECT COUNT(*) as count FROM bugs WHERE status = 'open'").get().count,
    totalBugs: db.prepare('SELECT COUNT(*) as count FROM bugs').get().count,
  };
  res.render('admin/dashboard', { title: 'Admin Dashboard', stats });
});

// --- Projects Management ---
router.get('/projects', (req, res) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY name').all();
  res.render('admin/projects', { title: 'Manage Projects', projects });
});

router.post('/projects', (req, res) => {
  const { name, description } = req.body;
  const isPublic = req.body.public === 'on' ? 1 : 0;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  if (!name || !slug) {
    req.session.flash = { type: 'error', message: 'Project name is required.' };
    return res.redirect('/admin/projects');
  }

  try {
    db.prepare('INSERT INTO projects (name, slug, description, public) VALUES (?, ?, ?, ?)').run(name, slug, description || null, isPublic);
    req.session.flash = { type: 'success', message: `Project "${name}" created.` };
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      req.session.flash = { type: 'error', message: 'A project with that name already exists.' };
    } else {
      throw err;
    }
  }
  res.redirect('/admin/projects');
});

router.post('/projects/:id/toggle', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (project) {
    db.prepare('UPDATE projects SET active = ?, updated_at = datetime("now") WHERE id = ?').run(project.active ? 0 : 1, project.id);
    req.session.flash = { type: 'success', message: `Project "${project.name}" ${project.active ? 'archived' : 'restored'}.` };
  }
  res.redirect('/admin/projects');
});

router.post('/projects/:id/visibility', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (project) {
    db.prepare('UPDATE projects SET public = ?, updated_at = datetime("now") WHERE id = ?').run(project.public ? 0 : 1, project.id);
    req.session.flash = { type: 'success', message: `Project "${project.name}" is now ${project.public ? 'private' : 'public'}.` };
  }
  res.redirect('/admin/projects');
});

router.post('/projects/:id/delete', (req, res) => {
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
  res.redirect('/admin/projects');
});

// --- Users Management ---
router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, username, display_name, email, role, active, created_at FROM users ORDER BY username').all();
  res.render('admin/users', { title: 'Manage Users', users });
});

router.post('/users', async (req, res) => {
  const { username, display_name, email, password, role } = req.body;

  if (!username || !display_name || !email || !password) {
    req.session.flash = { type: 'error', message: 'All fields are required.' };
    return res.redirect('/admin/users');
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    db.prepare('INSERT INTO users (username, display_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)')
      .run(username, display_name, email, hash, role === 'admin' ? 'admin' : 'user');
    req.session.flash = { type: 'success', message: `User "${username}" created.` };
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      req.session.flash = { type: 'error', message: 'Username or email already exists.' };
    } else {
      throw err;
    }
  }
  res.redirect('/admin/users');
});

router.post('/users/:id/toggle', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (user && user.id !== req.session.userId) {
    db.prepare('UPDATE users SET active = ?, updated_at = datetime("now") WHERE id = ?').run(user.active ? 0 : 1, user.id);
    req.session.flash = { type: 'success', message: `User "${user.username}" ${user.active ? 'disabled' : 'enabled'}.` };
  } else if (user && user.id === req.session.userId) {
    req.session.flash = { type: 'error', message: 'You cannot disable your own account.' };
  }
  res.redirect('/admin/users');
});

router.post('/users/:id/reset-password', async (req, res) => {
  const { password } = req.body;
  if (!password) {
    req.session.flash = { type: 'error', message: 'Password is required.' };
    return res.redirect('/admin/users');
  }
  const hash = await bcrypt.hash(password, 12);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?').run(hash, req.params.id);
  req.session.flash = { type: 'success', message: 'Password reset successfully.' };
  res.redirect('/admin/users');
});

module.exports = router;
