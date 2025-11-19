// Backend startup with full error handling
require("dotenv").config();

console.log("🚀 Starting backend with error handling...\n");

// Catch all uncaught errors
process.on("uncaughtException", (error) => {
  console.error("❌ UNCAUGHT EXCEPTION:", error);
  console.error("Stack:", error.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ UNHANDLED REJECTION at:", promise);
  console.error("Reason:", reason);
  process.exit(1);
});

try {
  console.log("1️⃣ Loading ts-node register...");
  require("ts-node/register");
  console.log("✅ ts-node registered\n");

  console.log("2️⃣ Loading main index file...");
  require("./src/index.ts");
  console.log("✅ Backend startup initiated\n");
} catch (error) {
  console.error("❌ STARTUP FAILED:", error.message);
  console.error("Stack:", error.stack);
  process.exit(1);
}
