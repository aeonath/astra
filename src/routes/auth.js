// Copyright (c) 2026 MiraNova Studios
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { requireLogin } = require('../middleware/auth');
const router = express.Router();

// GET /login
router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/projects');
  res.render('auth/login', { title: 'Login' });
});

// POST /login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    req.session.flash = { type: 'error', message: 'Username and password are required.' };
    return res.redirect('/login');
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ? AND active = 1').get(username);

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    req.session.flash = { type: 'error', message: 'Invalid username or password.' };
    return res.redirect('/login');
  }

  req.session.userId = user.id;
  req.session.userRole = user.role;
  req.session.flash = { type: 'success', message: `Welcome back, ${user.display_name}.` };
  res.redirect(user.role === 'admin' ? '/admin' : '/projects');
});

// POST /logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// GET /profile
router.get('/profile', requireLogin, (req, res) => {
  const user = db.prepare('SELECT id, username, display_name, email FROM users WHERE id = ?').get(req.session.userId);
  res.render('auth/profile', { title: 'My Profile', user });
});

// POST /profile/display-name
router.post('/profile/display-name', requireLogin, (req, res) => {
  const display_name = (req.body.display_name || '').trim();
  if (!display_name) {
    req.session.flash = { type: 'error', message: 'Display name cannot be empty.' };
    return res.redirect('/profile');
  }
  db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(display_name, req.session.userId);
  req.session.flash = { type: 'success', message: 'Display name updated.' };
  res.redirect('/profile');
});

// POST /profile/password
router.post('/profile/password', requireLogin, async (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;
  if (!current_password || !new_password || !confirm_password) {
    req.session.flash = { type: 'error', message: 'All password fields are required.' };
    return res.redirect('/profile');
  }
  if (new_password !== confirm_password) {
    req.session.flash = { type: 'error', message: 'New passwords do not match.' };
    return res.redirect('/profile');
  }
  if (new_password.length < 8) {
    req.session.flash = { type: 'error', message: 'New password must be at least 8 characters.' };
    return res.redirect('/profile');
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  if (!(await bcrypt.compare(current_password, user.password_hash))) {
    req.session.flash = { type: 'error', message: 'Current password is incorrect.' };
    return res.redirect('/profile');
  }
  const hash = await bcrypt.hash(new_password, 12);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.session.userId);
  req.session.flash = { type: 'success', message: 'Password changed successfully.' };
  res.redirect('/profile');
});

module.exports = router;
