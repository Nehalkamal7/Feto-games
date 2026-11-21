import { Redis } from '@upstash/redis';
import { RoomState, PublicRoomDirectoryItem, PublicRoomState } from '@feto-games/shared-types';
import { getPublicGameState } from './game-engine';

/**
 * In-memory fallback mock for local development when Upstash credentials
 * are not yet populated in the environment.
 */
class MemoryRedisStore {
  private store: Map<string, { value: any; expiresAt?: number }> = new Map();
  private sets: Map<string, Set<string>> = new Map();
  private hashes: Map<string, Map<string, any>> = new Map();

  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: any, options?: { ex?: number }): Promise<'OK'> {
    const expiresAt = options?.ex ? Date.now() + options.ex * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const deleted = this.store.delete(key);
    this.sets.delete(key);
    this.hashes.delete(key);
    return deleted ? 1 : 0;
  }

  async hset(key: string, fieldOrValues: Record<string, any> | string, value?: any): Promise<number> {
    if (!this.hashes.has(key)) {
      this.hashes.set(key, new Map());
    }
    const h = this.hashes.get(key)!;
    let count = 0;
    if (typeof fieldOrValues === 'object' && fieldOrValues !== null) {
      for (const [k, v] of Object.entries(fieldOrValues)) {
        h.set(k, v);
        count++;
      }
    } else if (value !== undefined) {
      h.set(String(fieldOrValues), value);
      count++;
    }
    return count;
  }

  async hget<T = any>(key: string, field: string): Promise<T | null> {
    const h = this.hashes.get(key);
    if (!h) return null;
    return (h.get(field) as T) ?? null;
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    const h = this.hashes.get(key);
    if (!h) return 0;
    let removed = 0;
    for (const f of fields) {
      if (h.delete(f)) removed++;
    }
    return removed;
  }

  async hgetall<T = Record<string, any>>(key: string): Promise<T | null> {
    const h = this.hashes.get(key);
    if (!h || h.size === 0) return null;
    const obj: any = {};
    for (const [k, v] of h.entries()) {
      obj[k] = v;
    }
    return obj as T;
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    if (!this.sets.has(key)) {
      this.sets.set(key, new Set());
    }
    const set = this.sets.get(key)!;
    let added = 0;
    for (const m of members) {
      if (!set.has(m)) {
        set.add(m);
        added++;
      }
    }
    return added;
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    const set = this.sets.get(key);
    if (!set) return 0;
    let removed = 0;
    for (const m of members) {
      if (set.delete(m)) removed++;
    }
    return removed;
  }

  async smembers(key: string): Promise<string[]> {
    const set = this.sets.get(key);
    return set ? Array.from(set) : [];
  }

  async keys(pattern: string): Promise<string[]> {
    const prefix = pattern.replace('*', '');
    const now = Date.now();
    const result: string[] = [];
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) continue;
      if (key.startsWith(prefix)) result.push(key);
    }
    return result;
  }

  async incr(key: string): Promise<number> {
    const val = ((await this.get<number>(key)) || 0) + 1;
    await this.set(key, val);
    return val;
  }
}

// Global in-memory fallback singleton across HMR in dev
declare global {
  // eslint-disable-next-line no-var
  var __feto_memory_redis: MemoryRedisStore | undefined;
}

const getMemoryStore = (): MemoryRedisStore => {
  if (!globalThis.__feto_memory_redis) {
    globalThis.__feto_memory_redis = new MemoryRedisStore();
  }
  return globalThis.__feto_memory_redis;
};

const isUpstashConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

/**
 * Server-side Upstash Redis client.
 * Uses REST API natively compatible with Vercel Serverless and Edge runtimes.
 */
export const redis: Redis | MemoryRedisStore = isUpstashConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!
    })
  : (getMemoryStore() as any);

if (!isUpstashConfigured) {
  console.info('⚡ [Upstash Redis] Running in-memory store (UPSTASH_REDIS_REST_URL not set).');
}

// ========================================================
// HIGH-LEVEL ROOM & MATCHMAKING STORAGE HELPERS
// ========================================================

