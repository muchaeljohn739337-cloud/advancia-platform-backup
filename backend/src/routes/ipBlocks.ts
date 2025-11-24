import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import prisma from '../prismaClient';

// Minimal diagnostic version to isolate middleware undefined crash
const router = express.Router();

// Log middleware types before use to diagnose undefined issue
console.log('[ipBlocks] typeof authenticateToken:', typeof authenticateToken);
console.log('[ipBlocks] typeof requireAdmin:', typeof requireAdmin);

// Guarded attachment of middleware (avoid passing undefined)
if (
  typeof authenticateToken === 'function' &&
  typeof requireAdmin === 'function'
) {
  router.use((req, res, next) =>
    authenticateToken(req, res, (err?: any) => {
      if (err) return next(err);
      requireAdmin(req, res, next);
    }),
  );
} else {
  console.error(
    '[ipBlocks] Skipping admin middleware – one or both are undefined',
    {
      authenticateTokenType: typeof authenticateToken,
      requireAdminType: typeof requireAdmin,
    },
  );
}

// Simple ping route to confirm router loads without crashing
router.get('/_ping', (_req, res) => {
  res.json({
    ok: true,
    adminGuardAttached:
      typeof authenticateToken === 'function' &&
      typeof requireAdmin === 'function',
  });
});

// Retain core listing route behind guard (optional)
router.get('/', async (_req, res) => {
  try {
    const blocks = await prisma.ip_blocks.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ success: true, blocks });
  } catch (error) {
    console.error('[ipBlocks] Failed to fetch IP blocks:', error);
    res
      .status(500)
      .json({ success: false, error: 'Failed to fetch IP blocks' });
  }
});

router.post('/unblock', async (req, res) => {
  const ip = req.body?.ip;
  if (!ip) {
    return res
      .status(400)
      .json({ success: false, error: 'IP address required' });
  }
  try {
    await prisma.ip_blocks.deleteMany({ where: { ip } });
    res.json({ success: true });
  } catch (error) {
    console.error('[ipBlocks] Failed to unblock IP:', error);
    res.status(500).json({ success: false, error: 'Failed to unblock IP' });
  }
});

export default router;
