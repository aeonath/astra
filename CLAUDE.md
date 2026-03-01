# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Astra is a bug tracking web application for MiraNova Studios. It uses Node.js, Express 5, SQLite (better-sqlite3), and server-rendered EJS templates with a dark space-inspired theme.

- **Production:** https://astra.miranova.studio (Debian, Nginx reverse proxy, Let's Encrypt)
- **Development:** http://localhost:9000

## Commands

- `npm run dev` — Start dev server with auto-reload (nodemon)
- `npm start` — Start production server
- `npm run seed` — Create default admin user (admin/admin) and sample project

No test framework is configured yet.

## Architecture

**Request flow:** `server.js` → `app.js` (middleware stack) → route handlers → EJS views

**Middleware order in app.js:** helmet → morgan → body parsers → static files → session (SQLite-backed) → flash → locals (injects `currentUser`, `isAdmin`, `currentPath` into all views) → routes → error handlers

**Route access control:**
- `/` and `/projects` — Public (filtered by `project.public` flag for visitors)
- `/bugs/*` — Requires login (`requireLogin` middleware)
- `/admin/*` — Requires admin role (`requireAdmin` middleware)

**Database:** SQLite with WAL mode and foreign keys enabled. Schema initialized on app start via `src/db/schema.js`. Sessions stored in a separate `data/sessions.db`.

**Migrations:** Use the `migrate(db, name, sql)` function in `src/db/schema.js`. It tracks applied migrations in a `_migrations` table and only runs each migration once. Add new migrations after existing ones.

**Views:** EJS templates using a partials pattern — every page includes `partials/header.ejs` and `partials/footer.ejs`. No layout engine.

**Flash messages:** Set `req.session.flash = { type: 'success'|'error', message: '...' }` then redirect. The flash middleware auto-clears after one read.

## Conventions

- Every `.js` source file must start with `// Copyright (c) 2026 MiraNova Studios`
- Footer displays: © 2026 MiraNova Studios
- Bug statuses: `open`, `in_progress`, `resolved`, `closed`, `wontfix`
- Bug priorities: `critical`, `high`, `medium`, `low`
- User roles: `admin`, `user`
- Project slugs auto-generated from name (lowercase, hyphens, no special chars)
- Passwords hashed with bcrypt (cost factor 12)
- CSS uses custom properties defined at the top of `public/css/style.css`

## After Every Change

1. **Changelog:** Write a changelog entry to `changelog/YYYYMMDD-HHMM-CHANGELOG.md` summarizing what was changed and why.
2. **Commit:** Run `git add .` then `git commit -a -m "brief summary"` after every task the user asks you to do. Do not skip this.
