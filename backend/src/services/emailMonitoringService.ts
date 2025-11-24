import { PrismaClient } from '@prisma/client';
import { winstonLogger as logger } from '../utils/winstonLogger';

const prisma = new PrismaClient();

export interface EmailEvent {
  id?: string;
  emailId: string;
  type: EmailEventType;
  recipient: string;
  subject?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export enum EmailEventType {
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  CLICKED = 'clicked',
  BOUNCED = 'bounced',
  COMPLAINED = 'complained',
  UNSUBSCRIBED = 'unsubscribed',
  FAILED = 'failed',
}

export interface EmailMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  failed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  complaintRate: number;
}

export interface SuspiciousActivity {
  type: string;
  email?: string;
  userId?: string;
  ipAddress?: string;
  reason: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Email Security and Monitoring Service
 * Tracks email events, bounces, complaints, and suspicious activity
 */
export class EmailMonitoringService {
  // In-memory storage (use database in production)
  private static events: EmailEvent[] = [];
  private static suspiciousActivities: SuspiciousActivity[] = [];
  private static bounceList: Set<string> = new Set();
  private static complaintList: Set<string> = new Set();
  private static unsubscribeList: Set<string> = new Set();

  /**
   * Track email event
   */
  static async trackEvent(event: Omit<EmailEvent, 'timestamp'>): Promise<void> {
    try {
      const eventWithTimestamp: EmailEvent = {
        ...event,
        timestamp: new Date(),
      };

      this.events.push(eventWithTimestamp);

      // Add to bounce/complaint lists
      if (event.type === EmailEventType.BOUNCED) {
        this.bounceList.add(event.recipient);
        logger.warn(`Email bounced: ${event.recipient}`);
      }

      if (event.type === EmailEventType.COMPLAINED) {
        this.complaintList.add(event.recipient);
        logger.warn(`Spam complaint received: ${event.recipient}`);

        // Log as suspicious activity
        await this.logSuspiciousActivity({
          type: 'SPAM_COMPLAINT',
          email: event.recipient,
          reason: 'User marked email as spam',
          timestamp: new Date(),
          metadata: { emailId: event.emailId },
        });
      }

      if (event.type === EmailEventType.UNSUBSCRIBED) {
        this.unsubscribeList.add(event.recipient);
        logger.info(`User unsubscribed: ${event.recipient}`);
      }

      // TODO: Save to database when schema is ready
      // await prisma.emailEvent.create({
      //   data: eventWithTimestamp,
      // });

      logger.info(`Email event tracked: ${event.type} - ${event.recipient}`);
    } catch (error) {
      logger.error('Failed to track email event:', error);
    }
  }

  /**
   * Check if email address is on bounce list
   */
  static isBounced(email: string): boolean {
    return this.bounceList.has(email.toLowerCase());
  }

  /**
   * Check if email address has complained
   */
  static hasComplained(email: string): boolean {
    return this.complaintList.has(email.toLowerCase());
  }

  /**
   * Check if email address is unsubscribed
   */
  static isUnsubscribed(email: string): boolean {
    return this.unsubscribeList.has(email.toLowerCase());
  }

  /**
   * Check if email is safe to send to
   */
  static isSafeToSend(email: string): {
    safe: boolean;
    reason?: string;
  } {
    const emailLower = email.toLowerCase();

    if (this.isBounced(emailLower)) {
      return {
        safe: false,
        reason: 'Email address has hard bounced',
      };
    }

    if (this.hasComplained(emailLower)) {
      return {
        safe: false,
        reason: 'User has marked emails as spam',
      };
    }

    if (this.isUnsubscribed(emailLower)) {
      return {
        safe: false,
        reason: 'User has unsubscribed',
      };
    }

    return { safe: true };
  }

