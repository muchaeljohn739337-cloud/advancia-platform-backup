#!/usr/bin/env node
/**
 * Test Database Setup for Existing PostgreSQL
 * Works with locally installed PostgreSQL
 */

const { execSync } = require("child_process");

// Load test environment
require("dotenv").config({ path: ".env.test" });

console.log("🔧 Test Database Setup");
console.log("📊 Using existing PostgreSQL on localhost:5432");

async function setupTestDatabase() {
  try {
    // Test PostgreSQL connection
    console.log("1️⃣ Testing PostgreSQL connection...");
    try {
      const testCmd =
        process.platform === "win32"
          ? 'psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT version();"'
          : 'PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT version();"';

      execSync(testCmd, { stdio: "pipe" });
      console.log("✓ PostgreSQL connection successful");
    } catch (error) {
      console.log("⚠️ PostgreSQL connection failed, trying to connect...");
      console.log("💡 Make sure PostgreSQL is running and accessible");
    }

    // Generate Prisma client
    console.log("2️⃣ Generating Prisma client...");
    execSync("npx prisma generate", { stdio: "inherit" });

    // Create test database if not exists
    console.log("3️⃣ Setting up test database...");
    const dbUrl =
      "postgresql://postgres:postgres@localhost:5432/advancia_payledger_test";

    // Run migrations
    console.log("4️⃣ Running database migrations...");
    execSync("npx prisma migrate deploy", {
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL: dbUrl,
        TEST_DATABASE_URL: dbUrl,
      },
    });

    // Verify database
    console.log("5️⃣ Verifying database...");
    execSync("npx prisma migrate status", {
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL: dbUrl,
        TEST_DATABASE_URL: dbUrl,
      },
    });

    console.log("✅ Test database setup complete!");
    console.log("💡 Run tests with: npm test");
    console.log("💡 View database: npm run prisma:studio:test");
  } catch (error) {
    console.error("❌ Database setup failed:", error.message);
    console.error("💡 Try installing PostgreSQL or use Docker");
    console.error("💡 Or run in CI environment with PostgreSQL service");
    process.exit(1);
  }
}

setupTestDatabase();
