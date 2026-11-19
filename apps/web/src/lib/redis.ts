import { Redis } from '@upstash/redis';
import { RoomState, PublicRoomDirectoryItem, PublicRoomState } from '@feto-games/shared-types';

/**
 * In-memory fallback mock for local development when Upstash credentials
 * are not yet populated in the environment.
 */
class MemoryRedisStore {
  private store: Map<string, { value: any; expiresAt?: number }> = new Map();
  private sets: Map<string, Set<string>> = new Map();

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
    return deleted ? 1 : 0;
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

export async function getRoomState(code: string): Promise<RoomState | null> {
  const normalized = code.toUpperCase().trim();
  const raw = await redis.get<RoomState>(`${ROOM_KEY_PREFIX}${normalized}`);
  return raw || null;
}

export async function saveRoomState(
  room: RoomState,
  ttlSeconds = DEFAULT_ROOM_TTL_SECONDS
): Promise<void> {
  const key = `${ROOM_KEY_PREFIX}${room.code.toUpperCase()}`;
  await redis.set(key, room, { ex: ttlSeconds });
}

export async function deleteRoomState(code: string): Promise<void> {
  const normalized = code.toUpperCase().trim();
  await redis.del(`${ROOM_KEY_PREFIX}${normalized}`);
  await removePublicRoomDirectory(normalized);
}

export async function addPublicRoomDirectory(item: PublicRoomDirectoryItem): Promise<void> {
  const jsonStr = JSON.stringify(item);
  await (redis as any).sadd(PUBLIC_ROOMS_SET, jsonStr);
}

export async function removePublicRoomDirectory(code: string): Promise<void> {
  const normalized = code.toUpperCase().trim();
  const members = await (redis as any).smembers(PUBLIC_ROOMS_SET);
  if (!members || members.length === 0) return;

  for (const itemStr of members) {
    try {
      const parsed = typeof itemStr === 'string' ? JSON.parse(itemStr) : itemStr;
      if (parsed.code === normalized) {
        await (redis as any).srem(PUBLIC_ROOMS_SET, itemStr);
      }
    } catch {
      // ignore parse err
    }
  }
}

export async function getPublicRoomDirectory(): Promise<PublicRoomDirectoryItem[]> {
  const members = await (redis as any).smembers(PUBLIC_ROOMS_SET);
  if (!members || members.length === 0) return [];

  const items: PublicRoomDirectoryItem[] = [];
  const now = Date.now();

  for (const itemStr of members) {
    try {
      const parsed = typeof itemStr === 'string' ? JSON.parse(itemStr) : itemStr;
      // Check if room still exists in Redis
      const exists = await getRoomState(parsed.code);
      if (exists && exists.status === 'lobby') {
        items.push({
          ...parsed,
          playerCount: Object.keys(exists.players).length
        });
      } else {
        // Stale or finished, remove from index
        await (redis as any).srem(PUBLIC_ROOMS_SET, itemStr);
      }
    } catch {
      // ignore
    }
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
  const playerList: import('@feto-games/shared-types').PlayerSummary[] = Object.values(room.players).map((p) => ({
    id: p.id,
    username: p.username,
    avatar: p.avatar,
    isHost: p.isHost,
    isReady: p.isReady,
    isSpectator: false,
    score: p.score,
    team: p.team,
    connectionStatus: p.connectionStatus,
    graceExpiresAt: p.graceExpiresAt,
    joinedAt: p.joinedAt || Date.now()
  }));

  const spectatorList: import('@feto-games/shared-types').PlayerSummary[] = Object.values(room.spectators).map((s) => ({
    id: s.id,
    username: s.username,
    avatar: s.avatar,
    isHost: false,
    isReady: false,
    isSpectator: true,
    score: s.score,
    team: s.team,
    connectionStatus: s.connectionStatus,
    graceExpiresAt: s.graceExpiresAt || null,
    joinedAt: s.joinedAt || Date.now()
  }));

  return {
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    config: {
      maxPlayers: room.config.maxPlayers,
      isPrivate: room.config.isPrivate,
      hasPin: room.config.hasPin,
      roundDurationSeconds: room.config.roundDurationSeconds,
      totalRounds: room.config.totalRounds,
      gameMode: room.config.gameMode,
      vibeMode: room.config.vibeMode || 'chill',
      customDeckId: room.config.customDeckId,
      allowSpectators: room.config.allowSpectators,
      isTeamMode: room.config.isTeamMode
    },
    players: playerList,
    spectators: spectatorList,
    playerCount: playerList.length,
    spectatorCount: spectatorList.length,
    currentRound: room.currentRound,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    teamScores: room.teamScores,
    sipsCount: room.sipsCount || {},
    customCardsCount: room.customCards?.length || 0,
    awards: room.gameData?.awards || []
  };
}
