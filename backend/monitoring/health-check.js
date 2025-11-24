#!/usr/bin/env node

/**
 * Health Check Script
 * Monitors application health and sends alerts
 */

const http = require("http");
const https = require("https");

const HEALTH_CHECK_CONFIG = {
  url: process.env.HEALTH_CHECK_URL || "http://localhost:5000/health",
  interval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000, // 30 seconds
  timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000, // 5 seconds
  maxFailures: parseInt(process.env.HEALTH_CHECK_MAX_FAILURES) || 3,
  alertEmail: process.env.ALERT_EMAIL || "admin@yourdomain.com",
};

let failureCount = 0;
let lastSuccess = new Date();

function checkHealth() {
  return new Promise((resolve, reject) => {
    const url = new URL(HEALTH_CHECK_CONFIG.url);
    const client = url.protocol === "https:" ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: "GET",
      timeout: HEALTH_CHECK_CONFIG.timeout,
    };

    const req = client.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const health = JSON.parse(data);
            if (health.status === "healthy") {
              resolve(health);
            } else {
              reject(
                new Error(`Health check failed: ${JSON.stringify(health)}`),
              );
            }
          } catch (error) {
            reject(new Error(`Invalid health response: ${error.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Health check timeout"));
    });

    req.end();
  });
}

async function performHealthCheck() {
  try {
    const health = await checkHealth();

    if (failureCount > 0) {
      console.log(`✅ Health check recovered after ${failureCount} failures`);
      failureCount = 0;
    }

    lastSuccess = new Date();
    console.log(`✅ Health check passed at ${lastSuccess.toISOString()}`);
    console.log(`   Status: ${health.status}`);
    console.log(`   Uptime: ${health.uptime}s`);
    console.log(`   Memory: ${Math.round(health.memory / 1024 / 1024)}MB`);
  } catch (error) {
    failureCount++;
    console.error(
      `❌ Health check failed (${failureCount}/${HEALTH_CHECK_CONFIG.maxFailures}): ${error.message}`,
    );

    if (failureCount >= HEALTH_CHECK_CONFIG.maxFailures) {
      console.error("🚨 Maximum failures reached! Sending alert...");
      sendAlert(error.message);
      failureCount = 0; // Reset to avoid spam
    }
  }
}

function sendAlert(message) {
  // In production, integrate with email service, Slack, PagerDuty, etc.
  console.error(`🚨 ALERT: ${message}`);
  console.error(`   Time: ${new Date().toISOString()}`);
  console.error(`   Last Success: ${lastSuccess.toISOString()}`);
  console.error(`   Alert Email: ${HEALTH_CHECK_CONFIG.alertEmail}`);

  // TODO: Implement actual alerting (email, Slack, etc.)
}

function startMonitoring() {
  console.log("🏥 Starting health monitoring...");
  console.log(`   URL: ${HEALTH_CHECK_CONFIG.url}`);
  console.log(`   Interval: ${HEALTH_CHECK_CONFIG.interval}ms`);
  console.log(`   Timeout: ${HEALTH_CHECK_CONFIG.timeout}ms`);
  console.log(`   Max Failures: ${HEALTH_CHECK_CONFIG.maxFailures}`);
  console.log("");

  // Initial check
  performHealthCheck();

  // Set up interval
  setInterval(performHealthCheck, HEALTH_CHECK_CONFIG.interval);
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Stopping health monitoring...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Stopping health monitoring...");
  process.exit(0);
});

// Start monitoring if run directly
if (require.main === module) {
  startMonitoring();
}

module.exports = { checkHealth, performHealthCheck };
