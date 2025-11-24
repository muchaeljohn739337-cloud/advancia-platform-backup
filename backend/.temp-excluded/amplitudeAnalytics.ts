import express, { Request, Response } from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import prisma from "../prismaClient";

const router = express.Router();

// Amplitude Analytics Integration for Advancia Pay Ledger
// This provides advanced user behavior analytics, funnel analysis, and cohort tracking

/**
 * POST /api/analytics/amplitude/track
 * Track user events for Amplitude analytics
 * Events: user_registration, email_verified, transaction_completed, crypto_purchase, etc.
 */
router.post(
  "/amplitude/track",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      const {
        eventName,
        eventProperties = {},
        userProperties = {},
        sessionId,
        deviceInfo = {},
        referrer,
        url,
        platform,
        appVersion,
      } = req.body;

      // Validate required fields
      if (!eventName) {
        return res.status(400).json({ error: "eventName is required" });
      }

      // Store event in database for Amplitude sync and local analytics
      const event = await prisma.analyticsEvent.create({
        data: {
          userId,
          sessionId,
          eventName,
          eventProperties,
          userProperties,
          deviceInfo: {
            ...deviceInfo,
            userAgent: req.get("user-agent"),
            ip: req.ip,
          },
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          referrer,
          url,
          platform,
          appVersion,
          timestamp: new Date(),
        },
      });

      // TODO: Send to Amplitude API (when API key is configured)
      // const amplitudeResponse = await sendToAmplitude({
      //   user_id: userId,
      //   event_type: eventName,
      //   event_properties: eventProperties,
      //   user_properties: userProperties,
      //   time: Date.now(),
      //   session_id: sessionId,
      //   device_id: deviceId
      // });

      res.json({
        success: true,
        eventId: event.id,
        tracked: true,
      });
    } catch (error) {
      console.error("Amplitude track error:", error);
      res.status(500).json({ error: "Failed to track event" });
    }
  },
);

/**
 * GET /api/analytics/amplitude/user-journey/:userId
 * Get detailed user journey for cohort analysis
 * Shows user progression: Registration → Verification → First Transaction → Power User
 */
router.get(
  "/amplitude/user-journey/:userId",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { days = 90 } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(days));

      // Get user's complete event timeline
      const events = await prisma.analyticsEvent.findMany({
        where: {
          userId,
          timestamp: { gte: startDate },
        },
        orderBy: { timestamp: "asc" },
      });

      // Get user profile data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          createdAt: true,
          usdBalance: true,
          role: true,
          active: true,
          approved: true,
        },
      });

      // Analyze journey stages
      const journeyStages = {
        registered:
          events.some((e) => e.eventName === "user_registered") || !!user,
        emailVerified: events.some((e) => e.eventName === "email_verified"),
        profileCompleted: events.some((e) => e.eventName === "profile_updated"),
        firstLogin: events.some((e) => e.eventName === "user_login"),
        firstTransaction: events.some(
          (e) => e.eventName === "transaction_completed",
        ),
        firstCryptoPurchase: events.some(
          (e) => e.eventName === "crypto_purchase",
        ),
        firstWithdrawal: events.some(
          (e) => e.eventName === "withdrawal_completed",
        ),
        powerUser:
          events.filter((e) => e.eventName === "transaction_completed")
            .length >= 5,
      };

      // Calculate engagement metrics
      const engagement = {
        totalEvents: events.length,
        sessionCount: new Set(events.map((e) => e.sessionId).filter(Boolean))
          .size,
        avgSessionDuration: calculateAvgSessionDuration(events),
        mostUsedFeature: getMostUsedFeature(events),
        lastActivity: events[events.length - 1]?.timestamp,
      };

      // Behavioral insights
      const insights = {
        onboardingCompletion: calculateOnboardingCompletion(journeyStages),
        engagementScore: calculateEngagementScore(events),
        riskProfile: assessUserRisk(events),
        lifetimeValue: await calculateLifetimeValue(userId),
      };

      res.json({
        userId,
        userProfile: user,
        journeyStages,
        engagement,
        insights,
        recentEvents: events.slice(-10), // Last 10 events
        timeRange: { start: startDate, end: new Date() },
      });
    } catch (error) {
      console.error("User journey error:", error);
      res.status(500).json({ error: "Failed to fetch user journey" });
    }
  },
);

/**
 * GET /api/analytics/amplitude/funnels
 * Conversion funnel analysis (Amplitude-style)
 * Tracks user progression through key business metrics
 */
