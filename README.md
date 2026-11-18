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

---

## 🧩 Modular `IPartyGameEngine` Plugin Architecture

The server decouples game logic completely from the networking and room orchestration layer through a unified plugin interface:

```typescript
export interface IPartyGameEngine {
  readonly gameMode: GameMode;
  initializeGame(room: RoomState, io: Server): Promise<void>;
  handlePlayerAction(room: RoomState, playerId: string, action: string, payload: any, socket: Socket, io: Server): Promise<void>;
  handleChatMessage(room: RoomState, playerId: string, message: string, io: Server): Promise<boolean>;
  handlePlayerDisconnect(room: RoomState, playerId: string, io: Server): Promise<void>;
  handlePlayerReconnect(room: RoomState, playerId: string, socket: Socket, io: Server): Promise<void>;
  getPublicGameState(roomCode: string): any;
  destroyGame(roomCode: string): void;
}
```

New games register into `GameRegistry.register(new MyGameEngine())`. The networking layer (`lobbyHandler.ts`, `connectionHandler.ts`) routes incoming events dynamically without modifying core server code.

---

## 🎮 The 6 Launch Multiplayer Games (Up to 15 Players)

### 1. Game A: "Who Is The Imposter?" (Social Deduction · 3 to 15 Players)
- **Dynamic Imposter Scaling**:
  - 3–6 players: **1 Imposter**
  - 7–11 players: **2 Imposters**
  - 12–15 players: **3 Imposters**
- **Zero Network Inspection Cheating**:
  - The secret word and category are selected on the server.
  - The secret word is sent **only** to civilians via targeted private socket events (`game:private_role`).
  - Imposters receive `role: 'imposter'` and `secretWord: '???'`.
- **Turn-Based Clue Phase**: Each player submits a 1-word or short clue sequentially with an authoritative 30-second timer and auto-pass.
- **Live Interactive Voting**: Synchronized voting grid with real-time vote tallies.
- **10-Second Sudden Death**: If caught, the accused imposter gets a 10-second sudden-death window to type and guess the secret word for +500 steal bonus points.
- **Dataset**: `apps/server/src/games/data/imposterWords.json` (110+ categorized words).

### 2. Game B: "Draw & Guess" (2 to 15 Players)
- **Rotating Drawer**: Each round a player is selected as the Drawer to pick 1 of 3 secret words. The remaining players guess simultaneously.
- **Responsive HTML5 Canvas**: Brush sizes (3px, 8px, 16px, 26px), 10 neon color palette, eraser, undo, and clear canvas tools.
- **Ultra-Low Latency Streaming**: Emits optimized stroke coordinates via volatile Socket.IO events (`draw:stroke`) so network lag doesn't block the event loop.
- **Chat Interception & Word Blocker**:
  - Server inspects every incoming chat message.
  - If a player guesses the secret word, the message is **blocked from public chat** to prevent spoiling.
  - Awards speed-weighted points (up to 500) to the guesser and 75 bonus points to the drawer.
  - Emits celebratory `game:correct_guess` notification.
- **Dataset**: `apps/server/src/games/data/drawWords.json` (110+ drawing prompts with categories and difficulty).

### 3. Game C: "Quiz Battle" (2 to 15 Players)
- **Simultaneous Competitive Trivia**: 5 categories (*General Knowledge, Tech, Movies, Science, Sports*) across easy, medium, and hard difficulties.
- **Authoritative Timers & Speed-Weighted Scoring**: Questions broadcast with server-side `phaseEndsAt`. Scoring awards up to 1,000 points based on response speed:
  $$\text{Points} = \max(200, 1000 - (\Delta t \times 50))$$
- **Duplicate Answer Prevention**: Server locks each player to a single answer per question.
- **Live Leaderboard**: Animated rankings and score differentials displayed between rounds.
- **Dataset**: `apps/server/src/games/data/quizQuestions.json` (105 questions with 4 choices and explanations).

### 4. Game D: "Word Battle" (Fast-Paced Word Challenge · 2 to 15 Players)
- **Random Category & Starting Letter**: Server selects category and starting letter per round (e.g., "Animals starting with T", "Countries starting with M").
- **25-Second Word Racing**: All 15 players race against a 25-second countdown to submit valid words.
- **Uniqueness & Server Validation**:
  - Validates words against category dictionary bank.
  - Enforces uniqueness per round: if Player A submits "Tiger" first, Player B gets an instant "Already taken!" shake feedback.
  - Real-time claimed words stream feed with player avatars and speed bonus scoring.
- **Dataset**: `apps/server/src/games/data/wordBattleCategories.json` (100+ category entries with starting letters and words).

### 5. Game E: "Truth or Dare" (Party Roulette · 2 to 15 Players)
- **Synchronized Roulette Wheel**: Interactive animated spinner synced across all screens that randomly selects a target player.
- **Player Decision**: Target player picks TRUTH or DARE based on room intensity mode (`Chill`, `Party`, `Wild`).
- **Challenge Performance & Live Voting**:
  - Target performs the challenge and confirms completion.
  - All other room players vote "Completed" (+100 pts) or "Chicken / Refused" (-50 pts).
  - Majority verdict resolved live on the server with audio/visual feedback.
