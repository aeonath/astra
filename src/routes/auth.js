// Copyright (c) 2026 MiraNova Studios
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
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
  res.redirect('/projects');
});

// POST /logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
