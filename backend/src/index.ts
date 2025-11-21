// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config();

// Sentry setup
const Sentry = require("@sentry/node");
Sentry.init({
  dsn: "https://41dbdb2c446534ac933de22ca5c2778c@o4510400768573440.ingest.us.sentry.io/4510400800096256",
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
});

// Example AI SDK usage (must be inside an async function)
const { generateText } = require("ai");
const { openai } = require("@ai-sdk/openai");

async function getJoke() {
  const result = await generateText({
    model: openai("gpt-4o"),
    prompt: "Tell me a joke",
    experimental_telemetry: {
      isEnabled: true,
      recordInputs: true,
      recordOutputs: true,
    },
  });
  console.log(result.text);
}
// You can call getJoke() somewhere in your app logic if needed

// ---------------------------------------------------------------------------
// Firm safe defaults for local/dev runs to prevent import-time exits
// These can be overridden explicitly via the environment.
// ---------------------------------------------------------------------------
if (process.env.NODE_ENV !== "production") {
  if (!process.env.SKIP_DATABASE_VALIDATION)
    process.env.SKIP_DATABASE_VALIDATION = "1";
  if (!process.env.OTEL_TRACING_ENABLED)
    process.env.OTEL_TRACING_ENABLED = "false";
  if (typeof process.env.SENTRY_DSN === "undefined")
    process.env.SENTRY_DSN = "";
  if (!process.env.ENABLE_CRON) process.env.ENABLE_CRON = "false";
  if (!process.env.DIAG_INTERCEPT_EXIT) process.env.DIAG_INTERCEPT_EXIT = "1"; // convert process.exit to throw for visibility
  console.log("[DIAG] Applied dev-safe defaults:", {
    SKIP_DATABASE_VALIDATION: process.env.SKIP_DATABASE_VALIDATION,
    OTEL_TRACING_ENABLED: process.env.OTEL_TRACING_ENABLED,
    SENTRY_DSN: process.env.SENTRY_DSN ? "set" : "",
    ENABLE_CRON: process.env.ENABLE_CRON,
    DIAG_INTERCEPT_EXIT: process.env.DIAG_INTERCEPT_EXIT,
  });
}

// ---------------------------------------------------------------------------
// Diagnostic exit interception (set DIAG_INTERCEPT_EXIT=1 to convert exits
// into visible errors for startup root-cause analysis)
// ---------------------------------------------------------------------------
if (process.env.DIAG_INTERCEPT_EXIT === "1") {
  const originalExit = process.exit;
  (process as any).__originalExit = originalExit;
  process.exit = ((code?: number) => {
    throw new Error(`[EXIT_INTERCEPT] process.exit(${code ?? 0}) intercepted`);
  }) as any;
  console.log("[DIAG] process.exit interception active");
}

// ---------------------------------------------------------------------------
// Conditional tracing: allow disabling via OTEL_TRACING_ENABLED env toggle
// ---------------------------------------------------------------------------
if (process.env.OTEL_TRACING_ENABLED === "true") {
  try {
    require("./tracing");
    console.log("[DIAG] Tracing initialized");
  } catch (e) {
    console.error("[DIAG] Tracing init failed", e);
  }
} else {
  console.log("[DIAG] Tracing disabled (OTEL_TRACING_ENABLED != true)");
}

console.log("🚀 Backend starting...");
console.log("📍 Working directory:", process.cwd());
console.log("🔧 Node version:", process.version);

// EARLY DIAGNOSTIC INSTRUMENTATION
let __earlyFailureTop = false;
process.on("uncaughtException", (err) => {
  console.error("[FATAL-TOP] Uncaught Exception early:", err);
  __earlyFailureTop = true;
});
process.on("unhandledRejection", (reason) => {
  console.error("[FATAL-TOP] Unhandled Rejection early:", reason);
  __earlyFailureTop = true;
});
process.on("beforeExit", (code) => {
  console.log(
    `[DIAG-TOP] beforeExit code=${code} earlyFailure=${__earlyFailureTop}`
  );
});
process.on("exit", (code) => {
  console.log(`[DIAG-TOP] exit code=${code} earlyFailure=${__earlyFailureTop}`);
});
console.log("[DIAG-TOP] Beginning phased route import (Phase 1 minimal)");
if (process.env.ENABLE_CRON === "true") {
  console.log("[DIAG] Cron jobs enabled (ENABLE_CRON=true)");
} else {
  console.log("[DIAG] Cron jobs disabled (ENABLE_CRON!=true)");
}

