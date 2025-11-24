#!/usr/bin/env node

/**
 * Log Monitoring Script
 * Monitors application logs for errors and security events
 */

const fs = require("fs");
const path = require("path");

const LOG_CONFIG = {
  logFile: process.env.LOG_FILE || "logs/app.log",
  errorPatterns: [
    /ERROR/i,
    /WARN/i,
    /SECURITY/i,
    /UNAUTHORIZED/i,
    /RATE_LIMIT/i,
    /SQL/i,
    /INJECTION/i,
  ],
  checkInterval: parseInt(process.env.LOG_CHECK_INTERVAL) || 10000, // 10 seconds
  maxLines: parseInt(process.env.LOG_MAX_LINES) || 1000,
};

let lastPosition = 0;
let errorCount = 0;

function monitorLogs() {
  const logPath = path.resolve(LOG_CONFIG.logFile);

  if (!fs.existsSync(logPath)) {
    console.log(`📝 Log file not found: ${logPath}`);
    return;
  }

  try {
    const stats = fs.statSync(logPath);
    const currentSize = stats.size;

    if (currentSize < lastPosition) {
      // Log file was rotated
      console.log("🔄 Log file rotated, resetting position");
      lastPosition = 0;
    }

    if (currentSize > lastPosition) {
      const stream = fs.createReadStream(logPath, {
        start: lastPosition,
        end: currentSize,
      });

      let newData = "";
      stream.on("data", (chunk) => {
        newData += chunk.toString();
      });

      stream.on("end", () => {
        const lines = newData.split("\n").filter((line) => line.trim());

        lines.forEach((line) => {
          LOG_CONFIG.errorPatterns.forEach((pattern) => {
            if (pattern.test(line)) {
              errorCount++;
              console.log(
                `🚨 Log Alert [${errorCount}]: ${line.substring(0, 200)}...`,
              );
            }
          });
        });

        lastPosition = currentSize;
      });

      stream.on("error", (error) => {
        console.error(`❌ Error reading log file: ${error.message}`);
      });
    }
  } catch (error) {
    console.error(`❌ Error monitoring logs: ${error.message}`);
  }
}

function startLogMonitoring() {
  console.log("📋 Starting log monitoring...");
  console.log(`   Log File: ${LOG_CONFIG.logFile}`);
  console.log(`   Check Interval: ${LOG_CONFIG.checkInterval}ms`);
  console.log(`   Error Patterns: ${LOG_CONFIG.errorPatterns.length}`);
  console.log("");

  // Initial check
  monitorLogs();

  // Set up interval
  setInterval(monitorLogs, LOG_CONFIG.checkInterval);
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Stopping log monitoring...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Stopping log monitoring...");
  process.exit(0);
});

// Start monitoring if run directly
if (require.main === module) {
  startLogMonitoring();
}

module.exports = { monitorLogs };
