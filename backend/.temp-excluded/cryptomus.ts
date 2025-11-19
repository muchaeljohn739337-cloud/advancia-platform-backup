import crypto from "crypto";
import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import prisma from "../prismaClient";
import {
  creditAdminWallet,
  creditUserCryptoWallet,
  emitPaymentNotification,
  recordTransaction,
} from "../services/transactionService.js";

const router = Router();

// Cryptomus configuration (Official API Documentation)
const CRYPTOMUS_API_KEY = process.env.CRYPTOMUS_API_KEY || "";
const CRYPTOMUS_USER_ID = process.env.CRYPTOMUS_MERCHANT_ID || ""; // This is actually userId in their API
const CRYPTOMUS_BASE_URL = "https://api.cryptomus.com/v1";

/**
 * Generate signature for Cryptomus API
 * Official docs: sign = MD5(base64(body) + API_KEY)
 */
function generateSignature(data: any): string {
  const jsonString = JSON.stringify(data);
  const base64 = Buffer.from(jsonString).toString("base64");
  return crypto
    .createHash("md5")
    .update(base64 + CRYPTOMUS_API_KEY)
    .digest("hex");
}

/**
 * Generate signature for empty body (for GET requests)
 */
function generateEmptySignature(): string {
  const base64 = Buffer.from("").toString("base64");
  return crypto
    .createHash("md5")
    .update(base64 + CRYPTOMUS_API_KEY)
    .digest("hex");
}

/**
 * Create a crypto payment invoice
 * POST /api/cryptomus/create-invoice
 */