const ROOM_KEY_PREFIX = 'feto:room:';
const PUBLIC_ROOMS_SET = 'feto:rooms:public';
const STATS_KEY = 'feto:stats:live';
const DEFAULT_ROOM_TTL_SECONDS = 7200; // 2 hours

const ROOM_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generates a clean 6-character uppercase alphanumeric room code
 * using unambiguous characters (no 'I', 'O', '1', '0').
 * Example: K8M4P2, 94X7B1
 */
export function generateRoomCode(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ROOM_CODE_ALPHABET.charAt(Math.floor(Math.random() * ROOM_CODE_ALPHABET.length));
  }
  return code;
}

/**
 * Normalizes any incoming room code by removing whitespace, hyphens,
 * and legacy "FG-" prefixes to guarantee 100% reliable lookups.
 */
export function normalizeRoomCode(code: string): string {
  return (code || '')
    .toUpperCase()
    .trim()
    .replace(/^FG-?/i, '')
    .replace(/[^A-Z0-9]/g, '');
}

export async function getRoomState(code: string): Promise<RoomState | null> {
  const normalized = normalizeRoomCode(code);
  if (!normalized) return null;
  let raw = await redis.get<RoomState>(`${ROOM_KEY_PREFIX}${normalized}`);
  if (!raw && !code.startsWith('FG-')) {
    raw = await redis.get<RoomState>(`${ROOM_KEY_PREFIX}FG-${normalized}`);
  }
  return raw || null;
}

export async function saveRoomState(
  room: RoomState,
  ttlSeconds = DEFAULT_ROOM_TTL_SECONDS
): Promise<void> {
  const normalized = normalizeRoomCode(room.code);
  room.code = normalized;
  const key = `${ROOM_KEY_PREFIX}${normalized}`;
  const playersHashKey = `room:${normalized}:players`;

  // Always keep activity and update timestamps strictly fresh
  const now = Date.now();
  if (!room.updatedAt) room.updatedAt = now;
  room.lastActivityAt = now;

  const activePlayers = Object.values(room.players || {}).filter(
    (p) => p.connectionStatus !== 'disconnected'
  );

  // If room is finished / game_over:
  // Shorten Redis TTL to 300 seconds (5 minutes) for recap card downloads, and purge from public_rooms
  if (room.status === 'game_over' || (room.status as string) === 'finished') {
    ttlSeconds = Math.min(ttlSeconds, 300);
    await removePublicRoomDirectory(normalized);
  } else if (room.status === 'in_game' || (room.status as string) === 'playing') {
    // Game is actively running: purge from matchmaking directory
    await removePublicRoomDirectory(normalized);
  } else if (room.config?.isPrivate) {
    // Private room: purge from public matchmaking
    await removePublicRoomDirectory(normalized);
  } else if (activePlayers.length >= (room.config?.maxPlayers || 15)) {
    // Room is full: purge from public matchmaking
    await removePublicRoomDirectory(normalized);
  } else if (activePlayers.length === 0) {
    // Room is empty: purge from public matchmaking
    await removePublicRoomDirectory(normalized);
  }

  await redis.set(key, room, { ex: ttlSeconds });

  // Sync players in Upstash Redis Hash `room:{roomCode}:players` keyed by playerId
  try {
    if (room.players && Object.keys(room.players).length > 0) {
      for (const [pid, playerObj] of Object.entries(room.players)) {
        await (redis as any).hset(playersHashKey, pid, JSON.stringify(playerObj));
      }
    }
  } catch (err) {
    // Non-blocking sync warning
  }
}

export async function removePlayerFromRoomHash(code: string, playerId: string): Promise<void> {
  const normalized = code.toUpperCase().trim();
  try {
    await (redis as any).hdel(`room:${normalized}:players`, playerId);
    await (redis as any).hdel(`feto:room:${normalized}:players`, playerId);
  } catch {
    // ignore
  }
}

export async function deleteRoomState(code: string): Promise<void> {
  const normalized = normalizeRoomCode(code);
  await redis.del(`${ROOM_KEY_PREFIX}${normalized}`);
  await redis.del(`room:${normalized}:players`);
  await redis.del(`feto:room:${normalized}:players`);
  await removePublicRoomDirectory(normalized);
}