router.get(
  "/amplitude/funnels",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, segment } = req.query;
      const start = startDate
        ? new Date(startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      // Build segment filter
      const segmentFilter = segment
        ? buildSegmentFilter(segment as string)
        : {};

      // Main conversion funnel: Registration → Email Verification → First Transaction → Repeat User
      const [
        registrations,
        verifications,
        firstTransactions,
        repeatUsers,
        cryptoUsers,
        highValueUsers,
      ] = await Promise.all([
        // Step 1: User Registrations
        prisma.analyticsEvent.count({
          where: {
            eventName: "user_registered",
            timestamp: { gte: start, lte: end },
            ...segmentFilter,
          },
        }),

        // Step 2: Email Verifications
        prisma.analyticsEvent.count({
          where: {
            eventName: "email_verified",
            timestamp: { gte: start, lte: end },
            ...segmentFilter,
          },
        }),

        // Step 3: First Transactions
        prisma.analyticsEvent
          .groupBy({
            by: ["userId"],
            where: {
              eventName: "transaction_completed",
              timestamp: { gte: start, lte: end },
              ...segmentFilter,
            },
            _count: { userId: true },
          })
          .then((groups) => groups.filter((g) => g._count.userId === 1).length),

        // Step 4: Repeat Users (5+ transactions)
        prisma.analyticsEvent
          .groupBy({
            by: ["userId"],
            where: {
              eventName: "transaction_completed",
              timestamp: { gte: start, lte: end },
              ...segmentFilter,
            },
            _count: { userId: true },
          })
          .then((groups) => groups.filter((g) => g._count.userId >= 5).length),

        // Crypto Adoption Funnel
        prisma.analyticsEvent.count({
          where: {
            eventName: "crypto_wallet_created",
            timestamp: { gte: start, lte: end },
            ...segmentFilter,
          },
        }),

        // High Value Users ($1000+ balance)
        prisma.user.count({
          where: {
            usdBalance: { gte: 1000 },
            createdAt: { gte: start, lte: end },
            ...segmentFilter,
          },
        }),
      ]);

      const mainFunnel = {
        name: "User Activation Funnel",
        period: { start, end },
        steps: [
          {
            name: "User Registration",
            count: registrations,
            conversionRate: 100,
          },
          {
            name: "Email Verification",
            count: verifications,
            conversionRate:
              registrations > 0
                ? Number(((verifications / registrations) * 100).toFixed(1))
                : 0,
          },
          {
            name: "First Transaction",
            count: firstTransactions,
            conversionRate:
              verifications > 0
                ? Number(((firstTransactions / verifications) * 100).toFixed(1))
                : 0,
          },
          {
            name: "Power User (5+ txns)",
            count: repeatUsers,
            conversionRate:
              firstTransactions > 0
                ? Number(((repeatUsers / firstTransactions) * 100).toFixed(1))
                : 0,
          },
        ],
      };

      const cryptoFunnel = {
        name: "Crypto Adoption Funnel",
        steps: [
          { name: "Total Users", count: registrations },
          {
            name: "Crypto Wallets Created",
            count: cryptoUsers,
            conversionRate:
              registrations > 0
                ? Number(((cryptoUsers / registrations) * 100).toFixed(1))
                : 0,
          },
        ],
      };

      res.json({
        mainFunnel,
        cryptoFunnel,
        summary: {
          totalUsers: registrations,
          conversionRate:
            mainFunnel.steps[mainFunnel.steps.length - 1].conversionRate,
          highValueUsers,
          avgTransactionsPerUser: await calculateAvgTransactions(start, end),
        },
      });
    } catch (error) {
      console.error("Funnel analysis error:", error);
      res.status(500).json({ error: "Failed to generate funnel analysis" });
    }
  },
);

/**
 * GET /api/analytics/amplitude/cohorts
 * Cohort analysis showing user retention and behavior patterns
 */
