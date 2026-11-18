import http from 'http';
import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { initSocketServer } from './socket/index.js';
import { healthRouter } from './routes/healthRoutes.js';
import { roomRouter } from './routes/roomRoutes.js';
import { redisClient, pubClient, subClient } from './config/redis.js';
import { prisma } from './config/prisma.js';

const app = express();
const httpServer = http.createServer(app);

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: [env.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  })
);

app.use(express.json());

// API Routes
app.use('/api', healthRouter);
app.use('/api/rooms', roomRouter);

// Root Welcome Route
app.get('/', (_req, res) => {
  res.json({
    app: 'FETO GAMES Backend Engine',
    version: '1.0.0',
    status: 'online',
    docs: '/api/health'
  });
});

// Initialize Socket.IO with Redis Adapter
export const io = initSocketServer(httpServer);

// Start HTTP & Socket server
httpServer.listen(env.PORT, () => {
  console.log(`
  ======================================================
  🚀 FETO GAMES Server running on http://localhost:${env.PORT}
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