export async function addPublicRoomDirectory(item: PublicRoomDirectoryItem | string): Promise<void> {
  const rawCode = typeof item === 'string' ? item : item.code;
  const code = normalizeRoomCode(rawCode);
  // Clean any old entries for this room code first to prevent duplicates
  await removePublicRoomDirectory(code);
  const normalizedItem = typeof item === 'string' ? { code } : { ...item, code };
  const jsonStr = JSON.stringify(normalizedItem);
  await (redis as any).sadd(PUBLIC_ROOMS_SET, code);
  await (redis as any).sadd(PUBLIC_ROOMS_SET, jsonStr);
}

export async function removePublicRoomDirectory(code: string): Promise<void> {
  const normalized = normalizeRoomCode(code);
  try {
    await (redis as any).srem(PUBLIC_ROOMS_SET, normalized);
    await (redis as any).srem(PUBLIC_ROOMS_SET, `FG-${normalized}`);
    const members = await (redis as any).smembers(PUBLIC_ROOMS_SET);
    if (!members || members.length === 0) return;

    for (const itemStr of members) {
      if (itemStr === normalized) {
        await (redis as any).srem(PUBLIC_ROOMS_SET, itemStr);
      } else {
        try {
          const parsed = typeof itemStr === 'string' ? JSON.parse(itemStr) : itemStr;
          if (parsed && (parsed.code === normalized || parsed === normalized)) {
            await (redis as any).srem(PUBLIC_ROOMS_SET, itemStr);
          }
        } catch {
          // ignore parse err
        }
      }
    }
  } catch {
    // quiet
  }
}

export async function getPublicRoomDirectory(): Promise<PublicRoomDirectoryItem[]> {
  const members = await (redis as any).smembers(PUBLIC_ROOMS_SET);
  if (!members || members.length === 0) return [];

  const items: PublicRoomDirectoryItem[] = [];
  const now = Date.now();
  const seenCodes = new Set<string>();

  for (const itemStr of members) {
    let code = '';
    try {
      if (typeof itemStr === 'string' && (itemStr.startsWith('{') || itemStr.startsWith('['))) {
        const parsed = JSON.parse(itemStr);
        code = (parsed.code || '').toUpperCase().trim();
      } else if (typeof itemStr === 'string') {
        code = itemStr.toUpperCase().trim();
      } else if (itemStr && typeof itemStr === 'object' && itemStr.code) {
        code = itemStr.code.toUpperCase().trim();
      }
    } catch {
      await (redis as any).srem(PUBLIC_ROOMS_SET, itemStr);
      continue;
    }

    if (!code || seenCodes.has(code)) {
      if (seenCodes.has(code)) {
        await (redis as any).srem(PUBLIC_ROOMS_SET, itemStr);
      }
      continue;
    }

    seenCodes.add(code);

    // Self-Healing: Verify against the real-time live room object in Redis
    const room = await getRoomState(code);
    const activePlayers = room?.players
      ? Object.values(room.players).filter((p) => p.connectionStatus !== 'disconnected')
      : [];

    const lastActivity = room?.lastActivityAt || room?.updatedAt || room?.createdAt || 0;
    const isInactive = now - lastActivity > 15 * 60 * 1000; // Inactive for > 15 minutes

    if (
      !room ||
      room.status !== 'lobby' ||
      activePlayers.length === 0 ||
      room.config.isPrivate ||
      activePlayers.length >= (room.config.maxPlayers || 15) ||
      isInactive
    ) {
      // Stale, finished, full, private, or inactive -> immediately remove from public index
      await (redis as any).srem(PUBLIC_ROOMS_SET, itemStr);
      await (redis as any).srem(PUBLIC_ROOMS_SET, code);
      continue;
    }

    const host = room.players[room.hostId] || activePlayers.find((p) => p.isHost) || activePlayers[0];

    items.push({
      code: room.code,
      hostUsername: host?.username || 'Host',
      hostAvatar: host?.avatar || 'cyber_cat',
      playerCount: activePlayers.length,
      maxPlayers: Math.min(room.config.maxPlayers || 15, 15),
      status: room.status,
      gameMode: room.config.gameMode,
      hasPin: Boolean(room.config.hasPin),
      isTeamMode: Boolean(room.config.isTeamMode),
      createdAt: room.createdAt || now
    });
  }

  return items;
}