import cors from "cors";
import express from "express";
import http from "http";
import jwt from "jsonwebtoken";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { activityLogger } from "./middleware/activityLogger";
import { authenticateToken, requireAdmin } from "./middleware/auth";
import {
  helmetMiddleware,
  rateLimit,
  validateInput,
} from "./middleware/security";
import prisma from "./prismaClient";
import authRouter from "./routes/auth";
import authAdminRouter, {
  activeSessions,
  setBroadcastSessions as setAuthBroadcast,
} from "./routes/authAdmin";
console.log("[DIAG] About to import prismaClient...");
console.log("[DIAG] prismaClient imported successfully");
// import adminRouter from "./routes/admin"; // TEMPORARILY DISABLED FOR PROD BUILD
// import adminWalletsRouter from "./routes/adminWallets"; // Disabled for crash isolation
// import adminBulkActionsRouter from "./routes/adminBulkActions";
// import adminDashboardRouter from "./routes/adminDashboard";
// import aiAnalyticsRouter from "./routes/aiAnalytics";
// import amplitudeAnalyticsRouter from "./routes/amplitudeAnalytics";
// import analyticsRouter from "./routes/analytics";
// import analyticsEnhancedRouter from "./routes/analyticsEnhanced";
console.log("[DIAG] About to import authRouter...");
console.log("[DIAG] authRouter imported successfully");
// import chatRouter, { setChatSocketIO } from "./routes/chat";
// import consultationRouter from "./routes/consultation";
// import cryptoEnhancedRouter from "./routes/cryptoEnhanced";
// import cryptomusRouter from "./routes/cryptomus";
// import debitCardRouter, { setDebitCardSocketIO } from "./routes/debitCard";
// import debitCardEnhancedRouter from "./routes/debitCardEnhanced";
// import emailRouter from "./routes/email"; // Email templates router
// import emailTestRouter from "./routes/email-test"; // Email testing endpoints
// import emailsRouter from "./routes/emails";
import emailSignupRouter from "./routes/emailSignup"; // Email magic link signup
import healthRouter from "./routes/health";
// import invoicesRouter from "./routes/invoices";
// import ipBlocksRouter from "./routes/ipBlocks"; // TEMP DISABLED to unblock startup
// import marketingRouter from "./routes/marketing";
// import medbedsRouter, { setMedbedsSocketIO } from "./routes/medbeds";
// import oalRouter, { setOALSocketIO } from "./routes/oal";
import passwordRecoveryRouter from "./routes/passwordRecovery"; // Password recovery & user details
import handleStripeWebhook, {
  setPaymentsSocketIO,
} from "./routes/paymentsWebhook";
// import paymentsRouter, {
//   handleStripeWebhook,
//   setPaymentsSocketIO,
// } from "./routes/payments";
import paymentsEnhancedRouter from "./routes/paymentsEnhanced";
// import rewardsRouter from "./routes/rewards";
// import securityLevelRouter from "./routes/securityLevel"; // Disabled to isolate middleware crash
// import sendEmailRouter from "./routes/send-email"; // Universal email sending
import sessionsRouter, {
  setBroadcastSessions as setSessionsBroadcast,
} from "./routes/sessions";
import subscribersRouter from "./routes/subscribers";
import supportRouter /* , { setSupportSocketIO } */ from "./routes/support"; // Re-enabled after middleware hardening
import systemRouter from "./routes/system";
import tokenRefreshRouter from "./routes/tokenRefresh";
import tokensRouter /* , { setTokenSocketIO } */ from "./routes/tokens";
import trustRouter from "./routes/trust"; // Scam Adviser & trust verification
// import trustpilotRouter from "./routes/trustpilot"; // Removed - using simple widget embed instead
// import trustScoreRouter from "./routes/trustScore"; // User trust & reputation system (TEMPORARILY DISABLED)
import pricesRouter from "./routes/prices";
import securityRouter from "./routes/security"; // Breach monitoring & IP protection
import telegramRouter from "./routes/telegram";
import telegramWebhookRouter from "./routes/telegramWebhook";
import transactionsRouter /* , { setTransactionSocketIO } */ from "./routes/transactions";
import twoFactorRouter from "./routes/twoFactor";
// import walletsRouter from "./routes/wallets"; // TEMP DISABLED FOR PROD BUILD
// import adminUsersRouter, { setAdminUsersSocketIO } from "./routes/users";
import withdrawalsRouter from "./routes/withdrawals";
// import { setSocketIO as setNotificationSocket } from "./services/notificationService";
// import "./tracing";
import { dataMasker } from "./utils/dataMasker";
import { initSentry } from "./utils/sentry";
import { sanitizeInput } from "./validation/middleware";
// Global fatal error handlers to expose startup issues clearly
// (Legacy instrumentation removed; using EARLY DIAGNOSTIC INSTRUMENTATION above)

