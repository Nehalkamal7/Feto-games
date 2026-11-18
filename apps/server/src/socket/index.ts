import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { pubClient, subClient } from '../config/redis.js';
import { env } from '../config/env.js';
import { socketAuthMiddleware, attachPacketRateLimiter, cleanupSocketRateLimit } from './middleware.js';
import { registerLobbyHandlers } from './lobbyHandler.js';
import { registerConnectionHandlers } from './connectionHandler.js';
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData
} from '@feto-games/shared-types';

export const initSocketServer = (httpServer: HttpServer) => {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: [env.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingInterval: 10000,
    pingTimeout: 5000,
    connectTimeout: 10000
  });

  // Attach Redis adapter for horizontal scaling across multi-node clusters
  try {
    io.adapter(createAdapter(pubClient, subClient));
    console.log('🔄 [Socket.IO] Redis Adapter initialized for horizontal cluster scaling');
  } catch (err: any) {
    console.warn('⚠️ [Socket.IO] Redis adapter init warning (fallback to in-memory):', err.message);
  }

  // Socket middleware
  io.use(socketAuthMiddleware);

  // Connection lifecycle
  io.on('connection', (socket) => {
    const typedSocket = socket as any;
    console.log(`🔌 [Socket Connected] Socket ID: ${socket.id} (IP: ${socket.handshake.address})`);

    // Attach per-socket packet throttling
    attachPacketRateLimiter(typedSocket);

    // Register event domains
    registerLobbyHandlers(io, typedSocket);
    registerConnectionHandlers(io, typedSocket);

    socket.on('disconnect', () => {
      cleanupSocketRateLimit(typedSocket);
    });
  });

  return io;
};
