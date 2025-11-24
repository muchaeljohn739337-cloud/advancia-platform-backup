// Trustpilot Review Collector
// Automated job to collect and sync Trustpilot reviews

import axios from "axios";
import logger from "../logger";
import prisma from "../prismaClient";

interface TrustpilotReview {
  id: string;
  stars: number;
  title: string;
  text: string;
  createdAt: string;
  consumer: {
    displayName: string;
  };
  isVerified: boolean;
}

interface TrustpilotResponse {
  reviews: TrustpilotReview[];
  links: {
    total: number;
  };
}

export class TrustpilotCollector {
  private apiKey: string;
  private businessUnitId: string;
  private apiBaseUrl = "https://api.trustpilot.com/v1/business-units";

  constructor() {
    this.apiKey = process.env.TRUSTPILOT_API_KEY || "";
    this.businessUnitId = process.env.TRUSTPILOT_BUSINESS_UNIT_ID || "";

    if (!this.apiKey || !this.businessUnitId) {
      logger.warn("⚠️  Trustpilot API credentials not configured");
    }
  }

  /**
   * Fetch reviews from Trustpilot API
   */
  async fetchReviews(
    page = 1,
    perPage = 20,
  ): Promise<TrustpilotResponse | null> {
    if (!this.apiKey || !this.businessUnitId) {
      logger.error("❌ Trustpilot API credentials missing");
      return null;
    }

    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/${this.businessUnitId}/reviews`,
        {
          headers: {
            apikey: this.apiKey,
          },
          params: {
            page,
            perPage,
            stars: "5", // Only fetch 5-star reviews (best positive feedback)
            orderBy: "createdat.desc",
          },
        },
      );

      return response.data;
    } catch (error: any) {
      logger.error("❌ Failed to fetch Trustpilot reviews:", {
        error: error.message,
        status: error.response?.status,
      });
      return null;
    }
  }

  /**
   * Sync reviews to database
   */
  async syncReviews(): Promise<{ synced: number; errors: number }> {
    logger.info("🔄 Starting Trustpilot review sync...");

    if (!this.apiKey || !this.businessUnitId) {
      logger.warn("⚠️  Trustpilot sync skipped - credentials not configured");
      return { synced: 0, errors: 0 };
    }

    let synced = 0;
    let errors = 0;

    try {
      const data = await this.fetchReviews(1, 50); // Fetch latest 50 reviews

      if (!data || !data.reviews) {
        logger.warn("⚠️  No reviews fetched from Trustpilot");
        return { synced: 0, errors: 0 };
      }

      logger.info(`📊 Fetched ${data.reviews.length} reviews from Trustpilot`);

      for (const review of data.reviews) {
        try {
          // Check if review already exists
          const existing = await prisma.trustpilotReview.findUnique({
            where: { trustpilotId: review.id },
          });

          if (existing) {
            // Update existing review
            await prisma.trustpilotReview.update({
              where: { trustpilotId: review.id },
              data: {
                stars: review.stars,
                title: review.title,
                text: review.text,
                reviewerName: review.consumer.displayName,
                isVerified: review.isVerified,
                reviewDate: new Date(review.createdAt),
                updatedAt: new Date(),
              },
            });
          } else {
            // Create new review
            await prisma.trustpilotReview.create({
              data: {
                trustpilotId: review.id,
                stars: review.stars,
                title: review.title,
                text: review.text,
                reviewerName: review.consumer.displayName,
                isVerified: review.isVerified,
                reviewDate: new Date(review.createdAt),
                isPublished: review.stars === 5, // Auto-publish only 5-star reviews
              },
            });
          }

          synced++;
        } catch (error: any) {
          logger.error(`❌ Failed to sync review ${review.id}:`, error.message);
          errors++;
        }
      }

      logger.info(
        `✅ Trustpilot sync complete: ${synced} synced, ${errors} errors`,
      );

      // Log sync activity
      await this.logSyncActivity(synced, errors, data.links.total);
    } catch (error: any) {
      logger.error("❌ Trustpilot sync failed:", error.message);
      errors++;
    }

    return { synced, errors };
  }

  /**
   * Get review statistics
   */
  async getStats(): Promise<{
    total: number;
    published: number;
    averageRating: number;
    fiveStar: number;
    fourStar: number;
  }> {
    try {
      const reviews = await prisma.trustpilotReview.findMany({
        where: { isPublished: true },
        select: { stars: true },
      });

      const total = reviews.length;
      const fiveStar = reviews.filter((r) => r.stars === 5).length;
      const fourStar = reviews.filter((r) => r.stars === 4).length;
      const sumStars = reviews.reduce((sum, r) => sum + r.stars, 0);
      const averageRating = total > 0 ? sumStars / total : 0;

      return {
        total,
        published: total,
        averageRating: Math.round(averageRating * 10) / 10,
        fiveStar,
        fourStar,
      };
    } catch (error: any) {
      logger.error("❌ Failed to get Trustpilot stats:", error.message);
      return {
        total: 0,
        published: 0,
        averageRating: 0,
        fiveStar: 0,
        fourStar: 0,
      };
    }
  }

  /**
   * Log sync activity to audit trail
   */
  private async logSyncActivity(
    synced: number,
    errors: number,
    totalReviews: number,
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: "TRUSTPILOT_SYNC",
          entity: "TrustpilotReview",
          entityId: "system",
          userId: "system",
          details: JSON.stringify({
            synced,
            errors,
            totalReviews,
            timestamp: new Date().toISOString(),
          }),
          ipAddress: "system",
        },
      });
    } catch (error: any) {
      logger.error("❌ Failed to log Trustpilot sync activity:", error.message);
    }
  }

  /**
   * Manually trigger sync (for API endpoint)
   */
  async triggerManualSync(): Promise<{
    success: boolean;
    message: string;
    stats: any;
  }> {
    logger.info("🔄 Manual Trustpilot sync triggered");

    const result = await this.syncReviews();
    const stats = await this.getStats();

    return {
      success: result.errors === 0,
      message: `Synced ${result.synced} reviews with ${result.errors} errors`,
      stats,
    };
  }
}

// Export singleton instance
const trustpilotCollector = new TrustpilotCollector();
export default trustpilotCollector;