import { config } from "./config";

// Safe middleware wrappers (prevent undefined crashes during partial builds)
const safeAuth: any =
  typeof authenticateToken === "function"
    ? authenticateToken
    : (_req: any, _res: any, next: any) => next();
const safeAdmin: any =
  typeof requireAdmin === "function"
    ? requireAdmin
    : (_req: any, _res: any, next: any) => next();

// Initialize Sentry only if DSN provided (blank SENTRY_DSN disables)
if (process.env.SENTRY_DSN) {
  try {
    initSentry();
    console.log("[DIAG] Sentry initialized");
  } catch (e) {
    console.error("[DIAG] Sentry init failed", e);
  }
} else {
  console.log("[DIAG] Sentry disabled (SENTRY_DSN not set)");
}

// Create HTTP server (CloudFlare handles SSL termination)
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: config.allowedOrigins, credentials: true },
});
setPaymentsSocketIO(io);

// Trust proxy (needed when behind Cloudflare/NGINX for correct IPs and HTTPS)
app.set("trust proxy", 1);
// Telegram webhook (no auth; Telegram posts updates here). Keep before error handlers.
app.use("/api/telegram/webhook", telegramWebhookRouter);
// Stripe webhook BEFORE express.json (raw body needed for signature verification)
if (config.stripeWebhookSecret) {
  app.post(
    "/api/payments/webhook",
    express.raw({ type: "application/json" }),
    handleStripeWebhook
  );
}

