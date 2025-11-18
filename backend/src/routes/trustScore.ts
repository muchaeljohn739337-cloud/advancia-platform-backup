import express from "express";
import { authenticateToken } from "../middleware/auth";
import prisma from "../prismaClient";

const router = express.Router();

interface TrustScoreComponents {
  identityVerification: number; // 0-200
  transactionHistory: number; // 0-200
  walletHealth: number; // 0-200
  platformEngagement: number; // 0-200
  accountAge: number; // 0-200
}

interface TrustScore {
  userId: string;
  overallScore: number; // 0-1000
  level: "Bronze" | "Silver" | "Gold" | "Platinum" | "New User";
  components: TrustScoreComponents;
  badges: string[];
  lastUpdated: Date;
}

/**
 * Calculate user trust score based on multiple factors
 */
async function calculateTrustScore(userId: string): Promise<TrustScore> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      transactions: {
        where: { status: "completed" },
        orderBy: { createdAt: "desc" },
        take: 100,
      },
      tokenWallets: true,
      cryptoWallets: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const components: TrustScoreComponents = {
    identityVerification: 0,
    transactionHistory: 0,
    walletHealth: 0,
    platformEngagement: 0,
    accountAge: 0,
  };

  const badges: string[] = [];

  // 1. Identity Verification (0-200)
  if (user.emailVerified) {
    components.identityVerification += 50;
    badges.push("Email Verified");
  }
  if (user.approved) {
    components.identityVerification += 100;
    badges.push("KYC Approved");
  }
  if (user.role === "ADMIN") {
    components.identityVerification += 50;
    badges.push("Trusted Admin");
  }

  // 2. Transaction History (0-200)
  const txCount = user.transactions.length;
  const totalVolume = user.transactions.reduce(
    (sum, tx) => sum + parseFloat(tx.amount.toString()),
    0
  );

  if (txCount > 0) {
    components.transactionHistory += Math.min(50, txCount * 5); // Up to 10 transactions
    badges.push(`${txCount} Transactions`);
  }
  if (txCount >= 10) {
    badges.push("Active Trader");
  }
  if (txCount >= 50) {
    badges.push("Power User");
  }
  if (totalVolume > 1000) {
    components.transactionHistory += 50;
    badges.push("High Volume");
  }
  if (totalVolume > 10000) {
    components.transactionHistory += 50;
    badges.push("Whale");
  }

  // 3. Wallet Health (0-200)
  const tokenBalance = parseFloat(user.usdBalance?.toString() || "0");
  const cryptoWalletCount = user.cryptoWallets.length;

  if (tokenBalance > 0) {
    components.walletHealth += Math.min(100, tokenBalance / 10);
  }
  if (cryptoWalletCount >= 3) {
    components.walletHealth += 50;
    badges.push("Multi-Currency");
  }
  if (cryptoWalletCount >= 3 && tokenBalance > 100) {
    components.walletHealth += 50;
    badges.push("Diversified Portfolio");
  }

  // 4. Platform Engagement (0-200)
  const accountAgeDays = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (accountAgeDays >= 7) {
    components.platformEngagement += 50;
    badges.push("Active for 1 Week");
  }
  if (accountAgeDays >= 30) {
    components.platformEngagement += 50;
    badges.push("Monthly Member");
  }
  if (accountAgeDays >= 90) {
    components.platformEngagement += 50;
    badges.push("Veteran");
  }

  // 5. Account Age (0-200)
  components.accountAge = Math.min(200, accountAgeDays * 2);

  // Calculate overall score
  const overallScore =
    components.identityVerification +
    components.transactionHistory +
    components.walletHealth +
    components.platformEngagement +
    components.accountAge;

  // Determine level
  let level: TrustScore["level"] = "New User";
  if (overallScore >= 800) {
    level = "Platinum";
    badges.push("🏆 Platinum Member");
  } else if (overallScore >= 600) {
    level = "Gold";
    badges.push("🥇 Gold Member");
  } else if (overallScore >= 400) {
    level = "Silver";
    badges.push("🥈 Silver Member");
  } else if (overallScore >= 200) {
    level = "Bronze";
    badges.push("🥉 Bronze Member");
  }

  return {
    userId: user.id,
    overallScore: Math.round(overallScore),
    level,
    components,
    badges,
    lastUpdated: new Date(),
  };
}

/**
 * GET /api/trust-score/:userId - Get user trust score
 */
router.get("/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Users can only view their own trust score, admins can view any
    if (req.user?.userId !== userId && req.user?.role !== "ADMIN") {
      return res.status(403).json({ error: "Access denied" });
    }

    const trustScore = await calculateTrustScore(userId);

    return res.json({
      success: true,
      trustScore,
    });
  } catch (error) {
    console.error("Trust score calculation error:", error);
    return res.status(500).json({
      error: "Failed to calculate trust score",
    });
  }
});

/**
 * GET /api/trust-score/me - Get current user's trust score
 */
router.get("/me", authenticateToken, async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const trustScore = await calculateTrustScore(req.user.userId);

    return res.json({
      success: true,
      trustScore,
    });
  } catch (error) {
    console.error("Trust score calculation error:", error);
    return res.status(500).json({
      error: "Failed to calculate trust score",
    });
  }
});

/**
 * GET /api/trust-score/leaderboard - Get top users by trust score
 */
router.get("/leaderboard", authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    // Get all users and calculate their scores
    const users = await prisma.user.findMany({
      where: {
        active: true,
      },
      take: 100, // Limit to active users
      orderBy: { createdAt: "asc" },
    });

    const scoresWithUsers = await Promise.all(
      users.map(async (user) => {
        const score = await calculateTrustScore(user.id);
        return {
          userId: user.id,
          username: user.username,
          email: user.email.split("@")[0] + "***", // Anonymize
          score: score.overallScore,
          level: score.level,
          badges: score.badges.slice(0, 3), // Top 3 badges
        };
      })
    );

    // Sort by score descending
    scoresWithUsers.sort((a, b) => b.score - a.score);

    return res.json({
      success: true,
      leaderboard: scoresWithUsers.slice(0, limit),
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return res.status(500).json({
      error: "Failed to fetch leaderboard",
    });
  }
});

export default router;
