# Astra Production Setup

Deploy Astra to a Debian server on AWS, accessible at `https://astra.miranova.studio`.

Architecture: `Internet → :443 (Nginx w/ TLS) → :9000 (Node/Astra)`

## 1. DNS

Point `astra.miranova.studio` to the EC2 instance's public IP with an A record (Route 53 or wherever DNS is managed). This must be done **before** step 7 — Let's Encrypt validates via DNS.

## 2. AWS Security Group

Ensure the EC2 security group allows inbound:

- **TCP 22** — SSH
- **TCP 80** — Let's Encrypt HTTP challenge + redirect
- **TCP 443** — HTTPS

## 3. Install server dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# Install Nginx and Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Install build tools (needed for bcrypt/better-sqlite3 native modules)
sudo apt install -y build-essential python3
```

## 4. Deploy the app

```bash
# Create app user
sudo useradd -r -m -s /bin/bash astra

# Clone the repo (adjust URL to your actual repo)
sudo -u astra git clone https://github.com/aeonath/astra.git /home/astra/app

# Install dependencies
cd /home/astra/app
sudo -u astra npm install --production

# Create .env
sudo -u astra cp .env.example .env
sudo -u astra nano /home/astra/app/.env
```

Set `.env` to:

```
PORT=9000
HOST=127.0.0.1
SESSION_SECRET=<paste-random-string-here>
DB_PATH=/var/lib/astra/astra.db
NODE_ENV=production
```

Generate a real session secret:

```bash
openssl rand -hex 32
```

Initialize the database:

```bash
# Create the database directory (outside the app source tree)
sudo mkdir -p /var/lib/astra
sudo chown astra:astra /var/lib/astra

# Initialize the database (one-time only — refuses to overwrite)
cd /home/astra/app && sudo -u astra npm run db:init

# Seed the default admin user and sample project
cd /home/astra/app && sudo -u astra npm run seed
```

Default login will be `admin` / `admin` — change the password immediately after first login.

> **Important:** The database lives at `/var/lib/astra/astra.db`, outside the application directory. This ensures that `git pull`, redeploys, and restarts can never wipe the database. The app will refuse to start if the database is missing or has pending migrations.

## 5. Create systemd service

```bash
sudo nano /etc/systemd/system/astra.service
```

Contents:

```ini
[Unit]
Description=Astra Bug Tracker
After=network.target

[Service]
Type=simple
User=astra
WorkingDirectory=/home/astra/app
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable astra
sudo systemctl start astra
sudo systemctl status astra
```

## 6. Configure Nginx reverse proxy

```bash
sudo nano /etc/nginx/sites-available/astra
```

Contents:

```nginx
server {
    listen 80;
    server_name astra.miranova.studio;

    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/astra /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Get TLS certificate

Certbot handles everything — cert issuance, Nginx HTTPS config, and HTTP→HTTPS redirect:

```bash
sudo certbot --nginx -d astra.miranova.studio
```

Verify auto-renewal works:

```bash
sudo certbot renew --dry-run
```

Certs auto-renew every 60–90 days via systemd timer.

## 8. Verify

Visit `https://astra.miranova.studio` — you should see the Astra login page.

## Updating Astra

To deploy updates after pushing new code:

```bash
cd /home/astra/app
sudo -u astra git pull
sudo -u astra npm install --production

# Apply any new database migrations (safe — only runs unapplied migrations)
sudo -u astra npm run db:migrate

sudo systemctl restart astra
```

> **Note:** If there are pending migrations, Astra will refuse to start until `npm run db:migrate` is run. This is intentional — the app never modifies the database schema automatically.

## Migrating an Existing Installation

If upgrading from a version that used the old `_migrations` table:

```bash
cd /home/astra/app

# Move the database outside the source tree (if it was in ./data/)
sudo mkdir -p /var/lib/astra
sudo mv data/astra.db /var/lib/astra/astra.db
sudo chown astra:astra /var/lib/astra/astra.db

# Update .env to use the new absolute path
# DB_PATH=/var/lib/astra/astra.db

# Bridge legacy migrations to the new system
sudo -u astra npm run db:migrate

sudo systemctl restart astra
```

The migration runner automatically detects the old `_migrations` table and bridges it to the new `schema_migrations` system.
