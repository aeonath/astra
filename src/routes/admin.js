// Copyright (c) 2026 MiraNova Studios
const express = require('express');
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const path = require('path');
const db = require('../db');
const notifications = require('../notifications');
const router = express.Router();

// --- Dashboard ---
router.get('/', (req, res) => {
  res.render('admin/dashboard', { title: 'Admin' });
});

// --- Projects Management ---
router.get('/projects', (req, res) => {
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

router.post('/projects', (req, res) => {
  const { edit_id, name, description, default_assignee_id, category_id, homepage_url } = req.body;
  let github_url = req.body.github_url ? req.body.github_url.trim() : '';
  if (github_url && !github_url.startsWith('http')) {
    github_url = 'https://github.com/' + github_url;
  }
  const projectActive = req.body.project_active === 'on' ? 1 : 0;
  const internallyVisible = req.body.internally_visible === 'on' ? 1 : 0;
  const isPublic = internallyVisible && req.body.public === 'on' ? 1 : 0;
  const githubPrivate = req.body.github_private === 'on' ? 1 : 0;

  // Edit existing project
  if (edit_id) {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(edit_id);
    if (!project) {
      req.session.flash = { type: 'error', message: 'Project not found.' };
      return res.redirect('/admin/projects');
    }

    if (!description && !name) {
      req.session.flash = { type: 'error', message: 'Project name is required.' };
      return res.redirect('/admin/projects');
    }

    db.prepare(`UPDATE projects SET description = ?, active = ?, internally_visible = ?, public = ?, default_assignee_id = ?, category_id = ?, homepage_url = ?, github_url = ?, github_private = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(description || null, projectActive, internallyVisible, isPublic, default_assignee_id || null, category_id || null, homepage_url || null, github_url || null, githubPrivate, project.id);
    req.session.flash = { type: 'success', message: `Project "${project.name}" updated.` };
    return res.redirect('/admin/projects');
  }

  // Create new project
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  if (!name || !slug) {
    req.session.flash = { type: 'error', message: 'Project name is required.' };
    return res.redirect('/admin/projects');
  }

  try {
    db.prepare('INSERT INTO projects (name, slug, description, active, internally_visible, public, default_assignee_id, category_id, homepage_url, github_url, github_private) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(name, slug, description || null, projectActive, internallyVisible, isPublic, default_assignee_id || null, category_id || null, homepage_url || null, github_url || null, githubPrivate);
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
    db.prepare(`UPDATE projects SET archived = ?, updated_at = datetime('now') WHERE id = ?`).run(project.archived ? 0 : 1, project.id);
    req.session.flash = { type: 'success', message: `Project "${project.name}" ${project.archived ? 'restored' : 'archived'}.` };
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
  const users = db.prepare('SELECT id, username, display_name, email, role, active, can_manage_submissions, can_manage_projects, created_at FROM users ORDER BY username').all();
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

    const canManageSubs = req.body.can_manage_submissions === '1' ? 1 : 0;
    const canManageProjs = req.body.can_manage_projects === '1' ? 1 : 0;
    db.prepare(`UPDATE users SET display_name = ?, email = ?, role = ?, can_manage_submissions = ?, can_manage_projects = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(display_name, email, role === 'admin' ? 'admin' : 'user', canManageSubs, canManageProjs, user.id);

    if (password) {
      const hash = await bcrypt.hash(password, 12);
      db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`).run(hash, user.id);
    }

    req.session.flash = { type: 'success', message: `User "${user.username}" updated.` };
    return res.redirect('/admin/users');
  }

  // Create new user
  if (!username || !display_name || !email || !password) {
    req.session.flash = { type: 'error', message: 'All fields are required.' };
    return res.redirect('/admin/users');
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    const canManageSubs = req.body.can_manage_submissions === '1' ? 1 : 0;
    const canManageProjs = req.body.can_manage_projects === '1' ? 1 : 0;
    db.prepare('INSERT INTO users (username, display_name, email, password_hash, role, can_manage_submissions, can_manage_projects) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(username, display_name, email, hash, role === 'admin' ? 'admin' : 'user', canManageSubs, canManageProjs);
    req.session.flash = { type: 'success', message: `User "${username}" created.` };
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      req.session.flash = { type: 'error', message: 'That username already exists.' };
    } else {
      throw err;
    }
  }
  res.redirect('/admin/users');
});

router.post('/users/:id/delete', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.redirect('/admin/users');

  if (user.role === 'admin') {
    req.session.flash = { type: 'error', message: 'Admin accounts cannot be removed.' };
    return res.redirect('/admin/users');
  }

  const bugCount = db.prepare('SELECT COUNT(*) as count FROM bugs WHERE reporter_id = ?').get(user.id).count;
  const commentCount = db.prepare('SELECT COUNT(*) as count FROM comments WHERE user_id = ?').get(user.id).count;

  if (bugCount > 0 || commentCount > 0) {
    const parts = [];
    if (bugCount > 0) parts.push(`${bugCount} reported bug(s)`);
    if (commentCount > 0) parts.push(`${commentCount} comment(s)`);
    req.session.flash = { type: 'error', message: `Cannot remove "${user.username}" — they have ${parts.join(' and ')}. Reassign those first.` };
    return res.redirect('/admin/users');
  }

  db.prepare('UPDATE bugs SET assignee_id = NULL WHERE assignee_id = ?').run(user.id);
  db.prepare('UPDATE projects SET default_assignee_id = NULL WHERE default_assignee_id = ?').run(user.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(user.id);

  req.session.flash = { type: 'success', message: `User "${user.username}" removed.` };
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

// --- Categories Management ---
router.get('/categories', (req, res) => {
  const categories = db.prepare(`
    SELECT c.*, (SELECT COUNT(*) FROM projects WHERE category_id = c.id) as project_count
    FROM categories c
    ORDER BY c.sort_order
  `).all();
  res.render('admin/categories', { title: 'Manage Categories', categories });
});

router.post('/categories', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    req.session.flash = { type: 'error', message: 'Category name is required.' };
    return res.redirect('/admin/categories');
  }

  try {
    const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM categories').get().max || 0;
    db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)').run(name.trim(), maxOrder + 1);
    req.session.flash = { type: 'success', message: `Category "${name.trim()}" created.` };
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      req.session.flash = { type: 'error', message: 'A category with that name already exists.' };
    } else {
      throw err;
    }
  }
  res.redirect('/admin/categories');
});

router.post('/categories/:id/move-up', (req, res) => {
  const current = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (current) {
    const prev = db.prepare('SELECT * FROM categories WHERE sort_order < ? ORDER BY sort_order DESC LIMIT 1').get(current.sort_order);
    if (prev) {
      db.prepare('UPDATE categories SET sort_order = ? WHERE id = ?').run(prev.sort_order, current.id);
      db.prepare('UPDATE categories SET sort_order = ? WHERE id = ?').run(current.sort_order, prev.id);
    }
  }
  res.redirect('/admin/categories');
});

router.post('/categories/:id/move-down', (req, res) => {
  const current = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (current) {
    const next = db.prepare('SELECT * FROM categories WHERE sort_order > ? ORDER BY sort_order ASC LIMIT 1').get(current.sort_order);
    if (next) {
      db.prepare('UPDATE categories SET sort_order = ? WHERE id = ?').run(next.sort_order, current.id);
      db.prepare('UPDATE categories SET sort_order = ? WHERE id = ?').run(current.sort_order, next.id);
    }
  }
  res.redirect('/admin/categories');
});

router.post('/categories/:id/delete', (req, res) => {
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (category) {
    const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects WHERE category_id = ?').get(category.id).count;
    if (projectCount > 0) {
      req.session.flash = { type: 'error', message: `Cannot delete "${category.name}" — it has ${projectCount} project(s). Reassign them first.` };
    } else {
      db.prepare('DELETE FROM categories WHERE id = ?').run(category.id);
      req.session.flash = { type: 'success', message: `Category "${category.name}" deleted.` };
    }
  }
  res.redirect('/admin/categories');
});

// --- Site Settings ---
router.get('/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM site_settings').all();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  res.render('admin/settings', { title: 'Site Settings', settings });
});

router.post('/settings', (req, res) => {
  const { tagline, footer_text } = req.body;
  const showReportBug = req.body.show_report_bug_button === 'on' ? '1' : '0';
  const showRequestFeature = req.body.show_request_feature_button === 'on' ? '1' : '0';
  const tableColPriority = req.body.table_col_priority === 'on' ? '1' : '0';
  const tableColStatus = req.body.table_col_status === 'on' ? '1' : '0';
  const tableColAssignee = req.body.table_col_assignee === 'on' ? '1' : '0';
  const tableColCreated = req.body.table_col_created === 'on' ? '1' : '0';
  const update = db.prepare('UPDATE site_settings SET value = ? WHERE key = ?');
  update.run(tagline || '', 'tagline');
  update.run(footer_text || '', 'footer_text');
  update.run(showReportBug, 'show_report_bug_button');
  update.run(showRequestFeature, 'show_request_feature_button');
  update.run(tableColPriority, 'table_col_priority');
  update.run(tableColStatus, 'table_col_status');
  update.run(tableColAssignee, 'table_col_assignee');
  update.run(tableColCreated, 'table_col_created');
  req.session.flash = { type: 'success', message: 'Site settings updated.' };
  res.redirect('/admin/settings');
});

// --- Public Submissions ---
router.get('/submissions', (req, res) => {
  const submissions = db.prepare(`
    SELECT s.*, p.name as project_name
    FROM public_submissions s
    JOIN projects p ON s.project_id = p.id
    ORDER BY s.created_at DESC
  `).all();
  res.render('admin/submissions', { title: 'Submissions', submissions });
});

router.post('/submissions/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['new', 'reviewed', 'dismissed'];
  if (!validStatuses.includes(status)) {
    return res.redirect('/admin/submissions');
  }
  db.prepare('UPDATE public_submissions SET status = ? WHERE id = ?').run(status, req.params.id);
  req.session.flash = { type: 'success', message: 'Submission status updated.' };
  res.redirect('/admin/submissions');
});

router.post('/submissions/:id/import', (req, res) => {
  const sub = db.prepare('SELECT s.*, p.default_assignee_id FROM public_submissions s JOIN projects p ON p.id = s.project_id WHERE s.id = ?').get(req.params.id);
  if (!sub) {
    req.session.flash = { type: 'error', message: 'Submission not found.' };
    return res.redirect('/admin/submissions');
  }
  if (sub.imported_bug_id) {
    req.session.flash = { type: 'error', message: 'Already imported.' };
    return res.redirect('/admin/submissions');
  }

  const max = db.prepare('SELECT MAX(display_number) as max FROM bugs WHERE project_id = ? AND type = ?').get(sub.project_id, sub.type);
  const displayNumber = (max.max || 0) + 1;

  const result = db.prepare(`
    INSERT INTO bugs (project_id, reporter_id, assignee_id, title, description, priority, type, display_number)
    VALUES (?, ?, ?, ?, ?, 'medium', ?, ?)
  `).run(sub.project_id, req.session.userId, sub.default_assignee_id || null, sub.title, sub.description || null, sub.type, displayNumber);

  const bugId = result.lastInsertRowid;

  const commentLines = ['**Imported from public submission**', ''];
  commentLines.push(`Submitter: ${sub.name}${sub.email ? ' <' + sub.email + '>' : ''}`);
  commentLines.push(`Original title: ${sub.title}`);
  if (sub.description) {
    commentLines.push('');
    commentLines.push('Original details:');
    commentLines.push(sub.description);
  }

  db.prepare('INSERT INTO comments (bug_id, user_id, content) VALUES (?, ?, ?)').run(bugId, req.session.userId, commentLines.join('\n'));
  db.prepare('UPDATE public_submissions SET imported_bug_id = ?, status = ? WHERE id = ?').run(bugId, 'reviewed', sub.id);

  const prefix = sub.type === 'bug' ? 'BUG' : 'REQ';
  req.session.flash = { type: 'success', message: `${prefix}-${String(displayNumber).padStart(3, '0')} created from submission.` };
  res.redirect(`/bugs/${bugId}`);
});

// --- SSE Notification Stream ---
router.get('/notifications/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  notifications.addClient(res);

  // Heartbeat every 25s to keep the connection alive through proxies
  const heartbeat = setInterval(() => {
    try { res.write(':heartbeat\n\n'); } catch (e) {}
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    notifications.removeClient(res);
  });
});

module.exports = router;
