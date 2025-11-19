import express from "express";
import { authenticateToken } from "../middleware/auth";
import { priceService } from "../services/priceService";

const router = express.Router();

/**
 * GET /api/prices/current/:symbol
 * Get current price for a single cryptocurrency
 */
router.get("/current/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!symbol || symbol.length < 2) {
      return res.status(400).json({ error: "Invalid symbol" });
    }

    const price = await priceService.getCurrentPrice(symbol);

    res.json({
      success: true,
      data: price,
    });
  } catch (error) {
    console.error("Price fetch error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch price",
    });
  }
});

/**
 * POST /api/prices/batch
 * Get current prices for multiple cryptocurrencies
 * Body: { symbols: ["BTC", "ETH", "SOL"] }
 */
router.post("/batch", async (req, res) => {
  try {
    const { symbols } = req.body;

    if (!Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ error: "Invalid symbols array" });
    }

    if (symbols.length > 50) {
      return res
        .status(400)
        .json({ error: "Maximum 50 symbols per batch request" });
    }

    const prices = await priceService.getBatchPrices(symbols);

    // Convert Map to object for JSON response
    const pricesObj: Record<string, any> = {};
    prices.forEach((price, symbol) => {
      pricesObj[symbol] = price;
    });

    res.json({
      success: true,
      data: pricesObj,
      count: prices.size,
    });
  } catch (error) {
    console.error("Batch price fetch error:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch batch prices",
    });
  }
});

/**
 * GET /api/prices/historical/:symbol
 * Get historical price data
 * Query params: days (default: 7, max: 365)
 */
router.get("/historical/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const days = Math.min(parseInt(req.query.days as string) || 7, 365);

    if (!symbol || symbol.length < 2) {
      return res.status(400).json({ error: "Invalid symbol" });
    }

    const historicalData = await priceService.getHistoricalPrices(symbol, days);

    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        days,
        points: historicalData,
        count: historicalData.length,
      },
    });
  } catch (error) {
    console.error("Historical price fetch error:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch historical prices",
    });
  }
});

/**
 * GET /api/prices/status
 * Check health of price providers (admin/monitoring)
 */
router.get("/status", authenticateToken as any, async (req: any, res) => {
  try {
    const isAdmin = req.user?.role === "ADMIN";

    if (!isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const [providerStatus, cacheStats] = await Promise.all([
      priceService.getProviderStatus(),
      priceService.getCacheStats(),
    ]);

    res.json({
      success: true,
      data: {
        providers: providerStatus,
        cache: cacheStats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Price service status error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch status",
    });
  }
});

/**
 * GET /api/prices/portfolio
 * Calculate total portfolio value for authenticated user
 * Requires holdings data from user's wallet/portfolio
 */
router.get("/portfolio", authenticateToken as any, async (req: any, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // TODO: Fetch user's holdings from database
    // For now, return structure for frontend integration
    const mockHoldings = [
      { symbol: "BTC", amount: 0.5 },
      { symbol: "ETH", amount: 2.0 },
    ];

    const symbols = mockHoldings.map((h) => h.symbol);
    const prices = await priceService.getBatchPrices(symbols);

    const portfolioValue = mockHoldings.reduce((total, holding) => {
      const price = prices.get(holding.symbol);
      if (price) {
        return total + price.price * holding.amount;
      }
      return total;
    }, 0);

    const holdings = mockHoldings.map((holding) => {
      const price = prices.get(holding.symbol);
      return {
        symbol: holding.symbol,
        amount: holding.amount,
        currentPrice: price?.price || 0,
        value: price ? price.price * holding.amount : 0,
        change24h: price?.change24h || 0,
      };
    });

    res.json({
      success: true,
      data: {
        userId,
        totalValue: portfolioValue,
        holdings,
        lastUpdated: Date.now(),
      },
    });
  } catch (error) {
    console.error("Portfolio value calculation error:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to calculate portfolio value",
    });
  }
});

export default router;
