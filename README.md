# 🎮 FETO GAMES

> **Production-ready, real-time multiplayer party gaming platform supporting up to 15 concurrent players per room across mobile, tablet, and desktop.**

---

## 🌟 Architecture Overview

```
feto-games/
├── docker-compose.yml             # Local dev stack (Postgres, Redis, Server, Web)
├── docker-compose.prod.yml        # Clustered multi-node production deployment
├── .env.example                   # Master environment template
├── package.json                   # NPM Workspaces root
├── tsconfig.base.json             # Shared strict TypeScript configuration
├── packages/
│   └── shared-types/              # Shared TypeScript definitions & Socket.IO contracts
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts           # Barrel export
│           ├── player.ts          # Neon avatars, Player, ReconnectTokenPayload
│           ├── room.ts            # RoomConfig, RoomState, PublicRoomState
│           ├── game.ts            # Game phases, server timers, secret roles, scoring
│           └── socket-events.ts   # Strongly typed Client/Server/InterServer events
└── apps/
    ├── server/                    # Backend Node.js / Express / Socket.IO Core
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── Dockerfile
    │   ├── prisma/
    │   │   └── schema.prisma      # Postgres schema (Users, Profiles, History, UGC Decks)
    │   └── src/
    │       ├── config/
    │       │   ├── env.ts         # Zod-validated environment config
    │       │   ├── redis.ts       # ioredis & dedicated Pub/Sub cluster clients
    │       │   └── prisma.ts      # Prisma ORM singleton
    │       ├── services/
    │       │   ├── roomManager.ts # Redis-backed atomic RoomManager (Up to 15 players)
    │       │   ├── tokenService.ts# Signed JWT session tokens & bcrypt PIN hashing
    │       │   └── timerService.ts# Authoritative round timers & 45s grace timers
    │       ├── socket/
    │       │   ├── index.ts       # Socket.IO + @socket.io/redis-adapter bootstrap
    │       │   ├── middleware.ts  # Token auth & token-bucket rate limiter
    │       │   ├── lobbyHandler.ts# Room creation, joining, ready states, game launch
    │       │   └── connectionHandler.ts # 45s disconnect grace & host migration
    │       ├── routes/
    │       │   ├── healthRoutes.ts# Redis/Postgres health status
    │       │   └── roomRoutes.ts  # Public room directory & invite code inspector
    │       └── server.ts          # Express HTTP + Socket.IO server with graceful shutdown
    └── web/                       # Next.js 14/15 App Router Frontend
        ├── package.json
        ├── tsconfig.json
        ├── tailwind.config.ts     # Cyber neon theme, glow effects, keyframes
        ├── src/
        │   ├── lib/
        │   │   ├── socket.ts      # Typed Socket.IO client + sessionStorage manager
        │   │   └── sound.ts       # Procedural Web Audio API party sound effects
        │   ├── components/
        │   │   └── NeonAvatarDisplay.tsx # Cyber avatar renderer with glow auras
        │   └── app/
        │       ├── layout.tsx     # Root layout with SEO meta & viewport config
        │       ├── page.tsx       # Landing, guest profile, create/join room modals
        │       └── room/[code]/page.tsx # 15-player live lobby, host controls, in-game view
```

---

## ⚡ Key Highlights

### 1. 15-Player Waiting Lobby & Instant Guest Access
- Supports **2 to 15 players** in real time.
- Instant access without mandatory registration: pick a custom nickname + one of **8 neon avatars** (`cyber_cat`, `neon_fox`, `pixel_alien`, `glitch_skull`, `robo_pug`, `cosmic_panda`, `solar_falcon`, `hyper_bunny`).
- Host controls: Crown indicator, kick players, toggle room privacy, change player limit (2-15), adjust round timer (15s-60s), and launch game.
- Non-host players: Live Ready/Unready toggle with audio and visual feedback.

