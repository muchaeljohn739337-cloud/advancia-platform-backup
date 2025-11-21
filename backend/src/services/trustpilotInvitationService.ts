import axios from "axios";
import { config } from "../jobs/config";
import logger from "../logger";
import prisma from "../prismaClient";

interface InvitationSettings {
  autoSendEnabled: boolean;
  delayDays: number;
  minTransactionAmount: number;
  excludeCountries: string[];
  templateId: string;
}

interface InvitationResult {
  sent: number;
  errors: number;
  skipped: number;
}

class TrustpilotInvitationService {
  private apiKey: string;
  private businessUnitId: string;
  private invitationSettings: InvitationSettings;

  constructor() {
    this.apiKey = process.env.TRUSTPILOT_API_KEY || "";
    this.businessUnitId = process.env.TRUSTPILOT_BUSINESS_UNIT_ID || "";

    this.invitationSettings = {
      autoSendEnabled: true,
      delayDays: 7, // Wait 7 days after transaction
      minTransactionAmount: 10, // Only invite for transactions $10+
      excludeCountries: [], // No country restrictions
      templateId: process.env.TRUSTPILOT_TEMPLATE_ID || "default",
    };
  }

  /**
   * Automatically send review invitations to eligible customers
   */
  async sendAutomatedInvitations(): Promise<InvitationResult> {
    try {
      logger.info("🎯 Starting automated Trustpilot invitation campaign");

      if (!this.apiKey || !this.businessUnitId) {
        logger.warn(
          "⚠️ Trustpilot credentials not configured, skipping invitations"
        );
        return { sent: 0, errors: 0, skipped: 0 };
      }

      const eligibleTransactions = await this.getEligibleTransactions();
      let sent = 0;
      let errors = 0;
      let skipped = 0;

      logger.info(
        `📋 Found ${eligibleTransactions.length} eligible transactions`
      );

      for (const transaction of eligibleTransactions) {
        try {
          // Check if user wants to receive invitations
          const user = await prisma.user.findUnique({
            where: { id: transaction.userId },
          });

          if (!user || !user.email) {
            logger.warn(
              `⚠️ User not found or no email for transaction ${transaction.id}`
            );
            skipped++;
            continue;
          }

          await this.sendInvitation(transaction, user);
          sent++;

          // Mark as invited
          await prisma.transactions.update({
            where: { id: transaction.id },
            data: {
              metadata: {
                ...(transaction.metadata as any),
                trustpilotInvitationSent: true,
                trustpilotInvitationDate: new Date().toISOString(),
              },
            },
          });

          // Rate limiting: wait 1 second between invitations
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          logger.error(
            `❌ Error sending invitation for transaction ${transaction.id}:`,
            error
          );
          errors++;
        }
      }

      logger.info(
        `✅ Invitation campaign completed: ${sent} sent, ${errors} errors, ${skipped} skipped`
      );

      // Log to audit trail
      await prisma.audit_logs.create({
        data: {
          action: "TRUSTPILOT_INVITATIONS_SENT",
          performedBy: "system",
          details: JSON.stringify({
            sent,
            errors,
            skipped,
            date: new Date().toISOString(),
          }),
        },
      });

      return { sent, errors, skipped };
    } catch (error) {
      logger.error("❌ Error in automated invitation campaign:", error);
      throw error;
    }
  }

  /**
   * Send individual invitation
   */
  private async sendInvitation(transaction: any, user: any): Promise<void> {
    const invitationData = {
      consumerEmail: user.email,
      consumerName: user.fullName || user.email.split("@")[0],
      referenceId: transaction.id,
      locale: "en-US",
      senderEmail:
        process.env.BUSINESS_EMAIL || "support@advanciapayledger.com",
      senderName: "Advancia Pay Ledger",
      replyTo: process.env.BUSINESS_EMAIL || "support@advanciapayledger.com",
      templateId: this.invitationSettings.templateId,
      redirectUri: `https://advanciapayledger.com/review-submitted`,
      tags: ["automated", "post-transaction"],
    };

    // In production, use actual Trustpilot API
    if (config.nodeEnv === "production" && this.apiKey) {
      await axios.post(
        `https://invitations-api.trustpilot.com/v1/private/business-units/${this.businessUnitId}/email-invitations`,
        invitationData,
        {
          headers: {
            Authorization: `ApiKey ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );
    }

    logger.info(
      `📧 Trustpilot invitation sent to ${user.email} for transaction ${transaction.id}`
    );
  }

  /**
   * Get eligible transactions for review invitations
   */
  private async getEligibleTransactions(): Promise<any[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(
      cutoffDate.getDate() - this.invitationSettings.delayDays
    );

    return prisma.transactions.findMany({
      where: {
        type: "deposit",
        status: "completed",
        amount: {
          gte: this.invitationSettings.minTransactionAmount,
        },
        createdAt: {
          lte: cutoffDate,
        },
        // Only transactions that haven't been invited
        OR: [
          {
            metadata: {
              equals: null,
            },
          },
          {
            metadata: {
              path: ["trustpilotInvitationSent"],
              not: true,
            },
          },
        ],
      },
      take: 50, // Batch size
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  /**
   * Update invitation settings
   */
  async updateSettings(settings: Partial<InvitationSettings>): Promise<void> {
    this.invitationSettings = {
      ...this.invitationSettings,
      ...settings,
    };

    await prisma.audit_logs.create({
      data: {
        action: "TRUSTPILOT_SETTINGS_UPDATED",
        performedBy: "admin",
        details: JSON.stringify(this.invitationSettings),
      },
    });

    logger.info("✅ Trustpilot invitation settings updated");
  }
}

export default new TrustpilotInvitationService();
