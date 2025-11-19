// Minimal backend startup test
require("dotenv").config();

console.log("🚀 Starting minimal backend test...");
console.log("📍 Node version:", process.version);
console.log("📍 Working directory:", process.cwd());

try {
  console.log("\n1️⃣ Testing config import...");
  const config = require("./dist/jobs/config/index");
  console.log("✅ Config loaded");
  console.log("   - Port:", config.default.port);
  console.log("   - Node env:", config.default.nodeEnv);

  console.log("\n2️⃣ Testing Prisma client import...");
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  console.log("✅ Prisma client created");

  console.log("\n3️⃣ Testing Express import...");
  const express = require("express");
  const app = express();
  console.log("✅ Express imported");

  console.log("\n4️⃣ Creating test server...");
  const http = require("http");
  const server = http.createServer(app);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const PORT = config.default.port || 4000;
  server.listen(PORT, () => {
    console.log(`\n✅ Test server running on port ${PORT}`);
    console.log(`   Visit: http://localhost:${PORT}/api/health`);
    console.log("\n✅ All startup checks passed!");
    console.log("   Main backend should be able to start.");

    // Keep server running
    console.log("\nPress Ctrl+C to stop...");
  });
} catch (error) {
  console.error("\n❌ Startup failed:", error.message);
  console.error("Full error:", error);
  process.exit(1);
}
