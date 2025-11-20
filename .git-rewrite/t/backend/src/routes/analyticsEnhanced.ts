import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit";
import { authenticateToken } from "../middleware/auth";
import logger from "../logger";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/analytics/transactions/export
 * Export transactions as CSV or PDF
 */
router.get("/transactions/export", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { format = "csv", startDate, endDate, category, minAmount, maxAmount } = req.query;

    // Build filter
    const where: any = { userId };

    if (startDate) {
      where.createdAt = { gte: new Date(startDate as string) };
    }
    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate as string) };
    }
    if (category) {
      where.category = category;
    }
    if (minAmount) {
      where.amount = { gte: parseFloat(minAmount as string) };
    }
    if (maxAmount) {
      where.amount = { ...where.amount, lte: parseFloat(maxAmount as string) };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    if (format === "csv") {
      // Export as CSV
      const fields = ["id", "type", "amount", "description", "category", "status", "createdAt"];
      const parser = new Parser({ fields });
      const csv = parser.parse(transactions);

      res.header("Content-Type", "text/csv");
      res.header("Content-Disposition", `attachment; filename=transactions_${Date.now()}.csv`);
      return res.send(csv);
    } else if (format === "pdf") {
      // Export as PDF
      const doc = new PDFDocument();
      res.header("Content-Type", "application/pdf");
      res.header("Content-Disposition", `attachment; filename=transactions_${Date.now()}.pdf`);

      doc.pipe(res);

      // Header
      doc.fontSize(20).text("Transaction Report", { align: "center" });
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
      doc.moveDown();

      // Transactions
      transactions.forEach((tx, index) => {
        doc.fontSize(10).text(`${index + 1}. ${tx.type} - $${tx.amount}`, { continued: true });
        doc.text(` | ${new Date(tx.createdAt).toLocaleDateString()}`);
        if (tx.description) {
          doc.fontSize(8).text(`   ${tx.description}`, { indent: 20 });
        }
        doc.moveDown(0.5);
      });

      doc.end();
    } else {
      return res.status(400).json({ error: "Invalid format. Use 'csv' or 'pdf'" });
    }
  } catch (error) {
    logger.error("Export error:", error);
    res.status(500).json({ error: "Failed to export transactions" });
  }
});

/**
 * GET /api/analytics/transactions/filter
 * Advanced transaction filtering
 */
router.get("/transactions/filter", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const {
      startDate,
      endDate,
      type,
      category,
      minAmount,
      maxAmount,
      status,
      search,
      page = "1",
      limit = "50",
    } = req.query;

    const where: any = { userId };

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    // Type filter
    if (type) {
      where.type = type;
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount.gte = parseFloat(minAmount as string);
      if (maxAmount) where.amount.lte = parseFloat(maxAmount as string);
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Search in description
    if (search) {
      where.description = {
        contains: search as string,
        mode: "insensitive",
      };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.transaction.count({ where }),
    ]);

    // Calculate summary
    const summary = await prisma.transaction.aggregate({
      where,
      _sum: { amount: true },
      _avg: { amount: true },
      _count: true,
    });

    res.json({
      success: true,
      transactions,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
      summary: {
        totalAmount: summary._sum.amount || 0,
        averageAmount: summary._avg.amount || 0,
        totalTransactions: summary._count,
      },
    });
  } catch (error) {
    logger.error("Filter error:", error);
    res.status(500).json({ error: "Failed to filter transactions" });
  }
});

/**
 * GET /api/analytics/dashboard/stats
 * Enhanced dashboard statistics
 */
router.get("/dashboard/stats", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { period = "30" } = req.query; // Days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period as string));

    // Get transactions for period
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
    });

    // Calculate stats
    const credits = transactions.filter((t) => t.type === "credit");
    const debits = transactions.filter((t) => t.type === "debit");

    const totalCredit = credits.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const totalDebit = debits.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    // Category breakdown
    const categoryBreakdown = transactions.reduce((acc: any, tx) => {
      const cat = tx.category || "Uncategorized";
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += parseFloat(tx.amount.toString());
      return acc;
    }, {});

    // Daily trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split("T")[0];
    }).reverse();

    const dailyTrend = last7Days.map((date) => {
      const dayTxs = transactions.filter(
        (t) => t.createdAt.toISOString().split("T")[0] === date
      );
      return {
        date,
        amount: dayTxs.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
        count: dayTxs.length,
      };
    });

    res.json({
      success: true,
      stats: {
        period: parseInt(period as string),
        totalCredit,
        totalDebit,
        netChange: totalCredit - totalDebit,
        transactionCount: transactions.length,
        averageTransaction: transactions.length
          ? (totalCredit + totalDebit) / transactions.length
          : 0,
        categoryBreakdown,
        dailyTrend,
      },
    });
  } catch (error) {
    logger.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

export default router;
