# Astra

Bug tracking database for all projects at Miranova Studio.

## Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite (via better-sqlite3)
- **Templating:** EJS (server-side rendered)
- **Auth:** bcrypt + express-session (SQLite-backed sessions)

## Quick Start

```bash
# Install dependencies
npm install

# Seed the database (creates admin user + sample project)
npm run seed

# Start dev server with auto-reload
npm run dev

# Or start production server
npm start
```

The app runs at **http://localhost:9000** by default.

### Default Login

- **Username:** `admin`
- **Password:** `admin`

Change this immediately after first login.

## Configuration

Copy `.env.example` to `.env` and adjust:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `9000` | Server port |
| `HOST` | `localhost` | Bind address |
| `SESSION_SECRET` | — | Secret for session signing |
| `DB_PATH` | `./data/astra.db` | Path to SQLite database |
| `NODE_ENV` | `development` | Environment mode |

## Production

Target: Debian server at `https://astra.miranova.studio` (port 443, HTTPS via reverse proxy).
