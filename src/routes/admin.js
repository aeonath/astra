// Copyright (c) 2026 MiraNova Studios
const express = require('express');
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const path = require('path');
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
    db.prepare(`UPDATE projects SET active = ?, updated_at = datetime('now') WHERE id = ?`).run(project.active ? 0 : 1, project.id);
    req.session.flash = { type: 'success', message: `Project "${project.name}" ${project.active ? 'archived' : 'restored'}.` };
  }
  res.redirect('/admin/projects');
});

router.post('/projects/:id/visibility', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (project) {
    db.prepare(`UPDATE projects SET public = ?, updated_at = datetime('now') WHERE id = ?`).run(project.public ? 0 : 1, project.id);
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
  const { edit_id, username, display_name, email, password, role } = req.body;

  // Edit existing user
  if (edit_id) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(edit_id);
    if (!user) {
      req.session.flash = { type: 'error', message: 'User not found.' };
      return res.redirect('/admin/users');
    }

    if (!display_name || !email) {
      req.session.flash = { type: 'error', message: 'Display name and email are required.' };
      return res.redirect('/admin/users');
    }

    try {
      db.prepare(`UPDATE users SET display_name = ?, email = ?, role = ?, updated_at = datetime('now') WHERE id = ?`)
        .run(display_name, email, role === 'admin' ? 'admin' : 'user', user.id);
      req.session.flash = { type: 'success', message: `User "${user.username}" updated.` };
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        req.session.flash = { type: 'error', message: 'That email is already in use.' };
      } else {
        throw err;
      }
    }
    return res.redirect('/admin/users');
  }

  // Create new user
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
  if (!user) {
    return res.redirect('/admin/users');
  }

  if (user.role === 'admin') {
    req.session.flash = { type: 'error', message: 'Admin accounts cannot be disabled.' };
  } else {
    db.prepare(`UPDATE users SET active = ?, updated_at = datetime('now') WHERE id = ?`).run(user.active ? 0 : 1, user.id);
    req.session.flash = { type: 'success', message: `User "${user.username}" ${user.active ? 'disabled' : 'enabled'}.` };
  }
  res.redirect('/admin/users');
});

router.post('/users/:id/reset-password', async (req, res) => {
  const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    req.session.flash = { type: 'error', message: 'User not found.' };
    return res.redirect('/admin/users');
  }

  if (user.role === 'admin') {
    req.session.flash = { type: 'error', message: 'Admin passwords must be reset via the command line: npm run reset-password' };
    return res.redirect('/admin/users');
  }

  const { password } = req.body;
  if (!password) {
    req.session.flash = { type: 'error', message: 'Password is required.' };
    return res.redirect('/admin/users');
  }

  const hash = await bcrypt.hash(password, 12);
  db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`).run(hash, user.id);

  // Destroy the user's sessions to force them to log in with the new password
  const sessionDbDir = process.env.SESSION_DB_DIR || path.dirname(process.env.DB_PATH);
  const sessDb = new Database(path.join(sessionDbDir, 'sessions.db'));
  const sessions = sessDb.prepare('SELECT sid, sess FROM sessions').all();
  for (const row of sessions) {
    try {
      const data = JSON.parse(row.sess);
      if (data.userId === user.id) {
        sessDb.prepare('DELETE FROM sessions WHERE sid = ?').run(row.sid);
      }
    } catch (_) { /* skip malformed session rows */ }
  }
  sessDb.close();

  req.session.flash = { type: 'success', message: `Password reset for "${user.username}". They have been logged out.` };
  res.redirect('/admin/users');
});

module.exports = router;