  /**
   * Get email metrics for a time period
   */
  static getMetrics(startDate?: Date, endDate?: Date): EmailMetrics {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const end = endDate || new Date();

    const filteredEvents = this.events.filter(
      (event) => event.timestamp >= start && event.timestamp <= end,
    );

    const sent = filteredEvents.filter(
      (e) => e.type === EmailEventType.SENT,
    ).length;
    const delivered = filteredEvents.filter(
      (e) => e.type === EmailEventType.DELIVERED,
    ).length;
    const opened = filteredEvents.filter(
      (e) => e.type === EmailEventType.OPENED,
    ).length;
    const clicked = filteredEvents.filter(
      (e) => e.type === EmailEventType.CLICKED,
    ).length;
    const bounced = filteredEvents.filter(
      (e) => e.type === EmailEventType.BOUNCED,
    ).length;
    const complained = filteredEvents.filter(
      (e) => e.type === EmailEventType.COMPLAINED,
    ).length;
    const failed = filteredEvents.filter(
      (e) => e.type === EmailEventType.FAILED,
    ).length;

    return {
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      complained,
      failed,
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
      bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
      complaintRate: delivered > 0 ? (complained / delivered) * 100 : 0,
    };
  }

  /**
   * Log suspicious activity
   */
  static async logSuspiciousActivity(
    activity: SuspiciousActivity,
  ): Promise<void> {
    try {
      this.suspiciousActivities.push(activity);

      logger.warn('Suspicious email activity detected', {
        type: activity.type,
        email: activity.email,
        userId: activity.userId,
        reason: activity.reason,
        timestamp: activity.timestamp,
      });

      // TODO: Save to database and send alert
      // await prisma.emailSecurityLog.create({
      //   data: activity,
      // });

      // Send alert to admin if critical
      if (this.isCriticalActivity(activity)) {
        await this.sendAdminAlert(activity);
      }
    } catch (error) {
      logger.error('Failed to log suspicious activity:', error);
    }
  }

  /**
   * Check if activity is critical and requires immediate attention
   */
  private static isCriticalActivity(activity: SuspiciousActivity): boolean {
    const criticalTypes = [
      'SPAM_COMPLAINT',
      'MULTIPLE_BOUNCES',
      'RATE_LIMIT_EXCEEDED',
      'DISPOSABLE_EMAIL_ATTEMPT',
    ];

    return criticalTypes.includes(activity.type);
  }

  /**
   * Send alert to admin about critical activity
   */
  private static async sendAdminAlert(
    activity: SuspiciousActivity,
  ): Promise<void> {
    try {
      // TODO: Implement admin notification
      logger.error('CRITICAL EMAIL SECURITY ALERT', activity);
    } catch (error) {
      logger.error('Failed to send admin alert:', error);
    }
  }