router.post(
  "/create-invoice",
  authenticateToken as any,
  async (req: any, res) => {
    try {
      const { amount, currency, orderId, description } = req.body;
      const userId = req.user?.user_id;

      if (!amount || !currency) {
        return res
          .status(400)
          .json({ error: "Amount and currency are required" });
      }

      if (!CRYPTOMUS_API_KEY || !CRYPTOMUS_USER_ID) {
        return res.status(503).json({ error: "Cryptomus is not configured" });
      }

      // Create payment data (following official docs structure)
      const paymentData = {
        amount: amount.toString(),
        currency: currency.toUpperCase(), // BTC, ETH, USDT, etc.
        order_id: orderId || `ORDER-${Date.now()}`,
        url_return: `${process.env.FRONTEND_URL}/payments/success`,
        url_callback: `${
          process.env.BACKEND_URL || "http://localhost:4000"
        }/api/cryptomus/webhook`,
        is_payment_multiple: false,
        lifetime: 3600, // 1 hour
        additional_data: JSON.stringify({ userId }),
      };

      const signature = generateSignature(paymentData);

      // Make request to Cryptomus API (following official authentication)
      const response = await fetch(`${CRYPTOMUS_BASE_URL}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          userId: CRYPTOMUS_USER_ID, // Official header name
          sign: signature, // Official header name
        },
        body: JSON.stringify(paymentData),
      });

      const result: any = await response.json();

      if (!response.ok) {
        console.error("Cryptomus API error:", result);
        return res
          .status(500)
          .json({ error: "Failed to create payment invoice" });
      }

      // Store payment record in database
      await prisma.cryptoPayments.create({
        data: {
          id: result.result?.uuid || result.uuid,
          user_id: userId,
          invoice_id: result.result?.uuid || result.uuid,
          amount: parseFloat(amount),
          currency: currency.toUpperCase(),
          status: "pending",
          payment_url: result.result?.url || result.url,
          order_id: paymentData.order_id,
          description: description || "Crypto payment",
        },
      });

      return res.json({
        success: true,
        payment_url: result.result?.url || result.url,
        invoice_id: result.result?.uuid || result.uuid,
        amount,
        currency,
      });
    } catch (error: any) {
      console.error("Cryptomus create invoice error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * Handle Cryptomus webhook callbacks
 * POST /api/cryptomus/webhook
 */
router.post("/webhook", async (req, res) => {
  try {
    const payload = req.body;

    // Verify webhook signature
    const receivedSign = req.headers["sign"] as string;
    const expectedSign = generateSignature(payload);

    if (receivedSign !== expectedSign) {
      console.error("Invalid webhook signature");
      return res.status(403).json({ error: "Invalid signature" });
    }

    const { uuid, status, order_id, amount, currency, additional_data } =
      payload;

    // Update payment status in database
    const payment = await prisma.cryptoPayments.findFirst({
      where: { invoice_id: uuid },
    });

    if (!payment) {
      console.error("Payment not found:", uuid);
      return res.status(404).json({ error: "Payment not found" });
    }

    await prisma.cryptoPayments.update({
      where: { id: payment.id },
      data: {
        status: status === "paid" ? "completed" : status,
        paid_at: status === "paid" ? new Date() : null,
      },
    });

    // If payment is completed, use unified transaction manager
    if (status === "paid") {
      const additionalInfo = JSON.parse(additional_data || "{}");
      const userId = additionalInfo.user_id || payment.user_id;

      // Use unified transaction manager
      await TransactionManager.createTransaction({
        provider: "cryptomus",
        orderId: order_id,
        amount: parseFloat(amount),
        currency: currency,
        userId: userId,
        description: `Crypto payment received (${currency})`,
        metadata: {
          invoiceId: uuid,
          additionalData: additionalInfo,
        },
      });
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Cryptomus webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Get payment status
 * GET /api/cryptomus/status/:invoiceId
 */
router.get("/status/:invoiceId", authenticateToken as any, async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const payment = await prisma.cryptoPayments.findFirst({
      where: { invoice_id: invoiceId },
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    return res.json({
      invoice_id: payment.invoice_id,
      amount: payment.amount.toString(),
      currency: payment.currency,
      status: payment.status,
      payment_url: payment.payment_url,
      created_at: payment.created_at,
      paid_at: payment.paid_at,
    });
  } catch (error: any) {
    console.error("Get payment status error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Verify Cryptomus webhook signature
 */
function verifyCryptomusSignature(body: any, signature: string): boolean {
  const payload = JSON.stringify(body);
  const hmac = crypto
    .createHmac("sha256", CRYPTOMUS_API_KEY)
    .update(payload)
    .digest("hex");
  return hmac === signature;
}

/**
 * Handle Cryptomus payment webhooks
 * POST /api/cryptomus/webhook
 */
router.post("/webhook", async (req, res) => {
  try {
    const signature = req.headers["cryptomus-signature"] as string;
    const body = req.body;

    // Verify signature
    if (!verifyCryptomusSignature(body, signature)) {
      console.error("Invalid Cryptomus webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    console.log("Cryptomus webhook received:", body);

    // Check payment status
    if (body.status === "paid" || body.status === "paid_over") {
      const { order_id, amount, currency, invoice_id } = body;

      // Find the existing crypto payment record
      const existingPayment = await prisma.cryptoPayments.findFirst({
        where: { invoice_id: invoice_id || order_id },
      });

      if (!existingPayment) {
        console.error("Payment not found for invoice:", invoice_id || order_id);
        return res.status(404).json({ error: "Payment not found" });
      }

      // Update payment status
      await prisma.cryptoPayments.update({
        where: { id: existingPayment.id },
        data: {
          status: "paid",
          paid_at: new Date(),
        },
      });

      const paymentAmount = parseFloat(amount);

      // Use transaction service functions
      await recordTransaction({
        provider: "cryptomus",
        orderId: order_id,
        amount: paymentAmount,
        currency: currency.toUpperCase(),
        status: "confirmed",
        userId: existingPayment.user_id,
        description: existingPayment.description || "Crypto payment received",
      });

      await creditAdminWallet(paymentAmount, currency.toUpperCase());
      await creditUserCryptoWallet(
        existingPayment.user_id,
        paymentAmount,
        currency.toUpperCase()
      );

      // Emit real-time notification
      emitPaymentNotification(existingPayment.user_id, {
        provider: "cryptomus",
        amount: paymentAmount,
        currency: currency.toUpperCase(),
        orderId: order_id,
      });

      console.log(
        `✅ Cryptomus payment processed: ${paymentAmount} ${currency} for user ${existingPayment.user_id}`
      );

      return res
        .status(200)
        .json({ message: "Payment processed successfully" });
    }

    return res.status(200).json({ message: "Payment not confirmed" });
  } catch (error: any) {
    console.error("Cryptomus webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Test Cryptomus configuration
 * GET /api/cryptomus/test-config
 */
router.get("/test-config", async (req, res) => {
  try {
    // Check environment variables
    const config = {
      hasApiKey: !!CRYPTOMUS_API_KEY,
      hasUserId: !!CRYPTOMUS_USER_ID,
      hasBaseUrl: !!CRYPTOMUS_BASE_URL,
      userId: CRYPTOMUS_USER_ID
        ? `${CRYPTOMUS_USER_ID.substring(0, 8)}...`
        : "missing",
      baseUrl: CRYPTOMUS_BASE_URL || "missing",
    };

    // Test signature generation
    const testBody = { test: "data" };
    const testSignature = generateSignature(testBody);

    // Test empty signature
    const emptySignature = generateEmptySignature();

    return res.json({
      success: true,
      message: "Cryptomus configuration test",
      config,
      signatureTest: {
        algorithm: "MD5",
        withBody: testSignature ? "✓ Generated" : "✗ Failed",
        emptyBody: emptySignature ? "✓ Generated" : "✗ Failed",
      },
      ready: !!(CRYPTOMUS_API_KEY && CRYPTOMUS_USER_ID && CRYPTOMUS_BASE_URL),
    });
  } catch (error: any) {
    console.error("Config test error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      ready: false,
    });
  }
});

export default router;
