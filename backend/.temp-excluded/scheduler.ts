// RPA Module - Main Scheduler
// Coordinates and schedules all RPA automation tasks

import type { ScheduledTask } from "node-cron";
import cron from "node-cron";
import trustpilotCollector from "../jobs/trustpilotCollector";
import { rpaConfig } from "./config";
import dataBackupSync from "./dataBackupSync";
import kycVerifier from "./kycVerifier";
import notificationAutomation from "./notificationAutomation";
import reportGenerator from "./reportGenerator";
import transactionProcessor from "./transactionProcessor";

export class RPAScheduler {
  private scheduledTasks: Map<string, ScheduledTask> = new Map();
  private isRunning = false;

  /**
   * Start all RPA automation tasks
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("⚠️  RPA Scheduler is already running");
      return;
    }

    console.log("🤖 Starting RPA Automation Scheduler...");
    this.isRunning = true;

    // Schedule Transaction Processing
    if (rpaConfig.transactionProcessing.enabled) {
      this.scheduleTask(
        "transactionProcessing",
        rpaConfig.transactionProcessing.scheduleInterval,
        async () => {
          console.log("🔄 Running scheduled transaction processing...");
          await transactionProcessor.batchProcess();
        },
      );
      console.log("✅ Transaction Processing scheduled");
    }

    // Schedule KYC Verification
    if (rpaConfig.kyc.enabled) {
      this.scheduleTask(
        "kycVerification",
        "0 */6 * * *", // Every 6 hours
        async () => {
          console.log("🔍 Running scheduled KYC verification...");
          await kycVerifier.batchProcessKYC();
        },
      );
      console.log("✅ KYC Verification scheduled");
    }

    // Schedule Report Generation
    if (rpaConfig.reportGeneration.enabled) {
      this.scheduleTask(
        "reportGeneration",
        rpaConfig.reportGeneration.scheduleInterval,
        async () => {
          console.log("📊 Running scheduled report generation...");
          await reportGenerator.generateAllReports();
        },
      );
      console.log("✅ Report Generation scheduled");
    }

    // Schedule Notification Queue Processing
    if (rpaConfig.notifications.enabled) {
      this.scheduleTask(
        "notificationQueue",
        "*/2 * * * *", // Every 2 minutes
        async () => {
          await notificationAutomation.processQueue();
        },
      );
      console.log("✅ Notification Queue Processing scheduled");
    }

    // Schedule Data Backup
    if (rpaConfig.dataBackup.enabled) {
      this.scheduleTask(
        "dataBackup",
        rpaConfig.dataBackup.scheduleInterval,
        async () => {
          console.log("💾 Running scheduled data backup...");
          await dataBackupSync.performBackupAndSync();
        },
      );
      console.log("✅ Data Backup scheduled");
    }

    // Schedule Trustpilot Review Collection
    this.scheduleTask(
      "trustpilotSync",
      "0 */6 * * *", // Every 6 hours
      async () => {
        console.log("⭐ Running scheduled Trustpilot review sync...");
        await trustpilotCollector.syncReviews();
      },
    );
    console.log("✅ Trustpilot Review Sync scheduled");

    // Schedule Trustpilot Invitation Automation
    this.scheduleTask(
      "trustpilotInvitations",
      "0 10 * * *", // Daily at 10 AM
      async () => {
        console.log("📧 Running scheduled Trustpilot invitation campaign...");
        await trustpilotInvitationService.sendAutomatedInvitations();
      },
    );
    console.log("✅ Trustpilot Invitations scheduled");

    // Schedule Scam Adviser Verification Check
    this.scheduleTask(
      "scamAdviserCheck",
      "0 9 * * 1", // Weekly on Monday at 9 AM
      async () => {
        console.log("🛡️ Running scheduled Scam Adviser check...");
        const report = await scamAdviserService.checkDomainReputation();
        if (report.trustScore < 70) {
          await scamAdviserService.requestManualVerification();
        }
      },
    );
    console.log("✅ Scam Adviser Check scheduled");

    // Schedule Trust Signal Improvements
    this.scheduleTask(
      "trustSignalImprovement",
      "0 2 * * *", // Daily at 2 AM
      async () => {
        console.log("🔧 Running scheduled trust signal improvements...");
        await scamAdviserService.improveAutomatedTrustSignals();
      },
    );
    console.log("✅ Trust Signal Improvement scheduled");

    console.log("✅ RPA Automation Scheduler started successfully");
    this.logScheduledTasks();
  }

  /**
   * Stop all scheduled tasks
   */
  stop(): void {
    console.log("🛑 Stopping RPA Automation Scheduler...");

    for (const [name, task] of this.scheduledTasks) {
      task.stop();
      console.log(`✓ Stopped: ${name}`);
    }

    this.scheduledTasks.clear();
    this.isRunning = false;

    console.log("✅ RPA Automation Scheduler stopped");
  }

  /**
   * Schedule a task with cron
   */
  private scheduleTask(
    name: string,
    schedule: string,
    handler: () => Promise<void>,
  ): void {
    try {
      const task = cron.schedule(schedule, async () => {
        try {
          await handler();
        } catch (error) {
          console.error(`❌ Error in scheduled task '${name}':`, error);
        }
      });

      this.scheduledTasks.set(name, task);
    } catch (error) {
      console.error(`❌ Failed to schedule task '${name}':`, error);
    }
  }

  /**
   * Run a specific task immediately (for testing/manual trigger)
   */
  async runTask(taskName: string): Promise<void> {
    console.log(`▶️  Manually running task: ${taskName}...`);

    try {
      switch (taskName) {
        case "transactionProcessing":
          await transactionProcessor.batchProcess();
          break;
        case "kycVerification":
          await kycVerifier.batchProcessKYC();
          break;
        case "reportGeneration":
          await reportGenerator.generateAllReports();
          break;
        case "notificationQueue":
          await notificationAutomation.processQueue();
          break;
        case "dataBackup":
          await dataBackupSync.performBackupAndSync();
          break;
        case "trustpilotSync":
          await trustpilotCollector.syncReviews();
          break;
        case "trustpilotInvitations":
          await trustpilotInvitationService.sendAutomatedInvitations();
          break;
        case "scamAdviserCheck":
          const report = await scamAdviserService.checkDomainReputation();
          if (report.trustScore < 70) {
            await scamAdviserService.requestManualVerification();
          }
          break;
        case "trustSignalImprovement":
          await scamAdviserService.improveAutomatedTrustSignals();
          break;
        default:
          throw new Error(`Unknown task: ${taskName}`);
      }

      console.log(`✅ Task '${taskName}' completed successfully`);
    } catch (error) {
      console.error(`❌ Task '${taskName}' failed:`, error);
      throw error;
    }
  }

  /**
   * Get status of all scheduled tasks
   */
  getStatus(): Record<string, any> {
    return {
      isRunning: this.isRunning,
      activeTasks: Array.from(this.scheduledTasks.keys()),
      config: {
        transactionProcessing: rpaConfig.transactionProcessing.enabled,
        kyc: rpaConfig.kyc.enabled,
        reportGeneration: rpaConfig.reportGeneration.enabled,
        notifications: rpaConfig.notifications.enabled,
        dataBackup: rpaConfig.dataBackup.enabled,
      },
    };
  }

  /**
   * Log all scheduled tasks
   */
  private logScheduledTasks(): void {
    console.log("\n📋 Scheduled RPA Tasks:");
    console.log("========================");

    for (const [name, _] of this.scheduledTasks) {
      let schedule = "";

      switch (name) {
        case "transactionProcessing":
          schedule = rpaConfig.transactionProcessing.scheduleInterval;
          break;
        case "kycVerification":
          schedule = "Every 6 hours";
          break;
        case "reportGeneration":
          schedule = rpaConfig.reportGeneration.scheduleInterval;
          break;
        case "notificationQueue":
          schedule = "Every 2 minutes";
          break;
        case "dataBackup":
          schedule = rpaConfig.dataBackup.scheduleInterval;
          break;
        case "trustpilotSync":
          schedule = "Every 6 hours";
          break;
        case "trustpilotInvitations":
          schedule = "Daily at 10 AM";
          break;
        case "scamAdviserCheck":
          schedule = "Weekly (Monday 9 AM)";
          break;
        case "trustSignalImprovement":
          schedule = "Daily at 2 AM";
          break;
      }

      console.log(`  ✓ ${name}: ${schedule}`);
    }

    console.log("========================\n");
  }

  /**
   * Health check for RPA system
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    details: Record<string, any>;
  }> {
    const details: Record<string, any> = {
      scheduler: {
        running: this.isRunning,
        activeTasks: this.scheduledTasks.size,
      },
      modules: {
        transactionProcessing: rpaConfig.transactionProcessing.enabled,
        kyc: rpaConfig.kyc.enabled,
        reportGeneration: rpaConfig.reportGeneration.enabled,
        notifications: rpaConfig.notifications.enabled,
        dataBackup: rpaConfig.dataBackup.enabled,
      },
    };

    const healthy = this.isRunning && this.scheduledTasks.size > 0;

    return { healthy, details };
  }
}

// Export singleton instance
const scheduler = new RPAScheduler();
export default scheduler;

// Auto-start if enabled
if (process.env.RPA_AUTO_START === "true") {
  scheduler.start().catch((error) => {
    console.error("❌ Failed to auto-start RPA Scheduler:", error);
  });
}
