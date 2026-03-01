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

# Copy and edit environment config
cp .env.example .env
# Edit .env — DB_PATH must be an absolute path

# Initialize the database
npm run db:init

# Seed default admin user and sample project
npm run seed

# Start dev server with auto-reload
npm run dev
```

The app runs at **http://localhost:9000** by default.

### Default Login

- **Username:** `admin`
- **Password:** `admin`

### Setting the Admin Password

The admin password **cannot be changed from the web UI**. Use the CLI:

```bash
npm run reset-password -- admin yournewpassword
```

Change the default password immediately after first login.

## Configuration

Copy `.env.example` to `.env` and adjust:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `9000` | Server port |
| `HOST` | `localhost` | Bind address |
| `SESSION_SECRET` | — | Secret for session signing |
| `DB_PATH` | — | Absolute path to SQLite database (required) |
| `SESSION_DB_DIR` | same dir as `DB_PATH` | Directory for session database |
| `NODE_ENV` | `development` | Environment mode |

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start production server |
| `npm run dev` | Start dev server with auto-reload |
| `npm run db:init` | Create and initialize a new database |
| `npm run db:migrate` | Run pending database migrations |
| `npm run seed` | Seed default admin user and sample project |
| `npm run reset-password -- <user> <pass>` | Reset a user's password via CLI |

## Database

The database must live **outside** the application source tree in production. `DB_PATH` must be set to an absolute path. The app will refuse to start if the database is missing or has pending migrations.

See [SETUP.md](SETUP.md) for full production deployment instructions.

## Production

Target: Debian server at `https://astra.miranova.studio` (port 443, HTTPS via reverse proxy).
