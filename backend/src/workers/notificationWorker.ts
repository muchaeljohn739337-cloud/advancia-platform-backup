import dotenv from "dotenv";
dotenv.config();

import logger from "../logger";
import prisma from "../prismaClient";
import { createNotification } from "../services/notificationService";
import { consumeQueue } from "../utils/queue";

interface NotificationJob {
  userId: number | string;
  type: string;
  title: string;
  message: string;
  priority?: "low" | "normal" | "high" | "urgent";
  category?: "transaction" | "security" | "system" | "reward" | "admin";
  metadata?: Record<string, any>;
}

/**
 * Notification Worker
 * Consumes messages from the notification queue and processes them
 */
async function processNotification(job: NotificationJob): Promise<void> {
  const { userId, type, title, message, metadata, priority, category } = job;
  const userIdStr = String(userId); // Convert to string for Prisma

  try {
    logger.info(`Processing notification for user ${userIdStr}`, {
      type,
      title,
      priority: priority || "normal",
    });

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userIdStr },
      select: { id: true, email: true },
    });

    if (!user) {
      logger.warn(`User ${userIdStr} not found, skipping notification`);
      return;
    }

    // Send notification via notification service (handles socket, push, email)
    await createNotification({
      userId: userIdStr,
      type: "all",
      priority: priority || "normal",
      category: category || "system",
      title,
      message,
      data: metadata,
    });

    logger.info(`Notification sent successfully to user ${userIdStr}`, {
      type,
    });
  } catch (error) {
    logger.error(`Failed to process notification for user ${userIdStr}`, {
      error: error instanceof Error ? error.message : String(error),
      type,
    });
    throw error; // Re-throw to trigger retry logic in queue
  }
}

async function start() {
  logger.info("Starting notification worker...");

  try {
    // Initialize queue connection first
    const { initQueue } = require("../utils/queue");
    await initQueue();
    logger.info("Queue initialized successfully");

    // Start consuming from the notification queue
    await consumeQueue("notifications", async (message) => {
      try {
        const job: NotificationJob = JSON.parse(message.content.toString());
        await processNotification(job);
        return true; // ACK message
      } catch (error) {
        logger.error("Failed to process notification job", {
          error: error instanceof Error ? error.message : String(error),
        });
        return false; // NACK message for retry
      }
    });

    logger.info("Notification worker started successfully");
  } catch (error) {
    logger.error("Failed to start notification worker", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Notification worker shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Notification worker shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

// Start the worker
start().catch((error) => {
  logger.error("Worker startup failed", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
