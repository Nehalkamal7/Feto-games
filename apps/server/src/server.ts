import http from 'http';
import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { initSocketServer } from './socket/index.js';
import { healthRouter } from './routes/healthRoutes.js';
import { roomRouter } from './routes/roomRoutes.js';
import { socialRouter } from './routes/socialRoutes.js';
import { redisClient, pubClient, subClient } from './config/redis.js';
import { prisma } from './config/prisma.js';

import { expressCorsOptions } from './config/cors.js';

const app = express();
const httpServer = http.createServer(app);

// Cross-Origin Resource Sharing (Supports FRONTEND_URL, Vercel deployments, and localhost)
app.use(cors(expressCorsOptions));

app.use(express.json());

// Standalone Cloud Hosting Health Check Endpoint (Railway, Render, Fly.io, ALB)
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

// API Routes
app.use('/api', healthRouter);
app.use('/api', socialRouter);
app.use('/api/rooms', roomRouter);

// Root Welcome Route
app.get('/', (_req, res) => {
  res.json({
    app: 'FETO GAMES Backend Engine',
    version: '1.0.0',
    status: 'online',
    health: '/health',
    apiHealth: '/api/health'
  });
});

// Initialize Socket.IO with Redis Adapter
export const io = initSocketServer(httpServer);

// Start HTTP & Socket server (Bind to 0.0.0.0 for containerized / cloud hosting)
const PORT = Number(process.env.PORT) || env.PORT || 4000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ======================================================
  🚀 FETO GAMES Server running on http://0.0.0.0:${PORT}
  🕹️  Environment: ${env.NODE_ENV}
  ⚡ Redis: Connected (${env.REDIS_URL.split('@')[1] || 'localhost'})
  👥 Max Players per Room: ${env.MAX_PLAYERS_PER_ROOM}
  ⏳ Grace Period: ${env.GRACE_PERIOD_SECONDS}s
  ======================================================
  `);
});

// Graceful Shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Shutting down FETO GAMES server gracefully...`);

  httpServer.close(async () => {
    console.log('🔌 Closed HTTP and Socket connections.');
    try {
      await redisClient.quit();
      await pubClient.quit();
      await subClient.quit();
      console.log('⚡ Redis connections closed.');
      await prisma.$disconnect();
      console.log('🗄️ PostgreSQL connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during shutdown:', err);
      process.exit(1);
    }
  });

  // Force close if graceful shutdown hangs
  setTimeout(() => {
    console.error('⚠️ Could not close connections in time, forcefully shutting down.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