### 2. Strict Server-Authoritative State
- **Timers, secret roles, and scores live exclusively on Node.js**:
  - Countdown phase triggers 1-second ticks broadcasted via `game:timer-tick`.
  - Secret roles (e.g., *The Glitch Infiltrator* vs *Neon Operative*) are generated on the server and emitted **privately** to each individual player's socket.
  - Clients cannot cheat or manipulate game state.

### 3. Resilient 45-Second Reconnection & Host Migration
- Upon entering a room, a signed JWT `reconnectToken` is issued and stored in browser `sessionStorage`.
- If a player loses connection or refreshes their browser on mobile:
  1. The server flags them as `disconnected_grace`.
  2. Remaining players see a live countdown: `"Reconnecting (38s)"`.
  3. The player has a **45-second grace period** to auto-reconnect with their exact role, score, and seat intact.
  4. If the disconnected player was the host and the grace period expires, **automatic host migration** promotes the oldest active player to host (`👑 Host Migrated`).

### 4. Horizontal Redis Adapter Scaling
- Configured with `@socket.io/redis-adapter` using separate publisher and subscriber Redis clients.
- Run multiple server instances behind a load balancer with zero cross-instance message drop (`docker-compose.prod.yml`).

---

## 🚀 Quickstart

### Prerequisites
- Node.js >= 20.x
- Docker & Docker Compose (or local Redis + Postgres instances)

### Option A: Complete Docker Compose Stack
```bash
# 1. Start all services (PostgreSQL, Redis, Backend Server, Frontend Web)
docker-compose up -d

# 2. View logs
docker-compose logs -f

# 3. Open applications:
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000/api/health
```

### Option B: Local Development
```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npm run db:generate

# 3. Start Redis & Postgres (via Docker)
docker-compose up -d redis postgres

# 4. Run Backend & Frontend in watch mode
npm run dev
```

---

## 📡 Socket.IO Event Schema (`packages/shared-types`)

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `room:create` | Client ➔ Server | `CreateRoomDTO` | Creates new 6-char room in Redis |
| `room:join` | Client ➔ Server | `JoinRoomDTO` | Joins room as player or spectator |
| `room:reconnect` | Client ➔ Server | `ReconnectDTO` | Recovers player state within 45s grace |
| `lobby:set-ready` | Client ➔ Server | `{ isReady: boolean }` | Toggles player ready state |
| `lobby:kick-player` | Client ➔ Server | `{ targetPlayerId }` | Host kicks player from room |
| `lobby:update-settings` | Client ➔ Server | `UpdateRoomSettingsDTO` | Host updates room rules |
| `lobby:start-game` | Client ➔ Server | - | Host starts countdown & distributes roles |
| `room:state` | Server ➔ Client | `PublicRoomState` | Full broadcast of current room |
| `room:player-joined`| Server ➔ Client | `PlayerSummary` | Broadcast when new player enters |
| `room:player-disconnected` | Server ➔ Client | `{ playerId, graceExpiresAt }` | Disconnect with 45s grace period |
| `room:player-reconnected` | Server ➔ Client | `PlayerSummary` | Player successfully rejoined |
| `room:host-migrated` | Server ➔ Client | `{ newHostId, previousHostId }`| Automatic host promotion |
| `game:secret-role` | Server ➔ Client (Private) | `SecretRolePayload` | Private secret role sent to player |
| `game:timer-tick` | Server ➔ Client | `TimerTickPayload` | 1-second authoritative timer tick |

---

## 🔒 Security & Best Practices
- **Never leaks private state**: Secret roles and PIN hashes are stripped from `PublicRoomState`.
- **Token-Bucket Rate Limiter**: Sockets are capped to 20 events/second to prevent socket spam and DDoS.
- **Cryptographic PINs**: 4-digit PIN passwords hashed using bcrypt with salt rounds.
- **Clean Disconnects**: Stale rooms are removed from Redis automatically when empty.
