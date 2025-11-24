#!/usr/bin/env node

/**
 * Monitoring Dashboard
 * Displays real-time application metrics
 */

const os = require("os");
const { checkHealth } = require("./health-check");

const DASHBOARD_CONFIG = {
  updateInterval: parseInt(process.env.DASHBOARD_UPDATE_INTERVAL) || 5000, // 5 seconds
  showSystemInfo: process.env.SHOW_SYSTEM_INFO !== "false",
};

async function displayDashboard() {
  console.clear();
  console.log("📊 Advancia Pay Ledger - Monitoring Dashboard");
  console.log("==============================================");
  console.log(`Time: ${new Date().toISOString()}`);
  console.log("");

  // System Information
  if (DASHBOARD_CONFIG.showSystemInfo) {
    console.log("🖥️  System Information:");
    console.log(`   CPU: ${os.cpus().length} cores`);
    console.log(
      `   Memory: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB total`,
    );
    console.log(`   Uptime: ${Math.round(os.uptime() / 3600)} hours`);
    console.log("");
  }

  // Application Health
  try {
    const health = await checkHealth();
    console.log("🏥 Application Health:");
    console.log(`   Status: ✅ ${health.status}`);
    console.log(
      `   Uptime: ${Math.round(health.uptime / 3600)}h ${Math.round((health.uptime % 3600) / 60)}m`,
    );
    console.log(
      `   Memory Usage: ${Math.round(health.memory / 1024 / 1024)}MB`,
    );
    console.log(
      `   Database: ${health.database ? "✅ Connected" : "❌ Disconnected"}`,
    );
    console.log(
      `   Redis: ${health.redis ? "✅ Connected" : "❌ Disconnected"}`,
    );
  } catch (error) {
    console.log("🏥 Application Health:");
    console.log(`   Status: ❌ Unhealthy`);
    console.log(`   Error: ${error.message}`);
  }

  console.log("");
  console.log(
    "🔄 Refreshing every",
    DASHBOARD_CONFIG.updateInterval / 1000,
    "seconds...",
  );
  console.log("Press Ctrl+C to exit");
}

function startDashboard() {
  console.log("📊 Starting monitoring dashboard...");

  // Initial display
  displayDashboard();

  // Set up interval
  setInterval(displayDashboard, DASHBOARD_CONFIG.updateInterval);
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.clear();
  console.log("👋 Monitoring dashboard stopped");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.clear();
  console.log("👋 Monitoring dashboard stopped");
  process.exit(0);
});

// Start dashboard if run directly
if (require.main === module) {
  startDashboard();
}

module.exports = { displayDashboard };