- **Dataset**: `apps/server/src/games/data/truthOrDarePrompts.json` (100+ prompts across Chill, Party, Wild).

### 6. Game F: "Never Have I Ever" (Party Confessions · 3 to 15 Players)
- **10 Innocence Points**: Every player starts with 10 Innocence Points and loses 1 point whenever tapping "I Have".
- **Simultaneous Confessions**: Server broadcasts randomized statements with a 15-second countdown.
- **Group Statistics Reveal**: Reveals everyone's choices simultaneously with animated avatars and room stats (e.g., "73% of the room has done this!").
- **Standings**: Tracks rankings from "Most Innocent" to "Wildest" player.
- **Dataset**: `apps/server/src/games/data/neverHaveIEverStatements.json` (101 relatable statements).

---

## 📡 Socket.IO Event Schema (`packages/shared-types`)

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `room:create` | Client ➔ Server | `CreateRoomDTO` | Creates new 6-char room in Redis |
| `room:join` | Client ➔ Server | `JoinRoomDTO` | Joins room as player or spectator |
| `room:reconnect` | Client ➔ Server | `ReconnectDTO` | Recovers player state within 45s grace |
| `lobby:set-ready` | Client ➔ Server | `{ isReady: boolean }` | Toggles player ready state |
| `lobby:kick-player` | Client ➔ Server | `{ targetPlayerId }` | Host kicks player from room |
| `lobby:update-settings` | Client ➔ Server | `UpdateRoomSettingsDTO` | Host updates room rules & game mode |
| `lobby:start-game` | Client ➔ Server | - | Host starts countdown & launches game engine |
| `room:state` | Server ➔ Client | `PublicRoomState` | Full broadcast of current room |
| `room:player-joined`| Server ➔ Client | `PlayerSummary` | Broadcast when new player enters |
| `room:player-disconnected` | Server ➔ Client | `{ playerId, graceExpiresAt }` | Disconnect with 45s grace period |
| `room:player-reconnected` | Server ➔ Client | `PlayerSummary` | Player successfully rejoined |
| `room:host-migrated` | Server ➔ Client | `{ newHostId, previousHostId }`| Automatic host promotion |
| `game:private_role` | Server ➔ Client (Private) | `PrivateRolePayload` | Private secret word / role sent to player |
| `game:state_sync` | Server ➔ Client | `{ gameMode, state }` | Engine-specific public game state |
| `imposter:submit_clue` | Client ➔ Server | `{ clue }` | Submits clue in "Who Is The Imposter?" |
| `imposter:vote` | Client ➔ Server | `{ votedPlayerId }` | Casts vote for imposter |
| `imposter:guess_word` | Client ➔ Server | `{ guessedWord }` | Sudden-death word guess by caught imposter |
| `draw:select_word` | Client ➔ Server | `{ word }` | Drawer selects prompt from 3 choices |
| `draw:stroke` | Client ➔ Server / Server ➔ Client | `DrawStroke` | Real-time volatile canvas stroke streaming |
| `draw:clear` | Client ➔ Server / Server ➔ Client | - | Clears the drawing canvas |
| `draw:undo` | Client ➔ Server / Server ➔ Client | - | Undoes previous stroke |
| `chat:send` | Client ➔ Server | `{ message }` | Chat or secret word guess in Draw & Guess |
| `quiz:submit_answer` | Client ➔ Server | `{ questionIndex, selectedOption }`| Answers trivia question in Quiz Battle |
| `word_battle:submit_word` | Client ➔ Server | `{ word }` | Submits candidate word in Word Battle |
| `word_battle:rejected` | Server ➔ Client | `{ word, reason }` | Instant rejection feedback (e.g. already taken) |
| `word_battle:accepted` | Server ➔ Client | `{ word, points, username }` | Claimed word broadcast |
| `tod:choose_type` | Client ➔ Server | `{ choice: 'truth' \| 'dare' }` | Target selects challenge type |
| `tod:complete_action` | Client ➔ Server | - | Target completes challenge |
| `tod:vote` | Client ➔ Server | `{ vote: 'completed' \| 'refused' }` | Group votes on challenge outcome |
| `nhie:submit_choice` | Client ➔ Server | `{ choice: 'have' \| 'havenot' }` | Submits confession in Never Have I Ever |

---

## 🔒 Security & Best Practices
- **Zero Cheat Leaks**: Words, roles, and secret answers are omitted from public states and sent only via targeted private socket emissions.
- **Server Interception**: Secret word guesses in Draw & Guess are intercepted and scrubbed on the server before reaching any other client's socket.
- **Authoritative Timers**: Game phases transition strictly via server timers, immune to client clock drift or tampering.
- **Token-Bucket Rate Limiter**: Sockets are capped to prevent socket flood and DDoS.
- **Cryptographic PINs**: 4-digit PIN passwords hashed using bcrypt with salt rounds.
- **Clean Disconnects**: Stale rooms are removed from Redis automatically when empty.
