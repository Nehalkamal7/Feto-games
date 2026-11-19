# FETO GAMES — Production Deployment & Cloud Infrastructure Guide

This guide provides step-by-step instructions for deploying **FETO GAMES** (Next.js 14 App Router frontend + Node.js Socket.IO server + Redis cluster adapter + PostgreSQL with Prisma ORM) to production.

---

## 1. Architecture Overview

```
                      ┌───────────────────────────────────────┐
                      │            DNS / Cloudflare           │
                      └──────────────────┬────────────────────┘
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
       ┌───────────────────────┐                   ┌───────────────────────┐
       │   Next.js Frontend    │                   │   Nginx Reverse Proxy │
       │ (Vercel / Container)  │                   │  (SSL + WS Upgrade)   │
       └───────────────────────┘                   └───────────┬───────────┘
                                                               │
                                         ┌─────────────────────┴─────────────────────┐
                                         ▼                                           ▼
                             ┌───────────────────────┐                   ┌───────────────────────┐
                             │  FETO Server (Node 1) │                   │  FETO Server (Node 2) │
                             │  Port 4000 (Socket)   │                   │  Port 4001 (Socket)   │
                             └───────────┬───────────┘                   └───────────┬───────────┘
                                         │                                           │
                                         └─────────────────────┬─────────────────────┘
                                                               │
                                         ┌─────────────────────┴─────────────────────┐
                                         ▼                                           ▼
                             ┌───────────────────────┐                   ┌───────────────────────┐
                             │     Redis 7 Cluster   │                   │  PostgreSQL 16 Engine │
                             │ (Rooms, PubSub, Sync) │                   │  (Profiles, Decks)    │
                             └───────────────────────┘                   └───────────────────────┘
```

---

## 2. Production Environment Variables (`.env.production`)

Create `.env.production` in the root repository or inject these secrets into your cloud provider:

```ini
# ========================================================
# GENERAL CONFIGURATION
# ========================================================
NODE_ENV=production
APP_NAME="FETO GAMES"
CLIENT_URL=https://fetogames.com
SERVER_URL=https://api.fetogames.com
PORT=4000

# ========================================================
# POSTGRESQL DATABASE (PRISMA ORM)
# ========================================================
POSTGRES_USER=feto_prod_admin
POSTGRES_PASSWORD=YOUR_STRONG_RANDOM_PASSWORD_64CHARS
POSTGRES_DB=feto_games_prod
POSTGRES_PORT=5432
DATABASE_URL=postgresql://feto_prod_admin:YOUR_STRONG_RANDOM_PASSWORD_64CHARS@postgres:5432/feto_games_prod?schema=public&connection_limit=30

# ========================================================
# REDIS (MATCHMAKING, PUBSUB, EPHEMERAL ROOMS)
# ========================================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_STRONG_REDIS_PASSWORD_64CHARS
REDIS_URL=redis://:YOUR_STRONG_REDIS_PASSWORD_64CHARS@redis:6379

# ========================================================
# SECURITY & AUTHENTICATION SECRETS
# ========================================================
JWT_SECRET=YOUR_SECURE_JWT_SECRET_MIN_32_CHARACTERS_FOR_RECONNECT
JWT_RECONNECT_EXPIRY_SECONDS=300
GRACE_PERIOD_SECONDS=45

# ========================================================
# ROOM & MULTIPLAYER CONCURRENCY LIMITS
# ========================================================
MAX_PLAYERS_PER_ROOM=15
MIN_PLAYERS_TO_START=2
ROOM_CODE_LENGTH=6
ROOM_IDLE_TIMEOUT_SECONDS=1800

# ========================================================
# NEXT.JS FRONTEND (BUILD-TIME & RUNTIME)
# ========================================================
NEXT_PUBLIC_SERVER_URL=https://api.fetogames.com
NEXT_PUBLIC_APP_NAME="FETO GAMES"
NEXT_PUBLIC_MAX_ROOM_PLAYERS=15
```

---

