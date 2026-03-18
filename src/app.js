// Copyright (c) 2026 MiraNova Studios
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const db = require('./db');

const app = express();

// Security headers (relaxed CSP for inline styles used in templates)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "https://www.google.com/recaptcha/", "https://www.gstatic.com/recaptcha/"],
      frameSrc: ["https://www.google.com/recaptcha/", "https://recaptcha.google.com/"],
      imgSrc: ["'self'", "data:"],
    },
  },
}));

// Request logging
app.use(morgan('short'));

// Body parsing
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Session store — lives alongside the main database by default
const sessionDbDir = process.env.SESSION_DB_DIR || path.dirname(process.env.DB_PATH);

// Session
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: sessionDbDir,
  }),
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    httpOnly: true,
    sameSite: 'lax',
  },
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Flash messages & locals middleware
app.use(require('./middleware/flash'));
app.use(require('./middleware/locals'));

// Routes
app.use('/', require('./routes/auth'));
app.use('/admin', require('./middleware/auth').requireAdmin, require('./routes/admin'));
app.use('/projects/summary', require('./middleware/auth').requireLogin, require('./routes/project-summary'));
app.use('/projects', require('./routes/projects'));
app.use('/bugs', require('./middleware/auth').requireLogin, require('./routes/bugs'));
app.use('/submissions', require('./middleware/auth').requireLogin, require('./routes/submissions'));
app.use('/manage/projects', require('./middleware/auth').requireLogin, require('./routes/manage-projects'));

// Public landing page
app.get('/', require('./routes/landing'));

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 - Not Found',
    message: 'The page you are looking for does not exist.',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: '500 - Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong.',
  });
});

module.exports = app;
