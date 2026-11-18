import { Router, Request, Response } from 'express';
import { redisClient } from '../config/redis.js';
import { prisma } from '../config/prisma.js';

export const healthRouter = Router();

healthRouter.get('/health', async (_req: Request, res: Response) => {
  let redisStatus = 'healthy';
  let postgresStatus = 'healthy';

  try {
    const redisPing = await redisClient.ping();
    if (redisPing !== 'PONG') redisStatus = 'degraded';
  } catch {
    redisStatus = 'down';
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    postgresStatus = 'down';
  }

  const isHealthy = redisStatus === 'healthy' && postgresStatus === 'healthy';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      redis: redisStatus,
      postgres: postgresStatus
    },
    uptimeSeconds: Math.floor(process.uptime())
  });
});