/**
 * Idempotency lock to prevent duplicate timer/phase resolution when multiple
 * concurrent players trigger /api/game/action at the same second.
 */
export async function acquireLock(lockKey: string, ttlSeconds = 5): Promise<boolean> {
  const fullKey = `feto:lock:${lockKey}`;
  const existing = await redis.get(fullKey);
  if (existing) {
    return false;
  }
  await redis.set(fullKey, 'locked', { ex: ttlSeconds });
  return true;
}

/**
 * Converts internal RoomState (with record maps) to sanitized PublicRoomState.
 */
export function sanitizeRoomState(room: RoomState): PublicRoomState {
  // Deduplicate playerList by playerId to prevent any ghost duplicate entries
  const uniquePlayerMap = new Map<string, import('@feto-games/shared-types').PlayerSummary>();
  for (const p of Object.values(room.players || {})) {
    if (!p || !p.id) continue;
    if (!uniquePlayerMap.has(p.id)) {
      uniquePlayerMap.set(p.id, {
        id: p.id,
        username: p.username,
        avatar: p.avatar,
        isHost: p.id === room.hostId || Boolean(p.isHost),
        isReady: Boolean(p.isReady),
        isSpectator: false,
        score: p.score || 0,
        team: p.team,
        connectionStatus: p.connectionStatus || 'connected',
        graceExpiresAt: p.graceExpiresAt || null,
        joinedAt: p.joinedAt || Date.now()
      });
    }
  }
  const playerList = Array.from(uniquePlayerMap.values());

  const uniqueSpectatorMap = new Map<string, import('@feto-games/shared-types').PlayerSummary>();
  for (const s of Object.values(room.spectators || {})) {
    if (!s || !s.id) continue;
    if (!uniqueSpectatorMap.has(s.id) && !uniquePlayerMap.has(s.id)) {
      uniqueSpectatorMap.set(s.id, {
        id: s.id,
        username: s.username,
        avatar: s.avatar,
        isHost: false,
        isReady: false,
        isSpectator: true,
        score: s.score || 0,
        team: s.team,
        connectionStatus: s.connectionStatus || 'connected',
        graceExpiresAt: s.graceExpiresAt || null,
        joinedAt: s.joinedAt || Date.now()
      });
    }
  }
  const spectatorList = Array.from(uniqueSpectatorMap.values());

  let publicGameState: any = undefined;
  if (room.gameData) {
    try {
      publicGameState = getPublicGameState(room);
    } catch {
      publicGameState = room.gameData.publicState || room.gameData;
    }
  }

  return {
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    phase: room.phase || room.gameData?.phase,
    config: {
      roomName: room.config.roomName || `Room ${room.code}`,
      maxPlayers: room.config.maxPlayers,
      isPrivate: room.config.isPrivate,
      hasPin: room.config.hasPin,
      roundDurationSeconds: room.config.roundDurationSeconds,
      totalRounds: room.config.totalRounds,
      gameMode: room.config.gameMode,
      selectedGames: room.selectedGames || room.config.selectedGames || [room.config.gameMode],
      currentGameIndex: room.currentGameIndex ?? room.config.currentGameIndex ?? 0,
      vibeMode: room.config.vibeMode || 'chill',
      customDeckId: room.config.customDeckId,
      allowSpectators: room.config.allowSpectators,
      isTeamMode: room.config.isTeamMode
    },
    selectedGames: room.selectedGames || room.config.selectedGames || [room.config.gameMode],
    currentGameIndex: room.currentGameIndex ?? room.config.currentGameIndex ?? 0,
    players: playerList,
    spectators: spectatorList,
    playerCount: playerList.length,
    spectatorCount: spectatorList.length,
    currentRound: room.currentRound,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    lastActivityAt: room.lastActivityAt || room.updatedAt || Date.now(),
    teamScores: room.teamScores,
    sipsCount: room.sipsCount || {},
    customCardsCount: room.customCards?.length || 0,
    awards: room.gameData?.awards || [],
    gameState: publicGameState,
    gameData: publicGameState
  };
}