## 3. Deployment Option A: Dockerized Single / Multi-Node VPS (Recommended)

Ideal for DigitalOcean, AWS EC2, Hetzner, or Linode ($10–$20/mo VPS).

### Step 1: Clone Repository & Setup Secrets
```bash
git clone https://github.com/Nehalkamal7/Feto-games.git /opt/feto-games
cd /opt/feto-games
cp .env.example .env.production
nano .env.production # Fill with secure production credentials
```

### Step 2: Run Database Migrations
```bash
docker-compose -f docker-compose.prod.yml run --rm server-1 npm run db:deploy --workspace=@feto-games/server
```

### Step 3: Launch Production Cluster
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Step 4: Verify Container Health
```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 4. Deployment Option B: Hybrid Cloud (Vercel + Railway / Render)

### Frontend on Vercel:
1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Set Root Directory to `apps/web`.
3. Add Environment Variables:
   - `NEXT_PUBLIC_SOCKET_URL`: `https://api.fetogames.com` (or your Railway/Render URL, e.g. `https://feto-server.up.railway.app`)
   - `NEXT_PUBLIC_SERVER_URL`: `https://api.fetogames.com`
   - `NEXT_PUBLIC_APP_NAME`: `FETO GAMES`
   - `NEXT_PUBLIC_MAX_ROOM_PLAYERS`: `15`
4. Deploy!

> **Note on Vercel WebSocket Limitation:**
> Vercel Serverless and Edge runtimes terminate HTTP connections after request resolution and do not maintain persistent WebSockets. Therefore, the frontend connects directly to the standalone Node.js backend specified in `NEXT_PUBLIC_SOCKET_URL` with `transports: ['websocket', 'polling']` and `withCredentials: true`.

### Standalone Backend on Railway / Render / Fly.io / VPS:
1. Deploy Redis instance (enable persistence).
2. Deploy PostgreSQL instance.
3. Deploy Node.js server:
   - Build command: `npm run build`
   - Start command: `npm start` (runs standalone `node dist/server.js` on `process.env.PORT || 4000`)
   - Health check path: `/health` (returns `{ status: "ok" }`)
4. Inject Environment Variables:
   - `PORT`: (provided automatically by cloud provider or set to `4000`)
   - `FRONTEND_URL`: `https://your-feto-games.vercel.app` (your Vercel frontend domain; multiple domains can be comma-separated)
   - `DATABASE_URL`: `postgresql://...`
   - `REDIS_URL`: `redis://...`
   - `JWT_SECRET`: (secure 32+ character random secret)
5. Run release command: `npx prisma migrate deploy`.

---

## 5. Nginx Reverse Proxy with SSL & WebSocket Upgrades

Create `/etc/nginx/sites-available/feto-games.conf`:

```nginx
# HTTP to HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name fetogames.com api.fetogames.com;
    return 301 https://$host$request_uri;
}

# Next.js Frontend
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name fetogames.com;

    ssl_certificate /etc/letsencrypt/live/fetogames.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/fetogames.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Node.js Socket.IO Backend API
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.fetogames.com;

    ssl_certificate /etc/letsencrypt/live/api.fetogames.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.fetogames.com/privkey.pem;

    # REST Endpoints
    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Real-Time WebSockets
    location /socket.io/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Enable site and generate SSL certificates:
```bash
sudo ln -s /etc/nginx/sites-available/feto-games.conf /etc/nginx/sites-enabled/
sudo certbot --nginx -d fetogames.com -d api.fetogames.com
sudo systemctl reload nginx
```

---

## 6. Automated Concurrency & Health Monitoring

To run the automated 15-player concurrency and load test against staging or production:

```bash
# Run against local server
npm run test:simulation

# Run against production cloud server
SERVER_URL=https://api.fetogames.com npm run test:simulation
```

Health check endpoint:
```bash
curl https://api.fetogames.com/api/health
```
Expected output:
```json
{
  "status": "healthy",
  "redis": "connected",
  "postgres": "connected",
  "uptime": 86400,
  "activeConnections": 15
}
```
