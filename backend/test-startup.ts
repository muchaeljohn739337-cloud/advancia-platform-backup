import dotenv from "dotenv";
dotenv.config();

console.log("=== Startup Test ===");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("PORT:", process.env.PORT);

// Try loading app
try {
  console.log("\n=== Loading app ===");
  const app = require("./src/app");
  console.log("✅ App loaded successfully");
  console.log("App type:", typeof app.default);
} catch (error: any) {
  console.error("❌ Failed to load app:", error.message);
  console.error(error.stack);
  process.exit(1);
}
