import { Redis } from 'ioredis';
import { env } from './env.js';

// Global Redis client for Room state and session management
export const redisClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: false,
  retryStrategy(times) {
    const delay = Math.min(times * 150, 3000);
    return delay;
  }
});

// Dedicated Pub/Sub clients for Socket.IO horizontal clustering adapter
export const pubClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    return Math.min(times * 150, 3000);
  }
});

export const subClient = pubClient.duplicate();

redisClient.on('connect', () => {
  console.log('⚡ [Redis] Primary client connected successfully');
});

redisClient.on('error', (err) => {
  console.error('❌ [Redis] Primary client error:', err.message);
});

pubClient.on('error', (err) => {
  console.error('❌ [Redis] Pub client error:', err.message);
});

subClient.on('error', (err) => {
  console.error('❌ [Redis] Sub client error:', err.message);
});