router.get(
  "/amplitude/cohorts",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { period = "monthly", months = 6 } = req.query;

      // Generate cohort analysis
      const cohorts: any[] = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', u."createdAt") as cohort_month,
        COUNT(DISTINCT u.id) as cohort_size,
        COUNT(DISTINCT CASE WHEN ae."eventName" = 'transaction_completed' AND ae.timestamp >= u."createdAt" THEN u.id END) as active_users,
        COUNT(DISTINCT CASE WHEN ae."eventName" = 'transaction_completed' AND ae.timestamp >= u."createdAt" + INTERVAL '30 days' THEN u.id END) as retained_30d,
        COUNT(DISTINCT CASE WHEN ae."eventName" = 'transaction_completed' AND ae.timestamp >= u."createdAt" + INTERVAL '90 days' THEN u.id END) as retained_90d,
        AVG(CASE WHEN ae."eventName" = 'transaction_completed' THEN 1 ELSE 0 END) as avg_transactions_per_user
      FROM users u
      LEFT JOIN analytics_events ae ON u.id = ae."userId"
      WHERE u."createdAt" >= NOW() - INTERVAL '${months} months'
      GROUP BY cohort_month
      ORDER BY cohort_month DESC
    `;

      res.json({
        cohorts,
        insights: {
          bestCohort: findBestCohort(cohorts),
          retentionTrend: calculateRetentionTrend(cohorts),
          recommendations: generateCohortRecommendations(cohorts),
        },
      });
    } catch (error) {
      console.error("Cohort analysis error:", error);
      res.status(500).json({ error: "Failed to generate cohort analysis" });
    }
  },
);

// Helper functions for analytics calculations
function calculateAvgSessionDuration(events: any[]): number {
  // Implementation for session duration calculation
  return 0; // Placeholder
}

function getMostUsedFeature(events: any[]): string {
  const featureCounts = events.reduce(
    (acc, event) => {
      const feature = event.eventProperties?.feature || event.eventName;
      acc[feature] = (acc[feature] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    Object.entries(featureCounts).sort(
      ([, a], [, b]) => (b as number) - (a as number),
    )[0]?.[0] || "unknown"
  );
}

function calculateOnboardingCompletion(stages: any): number {
  const requiredStages = [
    "registered",
    "emailVerified",
    "profileCompleted",
    "firstLogin",
  ];
  const completedStages = requiredStages.filter((stage) => stages[stage]);
  return (completedStages.length / requiredStages.length) * 100;
}

function calculateEngagementScore(events: any[]): number {
  // Simple engagement score based on event frequency and diversity
  const eventNames = new Set(events.map((e) => e.eventName));
  const eventsPerDay = events.length / 30; // Assuming 30-day period
  return eventNames.size * 10 + eventsPerDay * 5;
}

function assessUserRisk(events: any[]): string {
  // Risk assessment based on behavior patterns
  const highRiskBehaviors = events.filter((e) =>
    ["withdrawal_completed", "password_reset"].includes(e.eventName),
  ).length;

  if (highRiskBehaviors > 10) return "high";
  if (highRiskBehaviors > 5) return "medium";
  return "low";
}

async function calculateLifetimeValue(userId: string): Promise<number> {
  // Calculate user's lifetime value based on transactions
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    select: { amount: true, type: true },
  });

  return transactions.reduce((total, txn) => {
    return total + (txn.type === "credit" ? txn.amount : -txn.amount);
  }, 0);
}

function buildSegmentFilter(segment: string): any {
  // Build filters for user segments
  switch (segment) {
    case "new_users":
      return {
        user: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      };
    case "power_users":
      return { user: { usdBalance: { gte: 1000 } } };
    case "crypto_users":
      return { eventName: "crypto_purchase" };
    default:
      return {};
  }
}

async function calculateAvgTransactions(
  start: Date,
  end: Date,
): Promise<number> {
  const result = await prisma.analyticsEvent.aggregate({
    where: {
      eventName: "transaction_completed",
      timestamp: { gte: start, lte: end },
    },
    _count: { id: true },
  });

  const userCount = await prisma.user.count({
    where: { createdAt: { gte: start, lte: end } },
  });

  return userCount > 0 ? result._count.id / userCount : 0;
}

function findBestCohort(cohorts: any[]): any {
  return cohorts.reduce((best, current) =>
    current.retained_30d / current.cohort_size >
    best.retained_30d / best.cohort_size
      ? current
      : best,
  );
}

function calculateRetentionTrend(cohorts: any[]): string {
  if (cohorts.length < 2) return "insufficient_data";

  const recent = cohorts.slice(0, 3);
  const older = cohorts.slice(3);

  const recentAvg =
    recent.reduce((sum, c) => sum + c.retained_30d / c.cohort_size, 0) /
    recent.length;
  const olderAvg =
    older.length > 0
      ? older.reduce((sum, c) => sum + c.retained_30d / c.cohort_size, 0) /
        older.length
      : recentAvg;

  if (recentAvg > olderAvg * 1.1) return "improving";
  if (recentAvg < olderAvg * 0.9) return "declining";
  return "stable";
}

function generateCohortRecommendations(cohorts: any[]): string[] {
  const recommendations = [];

  const retentionTrend = calculateRetentionTrend(cohorts);
  if (retentionTrend === "declining") {
    recommendations.push("Implement re-engagement campaigns for older cohorts");
  }

  const bestCohort = findBestCohort(cohorts);
  if (bestCohort) {
    recommendations.push(
      `Study ${bestCohort.cohort_month} cohort for successful patterns`,
    );
  }

  return recommendations;
}

export default router;
