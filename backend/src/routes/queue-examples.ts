/**
 * Example: Using RabbitMQ Queue in Routes
 *
 * This file demonstrates how to send jobs to the queue from your API routes.
 * Copy these patterns into your actual route files.
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { sendToQueue } from '../utils/queue';

const router = Router();

/**
 * Example 1: Send notification after transaction
 */
router.post('/transactions', authenticateToken, async (req: any, res) => {
  try {
    const { amount, type } = req.body;
    const userId = req.user.id;

    // ... create transaction in database ...

    // Send notification job to queue (non-blocking)
    await sendToQueue('notifications', {
      userId,
      type: 'transaction_completed',
      title: 'Transaction Completed',
      message: `Your ${type} transaction of $${amount} was successful`,
      priority: 'normal',
      metadata: {
        amount,
        type,
        timestamp: new Date().toISOString(),
      },
    });

    res.json({ success: true, message: 'Transaction completed' });
  } catch (error) {
    console.error('Transaction error:', error);
    res.status(500).json({ error: 'Transaction failed' });
  }
});

/**
 * Example 2: Send high-priority security alert
 */
router.post('/auth/2fa/verify', authenticateToken, async (req: any, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    // TODO: Implement actual 2FA verification logic here
    const codeValid = code === '123456'; // Replace with real verification

    if (codeValid) {
      // Send high-priority security notification
      await sendToQueue('notifications', {
        userId,
        type: 'security_alert',
        title: '2FA Verification Successful',
        message: 'Two-factor authentication was successful',
        priority: 'high',
        metadata: {
          action: '2fa_verified',
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid code' });
    }
  } catch (error) {
    console.error('2FA error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * Example 3: Batch notifications for admin actions
 */
router.post(
  '/admin/users/bulk-notify',
  authenticateToken,
  async (req: any, res) => {
    try {
      const { userIds, message, title } = req.body;

      // Send notification to each user (queue handles concurrency)
      const promises = userIds.map((userId: number) =>
        sendToQueue('notifications', {
          userId,
          type: 'admin_announcement',
          title,
          message,
          priority: 'normal',
          metadata: {
            adminId: req.user.id,
            timestamp: new Date().toISOString(),
          },
        }),
      );

      await Promise.all(promises);

      res.json({
        success: true,
        message: `Queued notifications for ${userIds.length} users`,
      });
    } catch (error) {
      console.error('Bulk notify error:', error);
      res.status(500).json({ error: 'Failed to queue notifications' });
    }
  },
);

/**
 * Example 4: Send notification with retry on queue failure
 */
async function sendNotificationSafe(notification: any) {
  try {
    await sendToQueue('notifications', notification);
  } catch (error) {
    console.error(
      'Failed to queue notification, falling back to direct send:',
      error,
    );
    // Fallback: send directly if queue unavailable
    const { sendNotification } = require('../services/notificationService');
    await sendNotification(notification);
  }
}

router.post('/payments/webhook', async (req, res) => {
  try {
    // TODO: Implement actual Stripe webhook processing
    const paymentUserId = 123; // Replace with actual user ID from webhook
    const amount = 50; // Replace with actual amount from webhook

    // Safely send notification with fallback
    await sendNotificationSafe({
      userId: paymentUserId,
      type: 'payment_success',
      title: 'Payment Received',
      message: `Payment of $${amount} was successful`,
      priority: 'high',
    });

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Example 5: Schedule delayed notification (requires delayed message plugin)
 */
router.post('/reminders', authenticateToken, async (req: any, res) => {
  try {
    const { message, delayMinutes } = req.body;
    const userId = req.user.id;

    // Send with delay
    // NOTE: This requires RabbitMQ delayed message exchange plugin
    // For now, send immediately (implement delay plugin separately)
    await sendToQueue('notifications', {
      userId,
      type: 'reminder',
      title: 'Reminder',
      message,
      priority: 'normal',
      metadata: {
        scheduledFor: new Date(
          Date.now() + delayMinutes * 60 * 1000,
        ).toISOString(),
      },
    });

    res.json({
      success: true,
      message: `Reminder scheduled for ${delayMinutes} minutes`,
    });
  } catch (error) {
    console.error('Reminder error:', error);
    res.status(500).json({ error: 'Failed to schedule reminder' });
  }
});

export default router;

/**
 * INTEGRATION CHECKLIST
 *
 * To add queue support to your routes:
 *
 * 1. Import the queue utility:
 *    import { sendToQueue } from "../utils/queue";
 *
 * 2. Send jobs after successful operations:
 *    await sendToQueue("notifications", { userId, type, title, message });
 *
 * 3. Handle queue errors gracefully:
 *    - Use try/catch
 *    - Fallback to direct execution if needed
 *    - Log errors for monitoring
 *
 * 4. Don't wait for queue in critical paths:
 *    - Queue operations are async but don't block responses
 *    - Respond to client before/after queueing based on priority
 *
 * 5. Use appropriate priorities:
 *    - "high": Security alerts, payment confirmations
 *    - "normal": Regular notifications, updates
 *    - "low": Marketing, non-urgent messages
 *
 * 6. Include metadata for debugging:
 *    - Transaction IDs, timestamps, IP addresses
 *    - User actions, request context
 */
