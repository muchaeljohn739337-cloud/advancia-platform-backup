import express from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import prisma from "../prismaClient.js";
import {
  generateMasterSeed,
  generateUserWallet,
  initializeUserWallets,
  rotateUserWallet,
} from "../services/custodialWalletService.js";

const router = express.Router();

/**
 * User: Get their crypto wallets
 * GET /api/wallets
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;

    const wallets = await prisma.cryptoWallet.findMany({
      where: { userId },
      select: {
        id: true,
        currency: true,
        balance: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { currency: "asc" },
    });

    res.json({
      success: true,
      wallets: wallets.map((w) => ({
        id: w.id,
        currency: w.currency,
        balance: w.balance.toString(),
        address: w.address,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching wallets:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch wallets",
    });
  }
});

/**
 * User: Generate/regenerate wallet for a specific currency
 * POST /api/wallets/generate/:currency
 */
router.post("/generate/:currency", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { currency } = req.params;

    if (!["BTC", "ETH", "USDT"].includes(currency.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: "Invalid currency. Must be BTC, ETH, or USDT",
      });
    }

    const wallet = await generateUserWallet(
      userId,
      currency.toUpperCase() as "BTC" | "ETH" | "USDT"
    );

    res.json({
      success: true,
      message: `${currency} wallet generated successfully`,
      wallet,
    });
  } catch (error: any) {
    console.error("Error generating wallet:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate wallet",
    });
  }
});

/**
 * User: Initialize all wallets (BTC, ETH, USDT)
 * POST /api/wallets/initialize
 */
router.post("/initialize", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;

    const wallets = await initializeUserWallets(userId);

    res.json({
      success: true,
      message: "All crypto wallets initialized",
      wallets,
    });
  } catch (error: any) {
    console.error("Error initializing wallets:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to initialize wallets",
    });
  }
});

/**
 * User: Rotate wallet address (privacy/security)
 * POST /api/wallets/rotate/:currency
 */
router.post("/rotate/:currency", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { currency } = req.params;
    const { reason } = req.body;

    if (!["BTC", "ETH", "USDT"].includes(currency.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: "Invalid currency. Must be BTC, ETH, or USDT",
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: "Rotation reason required",
      });
    }

    const result = await rotateUserWallet(
      userId,
      currency.toUpperCase() as "BTC" | "ETH" | "USDT",
      reason
    );

    res.json({
      success: true,
      message: `${currency} wallet rotated successfully`,
      rotation: result,
    });
  } catch (error: any) {
    console.error("Error rotating wallet:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Failed to rotate wallet",
    });
  }
});

/**
 * User: Get wallet rotation history
 * GET /api/wallets/history/:currency
 */
router.get("/history/:currency", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { currency } = req.params;

    const wallet = await prisma.cryptoWallet.findFirst({
      where: { userId, currency: currency.toUpperCase() },
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "Wallet not found",
      });
    }

    const history = await prisma.$queryRaw<
      Array<{
        old_address: string;
        rotation_reason: string;
        rotated_at: Date;
      }>
    >`
      SELECT old_address, rotation_reason, rotated_at
      FROM crypto_wallet_history
      WHERE wallet_id = ${wallet.id}
      ORDER BY rotated_at DESC
      LIMIT 10
    `;

    res.json({
      success: true,
      currency: wallet.currency,
      currentAddress: wallet.address,
      history: history.map((h) => ({
        oldAddress: h.old_address,
        reason: h.rotation_reason,
        rotatedAt: h.rotated_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching wallet history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch wallet history",
    });
  }
});

/**
 * Admin: Generate master seed (ONE TIME SETUP ONLY)
 * POST /api/wallets/admin/generate-master-seed
 */
router.post(
  "/admin/generate-master-seed",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      // Check if master seed already configured
      if (process.env.WALLET_MASTER_SEED) {
        return res.status(400).json({
          success: false,
          error:
            "Master seed already configured. Do not regenerate unless migrating.",
        });
      }

      const { mnemonic, seed } = generateMasterSeed();

      res.json({
        success: true,
        warning:
          "CRITICAL: Store this mnemonic in AWS KMS, Azure Key Vault, or secure vault. NEVER commit to git.",
        mnemonic, // 24-word phrase
        instructions: [
          "1. Copy the mnemonic to a secure location (AWS KMS, vault)",
          '2. Add to .env: WALLET_MASTER_SEED="<mnemonic>"',
          "3. Generate encryption key: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"",
          '4. Add to .env: WALLET_ENCRYPTION_KEY="<key>"',
          "5. Restart server",
          "6. NEVER regenerate this seed (all wallets derived from it)",
        ],
      });
    } catch (error) {
      console.error("Error generating master seed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate master seed",
      });
    }
  }
);

/**
 * Admin: Initialize wallets for specific user
 * POST /api/wallets/admin/initialize-user
 */
router.post(
  "/admin/initialize-user",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "userId required",
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      const wallets = await initializeUserWallets(userId);

      res.json({
        success: true,
        message: `Wallets initialized for user ${user.email}`,
        wallets,
      });
    } catch (error: any) {
      console.error("Error initializing user wallets:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to initialize wallets",
      });
    }
  }
);

export default router;
