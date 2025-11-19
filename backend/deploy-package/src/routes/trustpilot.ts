// Trustpilot Routes
// API endpoints for Trustpilot review management

import express, { Request, Response } from "express";
import trustpilotCollector from "../jobs/trustpilotCollector";
import logger from "../logger";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import prisma from "../prismaClient";

const router = express.Router();

/**
 * GET /api/trustpilot/reviews
 * Get published reviews (public endpoint)
 */
router.get("/reviews", async (req: Request, res: Response) => {
  try {
    const { limit = 10, offset = 0 } = req.query;

    const reviews = await prisma.trustpilotReview.findMany({
      where: { isPublished: true },
      orderBy: { reviewDate: "desc" },
      take: Number(limit),
      skip: Number(offset),
      select: {
        id: true,
        stars: true,
        title: true,
        text: true,
        reviewerName: true,
        isVerified: true,
        reviewDate: true,
      },
    });

    const total = await prisma.trustpilotReview.count({
      where: { isPublished: true },
    });

    res.json({
      success: true,
      reviews,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error: any) {
    logger.error("❌ Failed to fetch reviews:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch reviews",
    });
  }
});

/**
 * GET /api/trustpilot/stats
 * Get review statistics (public endpoint)
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const stats = await trustpilotCollector.getStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    logger.error("❌ Failed to fetch stats:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch statistics",
    });
  }
});

/**
 * POST /api/trustpilot/sync
 * Manually trigger review sync (admin only)
 */
router.post(
  "/sync",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      logger.info("🔄 Manual Trustpilot sync requested by admin");

      const result = await trustpilotCollector.triggerManualSync();

      res.json({
        success: result.success,
        message: result.message,
        stats: result.stats,
      });
    } catch (error: any) {
      logger.error("❌ Manual sync failed:", error.message);
      res.status(500).json({
        success: false,
        error: "Sync failed",
      });
    }
  }
);

/**
 * GET /api/trustpilot/admin/all
 * Get all reviews including unpublished (admin only)
 */
router.get(
  "/admin/all",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { limit = 50, offset = 0 } = req.query;

      const reviews = await prisma.trustpilotReview.findMany({
        orderBy: { reviewDate: "desc" },
        take: Number(limit),
        skip: Number(offset),
      });

      const total = await prisma.trustpilotReview.count();

      res.json({
        success: true,
        reviews,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
        },
      });
    } catch (error: any) {
      logger.error("❌ Failed to fetch all reviews:", error.message);
      res.status(500).json({
        success: false,
        error: "Failed to fetch reviews",
      });
    }
  }
);

/**
 * PATCH /api/trustpilot/admin/:id/publish
 * Publish or unpublish a review (admin only)
 */
router.patch(
  "/admin/:id/publish",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { isPublished } = req.body;

      const review = await prisma.trustpilotReview.update({
        where: { id },
        data: { isPublished: Boolean(isPublished) },
      });

      logger.info(
        `⭐ Review ${id} ${isPublished ? "published" : "unpublished"}`
      );

      res.json({
        success: true,
        review,
      });
    } catch (error: any) {
      logger.error("❌ Failed to update review:", error.message);
      res.status(500).json({
        success: false,
        error: "Failed to update review",
      });
    }
  }
);

/**
 * DELETE /api/trustpilot/admin/:id
 * Delete a review (admin only)
 */
router.delete(
  "/admin/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await prisma.trustpilotReview.delete({
        where: { id },
      });

      logger.info(`🗑️  Review ${id} deleted`);

      res.json({
        success: true,
        message: "Review deleted",
      });
    } catch (error: any) {
      logger.error("❌ Failed to delete review:", error.message);
      res.status(500).json({
        success: false,
        error: "Failed to delete review",
      });
    }
  }
);

export default router;
