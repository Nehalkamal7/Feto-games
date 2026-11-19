import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { pubClient, subClient } from '../config/redis.js';
import { socketAuthMiddleware, attachPacketRateLimiter, cleanupSocketRateLimit } from './middleware.js';
import { registerLobbyHandlers } from './lobbyHandler.js';
import { registerConnectionHandlers } from './connectionHandler.js';
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData
} from '@feto-games/shared-types';

import { isOriginAllowed } from '../config/cors.js';

export const initSocketServer = (httpServer: HttpServer) => {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          console.warn(`⚠️ [Socket.IO CORS] Blocked connection attempt from: ${origin}`);
          if (process.env.NODE_ENV !== 'production') {
            callback(null, true);
          } else {
            callback(new Error(`Socket connection not allowed by CORS from ${origin}`));
          }
        }
      },
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
