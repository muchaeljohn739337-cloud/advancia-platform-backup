import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { getMetrics, getMetricsJSON } from '../utils/metrics';

const router = Router();

/**
 * GET /api/metrics
 * Prometheus metrics endpoint (text format)
 * Requires admin authentication
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

/**
 * GET /api/metrics/json
 * Metrics in JSON format (for debugging or custom dashboards)
 * Requires admin authentication
 */
router.get('/json', requireAdmin, async (req, res) => {
  try {
    const metrics = await getMetricsJSON();
    res.json({ success: true, metrics });
  } catch (error) {
    console.error('Error fetching metrics JSON:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

/**
 * GET /api/metrics/health
 * Health check endpoint (can be public for monitoring systems)
 */
router.get('/health', async (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

export default router;
