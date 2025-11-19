import express, { Request, Response } from "express";
import trustpilotCollector from "../jobs/trustpilotCollector";
import logger from "../logger";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import scamAdviserService from "../services/scamAdviserService";

const router = express.Router();

/**
 * GET /api/trust/report
 * Public endpoint - Get trust report
 */
router.get("/report", async (req: Request, res: Response) => {
  try {
    const [scamAdviserReport, trustpilotStats] = await Promise.all([
      scamAdviserService.checkDomainReputation(),
      trustpilotCollector.getStats(),
    ]);

    res.json({
      success: true,
      report: {
        scamAdviserScore: scamAdviserReport.trustScore,
        trustpilotRating: trustpilotStats.averageRating,
        sslValid: scamAdviserReport.sslValid,
        verifiedBusiness: scamAdviserReport.status === "verified",
        lastChecked: scamAdviserReport.lastChecked,
        status: scamAdviserReport.status,
        domainAgeMonths: scamAdviserReport.domainAgeMonths,
      },
    });
  } catch (error) {
    logger.error("Error fetching trust report:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch trust report",
    });
  }
});

/**
 * POST /api/trust/verify
 * Admin only - Request manual verification
 */
router.post(
  "/verify",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const result = await scamAdviserService.requestManualVerification();

      res.json({
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      logger.error("Error requesting verification:", error);
      res.status(500).json({
        success: false,
        error: "Failed to request verification",
      });
    }
  }
);

/**
 * GET /api/trust/improvement-tasks
 * Admin only - Get tasks to improve trust score
 */
router.get(
  "/improvement-tasks",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const tasks = await scamAdviserService.getTrustImprovementTasks();

      res.json({
        success: true,
        tasks,
        totalTasks: tasks.length,
        highPriority: tasks.filter((t) => t.priority === "high").length,
      });
    } catch (error) {
      logger.error("Error fetching improvement tasks:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch improvement tasks",
      });
    }
  }
);

/**
 * POST /api/trust/improve
 * Admin only - Run automated trust improvements
 */
router.post(
  "/improve",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      await scamAdviserService.improveAutomatedTrustSignals();

      res.json({
        success: true,
        message: "Trust improvement tasks completed",
      });
    } catch (error) {
      logger.error("Error running trust improvements:", error);
      res.status(500).json({
        success: false,
        error: "Failed to run trust improvements",
      });
    }
  }
);

export default router;
