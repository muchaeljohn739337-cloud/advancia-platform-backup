import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET ||
  process.env.JWT_SECRET ||
  'fallback-refresh-secret';

interface RefreshTokenPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      REFRESH_TOKEN_SECRET,
    ) as RefreshTokenPayload;

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        active: true,
      },
    });

    if (!user || !user.active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Generate new access token (15 minutes)
    const newAccessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '15m' },
    );

    // Optionally generate new refresh token (7 days)
    const newRefreshToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' },
    );

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

export default router;
