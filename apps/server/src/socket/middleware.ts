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

// Simple in-memory socket message rate-limiter (token bucket)
const socketRateMap = new Map<string, { tokens: number; lastRefill: number }>();

export const socketAuthMiddleware = (socket: TypedSocket, next: (err?: Error) => void) => {
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

export const rateLimitEvent = (socketId: string, limitPerSecond = 20): boolean => {
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

export const cleanupSocketRateLimit = (socketId: string): void => {
  socketRateMap.delete(socketId);
};
