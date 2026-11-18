import { Socket } from 'socket.io';
import { TokenService } from '../services/tokenService.js';
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData
} from '@feto-games/shared-types';

type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// Per-Socket token bucket state
interface Bucket {
  tokens: number;
  lastRefill: number;
}
const socketRateMap = new Map<string, Bucket>();

// Per-IP tracking for DDoS & flood protection
interface IpTracker {
  activeConnections: number;
  attemptsInWindow: number;
  windowStart: number;
}
const ipTrackers = new Map<string, IpTracker>();

const MAX_CONNECTIONS_PER_IP = 40; // Supports 15 local test bots + spectators
const MAX_CONNECT_ATTEMPTS_PER_MIN = 120;
const IP_WINDOW_MS = 60 * 1000;

// Periodic cleanup of stale IP trackers to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, tracker] of ipTrackers.entries()) {
    if (tracker.activeConnections <= 0 && now - tracker.windowStart > IP_WINDOW_MS * 2) {
      ipTrackers.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/**
 * Socket.IO Handshake Middleware:
 * 1. IP rate limiting & connection concurrency throttling
 * 2. Reconnection token authentication
 */
export const socketAuthMiddleware = (socket: TypedSocket, next: (err?: Error) => void) => {
  const rawIp =
    (socket.handshake.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    socket.handshake.address ||
    'unknown_ip';

  const now = Date.now();
  let tracker = ipTrackers.get(rawIp);

  if (!tracker || now - tracker.windowStart > IP_WINDOW_MS) {
    tracker = {
      activeConnections: tracker ? tracker.activeConnections + 1 : 1,
      attemptsInWindow: 1,
      windowStart: now
    };
    ipTrackers.set(rawIp, tracker);
  } else {
    tracker.attemptsInWindow++;
    tracker.activeConnections++;
  }

  // Check IP rate limits
  if (tracker.attemptsInWindow > MAX_CONNECT_ATTEMPTS_PER_MIN) {
    console.warn(`🚨 [Security] Rate limited IP: ${rawIp} (Too many connection attempts)`);
    return next(new Error('IP_RATE_LIMITED_EXCEEDED'));
  }

  if (tracker.activeConnections > MAX_CONNECTIONS_PER_IP) {
    console.warn(`🚨 [Security] Max concurrent connections exceeded for IP: ${rawIp}`);
    return next(new Error('IP_MAX_CONNECTIONS_EXCEEDED'));
  }

  // Token authentication
  const auth = socket.handshake.auth || {};
  const token = auth.token || (socket.handshake.query.token as string);

  if (token) {
    const payload = TokenService.verifyReconnectToken(token);
    if (payload) {
      socket.data.playerId = payload.playerId;
      socket.data.roomCode = payload.roomCode;
      socket.data.username = payload.username;
      socket.data.isHost = payload.isHost;
      socket.data.reconnectToken = token;
    }
  }

  next();
};

/**
 * Per-Socket Packet Middleware:
 * Intercepts all incoming client events and throttles event spamming.
 */
export const attachPacketRateLimiter = (socket: TypedSocket) => {
  socket.use(([event, ..._args], next) => {
    // Canvas strokes allow higher throughput (60/sec), other events capped at 25/sec
    const limit = event === 'draw:stroke' ? 60 : 25;

    if (!rateLimitEvent(socket.id, limit)) {
      console.warn(`⚠️ [Rate Limit] Socket ${socket.id} exceeded rate limit on event: ${event}`);
      return next(new Error('RATE_LIMITED'));
    }
    next();
  });
};

/**
 * In-memory Token-Bucket rate limiter
 */
export const rateLimitEvent = (socketId: string, limitPerSecond = 25): boolean => {
  const now = Date.now();
  const bucket = socketRateMap.get(socketId) || { tokens: limitPerSecond, lastRefill: now };

  const delta = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(limitPerSecond, bucket.tokens + delta * limitPerSecond);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    socketRateMap.set(socketId, bucket);
    return true;
  }

  socketRateMap.set(socketId, bucket);
  return false;
};

/**
 * Decrements IP connection count and cleans up socket token bucket.
 */
export const cleanupSocketRateLimit = (socket: TypedSocket | any): void => {
  const socketId = socket.id || String(socket);
  socketRateMap.delete(socketId);

  const rawIp =
    (socket.handshake?.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    socket.handshake?.address;

  if (rawIp && ipTrackers.has(rawIp)) {
    const tracker = ipTrackers.get(rawIp)!;
    tracker.activeConnections = Math.max(0, tracker.activeConnections - 1);
  }
};
