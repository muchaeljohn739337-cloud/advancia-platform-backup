import express, { Request, Response } from 'express';
import prisma from '../prismaClient';
import { getRedis } from '../services/redisClient';

const router = express.Router();

/**
 * GET /api/health
 * Lightweight health check - returns 200 if process is up
 * Use for load balancer health checks
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Test database connectivity
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      version: '1.0.0',
    });
  } catch (error: any) {
    console.error('[HEALTH CHECK] Database connection failed:', error.message);

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'disconnected',
      error:
        process.env.NODE_ENV === 'production'
          ? 'Service unavailable'
          : error.message,
    });
  }
});

/**
 * GET /api/live
 * Liveness probe - process is running
 * Returns 200 immediately without external checks
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * GET /api/ready
 * Readiness probe - service can accept traffic
 * Checks DB and Redis connectivity
 */
router.get('/ready', async (req: Request, res: Response) => {
  const checks: Record<string, string> = {};
  let ready = true;

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch (err) {
    checks.database = 'fail';
    ready = false;
  }

  // Check Redis if configured
  const redis = getRedis();
  if (redis) {
    try {
      await redis.ping();
      checks.redis = 'ok';
    } catch (err) {
      checks.redis = 'fail';
      ready = false;
    }
  } else {
    checks.redis = 'not_configured';
  }

  if (ready) {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks,
    });
  } else {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      checks,
    });
  }
});

export default router;
