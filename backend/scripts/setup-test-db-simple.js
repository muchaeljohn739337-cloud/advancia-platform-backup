#!/usr/bin/env node
/**
 * Simple Test Database Setup Script
 * Works with SQLite for local development, PostgreSQL for CI/CD
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Load test environment
require("dotenv").config({ path: ".env.test.local" });

const DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found");
  console.error("💡 Copy .env.test.local and set DATABASE_URL");
  process.exit(1);
}

console.log("🔧 Test Database Setup");
console.log(`📊 Database: ${DATABASE_URL}`);

async function setupTestDatabase() {
  try {
    // Clean up existing test database
    if (DATABASE_URL.includes("file:")) {
      const dbFile = DATABASE_URL.replace("file:", "");
      if (fs.existsSync(dbFile)) {
        fs.unlinkSync(dbFile);
        console.log("🗑️ Removed existing test database");
      }
    }

    // Generate Prisma client
    console.log("1️⃣ Generating Prisma client...");
    execSync("npx prisma generate", { stdio: "inherit" });

    // Run migrations
    console.log("2️⃣ Running database migrations...");
    execSync("npx prisma migrate dev --name init", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL },
    });

    // Verify database
    console.log("3️⃣ Verifying database...");
    execSync("npx prisma migrate status", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL },
    });

    console.log("✅ Test database setup complete!");
    console.log("💡 Run tests with: npm test");
  } catch (error) {
    console.error("❌ Database setup failed:", error.message);
    process.exit(1);
  }
}

setupTestDatabase();