// Configure CORS with allowed origins
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (config.allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

// Enrich tracing spans with route + user info early
// app.use(enrichRequestSpan);

// Stripe webhook MUST use raw body, so register it BEFORE express.json()
// app.post(
//   "/api/payments/webhook",
//   express.raw({ type: "application/json" }),
//   handleStripeWebhook
// );

// JSON parser and common middlewares AFTER webhook
app.use(express.json());
app.use(helmetMiddleware());
app.use(sanitizeInput);
app.use(dataMasker.createResponseSanitizer());
app.use(validateInput);
app.use(activityLogger);
app.use("/api", rateLimit({ windowMs: 60_000, maxRequests: 300 }));

// Root health check endpoint (for load balancers/monitoring - no /api prefix)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Health check endpoint (critical for production monitoring)
app.use("/api", healthRouter);

// Auth routes (public)
app.use("/api/auth", tokenRefreshRouter); // Token refresh endpoint

// Regular routes (minimal set enabled)
// app.use("/api/debit-cards", authenticateToken, debitCardEnhancedRouter); // Enhanced card management
app.use("/api/support", supportRouter);
// app.use("/api/ai-analytics", aiAnalyticsRouter);
app.use("/api/auth", authRouter);
app.use("/api/payments", paymentsEnhancedRouter); // Stripe payment intents & methods

// Admin routes - PROTECTED with requireAdmin middleware
// app.use(
//   "/api/admin/analytics",
//   authenticateToken,
//   requireAdmin,
//   analyticsRouter
// );
// app.use("/api/analytics", authenticateToken, analyticsEnhancedRouter); // Enhanced analytics with export
// app.use("/api/analytics", authenticateToken, amplitudeAnalyticsRouter); // Amplitude-style analytics
// app.use(
//   "/api/admin/security",
//   authenticateToken,
//   requireAdmin,
//   securityLevelRouter
// );
// Admin ip-blocks route temporarily fully disabled to avoid middleware init crash
// app.use(
//   "/api/admin/ip-blocks",
//   safeAuth,
//   safeAdmin,
//   ipBlocksRouter
// );
// app.use(
//   "/api/admin/user-approval",
//   authenticateToken,
//   requireAdmin,
//   userApprovalRouter
// );
app.use("/api/admin/telegram", safeAuth, safeAdmin, telegramRouter);
// Admin wallets route temporarily disabled
// app.use(
//   "/api/admin/wallets",
//   safeAuth,
//   safeAdmin,
//   adminWalletsRouter
// );
// app.use("/api/admin", authenticateToken, requireAdmin, adminUsersRouter);
// app.use("/api/admin", authenticateToken, requireAdmin, adminDashboardRouter);
// app.use("/api/admin", authenticateToken, requireAdmin, adminRouter); // TEMPORARILY DISABLED FOR PROD BUILD
// app.use(
//   "/api/admin/bulk",
//   authenticateToken,
//   requireAdmin,
//   adminBulkActionsRouter
// ); // Bulk user actions

// Admin auth (public - for login)
app.use("/api/auth/admin", authAdminRouter);

// User routes
app.use("/api/transactions", transactionsRouter);
// app.use("/api/chat", chatRouter);
// app.use("/api/consultation", consultationRouter);
app.use("/api/system", systemRouter);
// app.use("/api/marketing", marketingRouter);
app.use("/api/subscribers", subscribersRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/withdrawals", withdrawalsRouter);
// app.use("/api/oal", oalRouter);
app.use("/api/tokens", tokensRouter);
// app.use("/api/wallets", walletsRouter); // Custodial HD wallets (BTC/ETH/USDT) - TEMP DISABLED FOR PROD BUILD
app.use("/api/prices", pricesRouter); // Multi-provider price service (CoinGecko + Binance)
// app.use("/api/trust-score", trustScoreRouter); // User trust & reputation system (TEMPORARILY DISABLED - import issue)
// app.use("/api/trustpilot", trustpilotRouter); // Removed - using simple widget embed instead
app.use("/api/trust", trustRouter); // Scam Adviser & trust verification
app.use("/api/security", securityRouter); // Breach monitoring & IP protection
// app.use("/api/tokens", authenticateToken, tokensEnhancedRouter); // Enhanced token features
// app.use("/api/crypto", authenticateToken, cryptoEnhancedRouter); // Crypto charts & swap (RE-ENABLED)
// app.use("/api/cryptomus", cryptomusRouter); // Cryptomus payment processing
// app.use("/api/invoices", invoicesRouter);
// app.use("/api/emails", emailsRouter);
// app.use("/api/email", emailRouter); // New email templates endpoint
// app.use("/api", emailTestRouter); // Email testing endpoints
// app.use("/api", sendEmailRouter); // Universal email sending (Gmail SMTP)
// app.use("/api/webhooks", webhooksRouter); // Resend webhook handlers
// app.use("/api/rewards", rewardsRouter);
app.use("/api/auth/2fa", twoFactorRouter);
// app.use("/api/health-readings", healthReadingsRouter);
app.use("/api/password-recovery", passwordRecoveryRouter); // Password recovery & admin user lookup
app.use("/api/auth", emailSignupRouter); // Email magic link signup

// Socket.IO connection handling
// JWT auth for Socket.IO handshake
io.use(async (socket, next) => {
  try {
    const token =
      (socket.handshake.auth?.token as string) ||
      (socket.handshake.query?.token as string);
    const guestSessionId =
      (socket.handshake.auth?.guestSessionId as string) ||
      (socket.handshake.query?.guestSessionId as string);
    if (!token) {
      // Allow unauthenticated chat listeners for guest chat sessions
      if (
        guestSessionId &&
        typeof guestSessionId === "string" &&
        guestSessionId.length >= 6
      ) {
        (socket as any).data = { guestSessionId };
        return next();
      }
      return next(new Error("Auth token or guestSessionId required"));
    }
    const cleaned = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
    const payload = jwt.verify(cleaned, config.jwtSecret) as {
      userId: string;
      email?: string;
    };
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, active: true },
    });
    if (!user || user.active === false)
      return next(new Error("Account disabled"));
    (socket as any).data = { userId: user.id, role: user.role };
    next();
  } catch (e) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  const { userId, role, guestSessionId } = (socket as any).data || {};
  if (userId) socket.join(`user-${userId}`);
  if (role === "ADMIN") socket.join("admins");
  if (guestSessionId) socket.join(`chat-session-${guestSessionId}`);

  // Optional: clients may request to join again with validation
  socket.on("join-room", (reqUserId: string) => {
    if (reqUserId && reqUserId === userId) socket.join(`user-${userId}`);
  });

  // Broadcast session updates to admins
  socket.emit("sessions:update", activeSessions);
});