  /**
   * Get recent suspicious activities
   */
  static getRecentSuspiciousActivities(
    limit: number = 50,
  ): SuspiciousActivity[] {
    return this.suspiciousActivities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Detect suspicious patterns
   */
  static async detectSuspiciousPatterns(): Promise<{
    detected: boolean;
    patterns: string[];
  }> {
    const patterns: string[] = [];
    const metrics = this.getMetrics();

    // High bounce rate (>5%)
    if (metrics.bounceRate > 5) {
      patterns.push(`High bounce rate: ${metrics.bounceRate.toFixed(2)}%`);
    }

    // High complaint rate (>0.1%)
    if (metrics.complaintRate > 0.1) {
      patterns.push(
        `High complaint rate: ${metrics.complaintRate.toFixed(2)}%`,
      );
    }

    // Low delivery rate (<95%)
    if (metrics.deliveryRate < 95 && metrics.sent > 100) {
      patterns.push(`Low delivery rate: ${metrics.deliveryRate.toFixed(2)}%`);
    }

    // Unusual send volume
    const recentEvents = this.events.filter(
      (e) =>
        e.type === EmailEventType.SENT &&
        e.timestamp > new Date(Date.now() - 60 * 60 * 1000),
    );

    if (recentEvents.length > 1000) {
      patterns.push(
        `Unusual send volume: ${recentEvents.length} emails in last hour`,
      );
    }

    return {
      detected: patterns.length > 0,
      patterns,
    };
  }

  /**
   * Get email health report
   */
  static async getHealthReport(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    metrics: EmailMetrics;
    issues: string[];
    recommendations: string[];
  }> {
    const metrics = this.getMetrics();
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check bounce rate
    if (metrics.bounceRate > 10) {
      status = 'critical';
      issues.push(
        `Critical: Bounce rate is ${metrics.bounceRate.toFixed(2)}% (should be <2%)`,
      );
      recommendations.push(
        'Clean your email list and verify addresses before sending',
      );
    } else if (metrics.bounceRate > 5) {
      status = 'warning';
      issues.push(
        `Warning: Bounce rate is ${metrics.bounceRate.toFixed(2)}% (should be <2%)`,
      );
      recommendations.push('Review and remove invalid email addresses');
    }

    // Check complaint rate
    if (metrics.complaintRate > 0.1) {
      status = 'critical';
      issues.push(
        `Critical: Complaint rate is ${metrics.complaintRate.toFixed(3)}% (should be <0.1%)`,
      );
      recommendations.push('Review email content and ensure users opted in');
    }

    // Check delivery rate
    if (metrics.deliveryRate < 90 && metrics.sent > 50) {
      if (status !== 'critical') status = 'warning';
      issues.push(
        `Warning: Delivery rate is ${metrics.deliveryRate.toFixed(2)}% (should be >95%)`,
      );
      recommendations.push('Check SPF, DKIM, and DMARC records');
    }

    // Check open rate (if low, might indicate spam folder)
    if (metrics.openRate < 10 && metrics.delivered > 100) {
      if (status === 'healthy') status = 'warning';
      issues.push(
        `Low open rate: ${metrics.openRate.toFixed(2)}% (typical is 15-25%)`,
      );
      recommendations.push('Improve email subject lines and content quality');
    }

    if (issues.length === 0) {
      recommendations.push('Email health is good! Keep monitoring metrics.');
    }

    return {
      status,
      metrics,
      issues,
      recommendations,
    };
  }

  /**
   * Remove email from bounce/complaint lists (manual intervention)
   */
  static removeFromBlocklist(
    email: string,
    listType: 'bounce' | 'complaint' | 'unsubscribe',
  ): void {
    const emailLower = email.toLowerCase();

    switch (listType) {
      case 'bounce':
        this.bounceList.delete(emailLower);
        logger.info(`Removed ${email} from bounce list`);
        break;
      case 'complaint':
        this.complaintList.delete(emailLower);
        logger.info(`Removed ${email} from complaint list`);
        break;
      case 'unsubscribe':
        this.unsubscribeList.delete(emailLower);
        logger.info(`Removed ${email} from unsubscribe list`);
        break;
    }
  }

  /**
   * Get blocklist statistics
   */
  static getBlocklistStats(): {
    bounced: number;
    complained: number;
    unsubscribed: number;
    total: number;
  } {
    return {
      bounced: this.bounceList.size,
      complained: this.complaintList.size,
      unsubscribed: this.unsubscribeList.size,
      total:
        this.bounceList.size +
        this.complaintList.size +
        this.unsubscribeList.size,
    };
  }

  /**
   * Export blocklists for backup
   */
  static exportBlocklists(): {
    bounced: string[];
    complained: string[];
    unsubscribed: string[];
  } {
    return {
      bounced: Array.from(this.bounceList),
      complained: Array.from(this.complaintList),
      unsubscribed: Array.from(this.unsubscribeList),
    };
  }

  /**
   * Clear all monitoring data (for testing)
   */
  static clearAll(): void {
    this.events = [];
    this.suspiciousActivities = [];
    this.bounceList.clear();
    this.complaintList.clear();
    this.unsubscribeList.clear();
    logger.info('All email monitoring data cleared');
  }
}

export default EmailMonitoringService;