// Broadcast sessions update helper
export function broadcastSessions() {
  io.to("admins").emit("sessions:update", activeSessions);
}

// Inject Socket.IO into services/routers that need it (minimal set)
// setNotificationSocket(io);
// setTransactionSocketIO(io);
// setAdminUsersSocketIO(io);
// setDebitCardSocketIO(io);
// setMedbedsSocketIO(io);
// setChatSocketIO(io);
// setSupportSocketIO(io);
// setPaymentsSocketIO(io);
// setWithdrawalSocketIO(io);
// setOALSocketIO(io);
// setTokenSocketIO(io);

import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { setRateLimiterSocketIO } from "./middleware/rateLimiterRedis";
import { closeQueue, initQueue } from "./utils/queue";
console.log("[DIAG] About to import rateLimiterRedis...");
console.log("[DIAG] rateLimiterRedis imported successfully");
console.log("[DIAG] About to import queue utils...");
console.log("[DIAG] queue utils imported successfully");

setRateLimiterSocketIO(io);

// Wire up session broadcasting
setAuthBroadcast(broadcastSessions);
setSessionsBroadcast(broadcastSessions);

// 404 handler for undefined routes (before error handler)
app.use(notFoundHandler);

// Global error handler (MUST be last middleware)
app.use(errorHandler);

// New /joke route
app.get("/joke", async (req, res) => {
  try {
    await getJoke(); // This will log the joke to the console
    res.json({ success: true, message: "Joke generated and logged!" });
  } catch (error) {
    console.error("Error generating joke:", error);
    res.status(500).json({ success: false, error: "Failed to generate joke" });
  }
});

// Start server (moved into async bootstrap below)
const PORT = config.port || process.env.PORT || 5000;

// Async bootstrap to allow awaiting service initializers (e.g. RabbitMQ)
async function bootstrap() {
  console.log("[DIAG] Bootstrap function called");
  try {
    console.log("[DIAG] Initializing RabbitMQ queue...");
    await initQueue();
    console.log("[INIT] RabbitMQ queues initialized");
  } catch (e) {
    console.error(
      "[INIT] RabbitMQ initialization failed (continuing without queue)",
      e
    );
  }

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

bootstrap();

// Graceful shutdown handler
async function gracefulShutdown(signal: string) {
  console.log(`\n[SHUTDOWN] ${signal} received, starting graceful shutdown...`);

  try {
    // Close queue connection
    await closeQueue();
    console.log("[SHUTDOWN] RabbitMQ connection closed");
  } catch (e) {
    console.error("[SHUTDOWN] Error closing RabbitMQ", e);
  }

  try {
    // Shutdown tracing
    if (process.env.OTEL_TRACING_ENABLED === "true") {
      const { shutdownTracing } = require("./tracing");
      await shutdownTracing();
    }
  } catch (e) {
    console.error("[SHUTDOWN] Error shutting down tracing", e);
  }

  try {
    // Close server
    await new Promise<void>((resolve) => {
      server.close(() => {
        console.log("[SHUTDOWN] HTTP server closed");
        resolve();
      });
      // Force close after 10 seconds
      setTimeout(() => resolve(), 10000);
    });
  } catch (e) {
    console.error("[SHUTDOWN] Error closing server", e);
  }

  try {
    // Close database connection
    await prisma.$disconnect();
    console.log("[SHUTDOWN] Database connection closed");
  } catch (e) {
    console.error("[SHUTDOWN] Error closing database", e);
  }

  console.log("[SHUTDOWN] Graceful shutdown complete");

  // Use original exit if intercept is active, otherwise normal exit
  if ((process as any).__originalExit) {
    (process as any).__originalExit(0);
  } else {
    process.exit(0);
  }
} // Handle shutdown signals
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
