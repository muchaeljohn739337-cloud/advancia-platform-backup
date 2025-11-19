#!/usr/bin/env node
/**
 * Test Database Runner - Enhanced setup and testing utility
 *
 * Features:
 * - Interactive menu for database operations
 * - Test data seeding with realistic datasets
 * - Performance benchmarking
 * - Health checks and diagnostics
 * - Integration testing support
 *
 * Usage:
 *   node scripts/test-db-runner.js
 *   npm run test:db:setup
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Configuration
const CONFIG = {
  CONTAINER_NAME: "postgres-test",
  POSTGRES_PORT: process.env.POSTGRES_PORT || 5433,
  POSTGRES_USER: "postgres",
  POSTGRES_PASSWORD: "postgres",
  POSTGRES_DB: "advancia_payledger_test",
  get DATABASE_URL() {
    return `postgresql://${this.POSTGRES_USER}:${this.POSTGRES_PASSWORD}@localhost:${this.POSTGRES_PORT}/${this.POSTGRES_DB}`;
  },
};

// Utilities
const execCommand = (command, options = {}) => {
  const { silent = false, allowFailure = false, timeout = 30000 } = options;

  try {
    const result = execSync(command, {
      stdio: silent ? "pipe" : "inherit",
      timeout,
      encoding: "utf8",
      ...options,
    });
    return result;
  } catch (error) {
    if (!allowFailure) {
      throw new Error(`Command failed: ${command}\n${error.message}`);
    }
    return null;
  }
};

const createInterface = () => {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
};

const promptUser = (question) => {
  const rl = createInterface();
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

// Database operations
const DatabaseOps = {
  async setup() {
    console.log("🚀 Setting up test database...");
    execCommand("node scripts/setup-test-db-docker.js");
  },

  async reset() {
    console.log("🔄 Resetting database...");
    try {
      execCommand(
        `docker exec ${CONFIG.CONTAINER_NAME} psql -U postgres -c "DROP DATABASE IF EXISTS ${CONFIG.POSTGRES_DB}"`
      );
      execCommand(
        `docker exec ${CONFIG.CONTAINER_NAME} psql -U postgres -c "CREATE DATABASE ${CONFIG.POSTGRES_DB}"`
      );

      // Re-run migrations
      execCommand("npx prisma migrate deploy", {
        env: { ...process.env, DATABASE_URL: CONFIG.DATABASE_URL },
      });

      console.log("✅ Database reset complete");
    } catch (error) {
      console.error("❌ Reset failed:", error.message);
    }
  },

  async seed() {
    console.log("🌱 Seeding test data...");

    // Create sample seed data
    const seedScript = `
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create test users
  const hashedPassword = await bcrypt.hash('Test123!', 10);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      passwordHash: hashedPassword,
      emailVerified: true,
      role: 'USER'
    }
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'adminuser',
      firstName: 'Admin',
      lastName: 'User',
      passwordHash: hashedPassword,
      emailVerified: true,
      role: 'ADMIN'
    }
  });

  // Create test transactions
  await prisma.transaction.createMany({
    data: [
      {
        userId: testUser.id,
        amount: 100.00,
        type: 'DEPOSIT',
        status: 'COMPLETED',
        description: 'Test deposit'
      },
      {
        userId: testUser.id,
        amount: -50.00,
        type: 'WITHDRAWAL',
        status: 'COMPLETED',
        description: 'Test withdrawal'
      }
    ],
    skipDuplicates: true
  });

  console.log('✅ Test data seeded successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

    fs.writeFileSync(path.join(process.cwd(), "temp-seed.js"), seedScript);

    try {
      execCommand("node temp-seed.js", {
        env: { ...process.env, DATABASE_URL: CONFIG.DATABASE_URL },
      });
      console.log("✅ Seeding complete");
    } finally {
      // Cleanup
      if (fs.existsSync("temp-seed.js")) {
        fs.unlinkSync("temp-seed.js");
      }
    }
  },

  async healthCheck() {
    console.log("🏥 Running health checks...");

    try {
      // Check Docker container
      const containerStatus = execCommand(
        `docker inspect ${CONFIG.CONTAINER_NAME} --format='{{.State.Status}}'`,
        { silent: true }
      );
      console.log(`📦 Container Status: ${containerStatus.trim()}`);

      // Check database connection
      execCommand("npx prisma db pull", {
        silent: true,
        env: { ...process.env, DATABASE_URL: CONFIG.DATABASE_URL },
      });
      console.log("✅ Database Connection: OK");

      // Check table counts
      const result = execCommand(
        `docker exec ${CONFIG.CONTAINER_NAME} psql -U postgres -d ${CONFIG.POSTGRES_DB} -t -c "SELECT schemaname,tablename FROM pg_tables WHERE schemaname='public';"`,
        { silent: true }
      );
      const tables = result
        .trim()
        .split("\n")
        .filter((line) => line.trim());
      console.log(`📊 Tables Found: ${tables.length}`);

      // Check migrations
      execCommand("npx prisma migrate status", {
        env: { ...process.env, DATABASE_URL: CONFIG.DATABASE_URL },
      });

      console.log("✅ All health checks passed");
    } catch (error) {
      console.error("❌ Health check failed:", error.message);
    }
  },

  async benchmark() {
    console.log("⚡ Running performance benchmarks...");

    const benchmarkScript = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function benchmark() {
  const startTime = Date.now();
  
  // Test connection
  const connectionStart = Date.now();
  await prisma.$queryRaw\`SELECT 1\`;
  const connectionTime = Date.now() - connectionStart;
  
  // Test read performance
  const readStart = Date.now();
  await prisma.user.findMany({ take: 100 });
  const readTime = Date.now() - readStart;
  
  // Test write performance
  const writeStart = Date.now();
  await prisma.auditLog.create({
    data: {
      action: 'BENCHMARK_TEST',
      resourceType: 'SYSTEM',
      resourceId: 'benchmark-test',
      details: JSON.stringify({ 
        timestamp: new Date(),
        testType: 'performance',
        operation: 'write_benchmark'
      }),
      userId: null,
      metadata: JSON.stringify({ benchmarkRun: true })
    }
  });
  const writeTime = Date.now() - writeStart;
  
  const totalTime = Date.now() - startTime;
  
  console.log('📊 Performance Results:');
  console.log(\`   • Connection: \${connectionTime}ms\`);
  console.log(\`   • Read (100 users): \${readTime}ms\`);
  console.log(\`   • Write (audit log): \${writeTime}ms\`);
  console.log(\`   • Total: \${totalTime}ms\`);
  
  await prisma.$disconnect();
}

benchmark().catch(console.error);
`;

    fs.writeFileSync(
      path.join(process.cwd(), "temp-benchmark.js"),
      benchmarkScript
    );

    try {
      execCommand("node temp-benchmark.js", {
        env: { ...process.env, DATABASE_URL: CONFIG.DATABASE_URL },
      });
    } finally {
      if (fs.existsSync("temp-benchmark.js")) {
        fs.unlinkSync("temp-benchmark.js");
      }
    }
  },

  async cleanup() {
    console.log("🧹 Cleaning up test database...");
    try {
      execCommand(`docker stop ${CONFIG.CONTAINER_NAME}`, {
        allowFailure: true,
        silent: true,
      });
      execCommand(`docker rm ${CONFIG.CONTAINER_NAME}`, {
        allowFailure: true,
        silent: true,
      });
      console.log("✅ Cleanup complete");
    } catch (error) {
      console.error("❌ Cleanup failed:", error.message);
    }
  },

  async logs() {
    console.log("📋 Container logs:");
    try {
      execCommand(`docker logs ${CONFIG.CONTAINER_NAME} --tail 50`);
    } catch (error) {
      console.error("❌ Could not retrieve logs:", error.message);
    }
  },
};

// Interactive menu
async function showMenu() {
  console.clear();
  console.log("🗄️  Test Database Manager");
  console.log("=".repeat(30));
  console.log("1. 🚀 Setup Database");
  console.log("2. 🔄 Reset Database");
  console.log("3. 🌱 Seed Test Data");
  console.log("4. 🏥 Health Check");
  console.log("5. ⚡ Performance Benchmark");
  console.log("6. 📋 View Logs");
  console.log("7. 🧹 Cleanup");
  console.log("8. ❌ Exit");
  console.log("=".repeat(30));

  const choice = await promptUser("Choose an option (1-8): ");

  switch (choice) {
    case "1":
      await DatabaseOps.setup();
      break;
    case "2":
      await DatabaseOps.reset();
      break;
    case "3":
      await DatabaseOps.seed();
      break;
    case "4":
      await DatabaseOps.healthCheck();
      break;
    case "5":
      await DatabaseOps.benchmark();
      break;
    case "6":
      await DatabaseOps.logs();
      break;
    case "7":
      await DatabaseOps.cleanup();
      break;
    case "8":
      console.log("👋 Goodbye!");
      process.exit(0);
      break;
    default:
      console.log("❌ Invalid option. Please try again.");
  }

  console.log("\nPress any key to continue...");
  await promptUser("");
  return showMenu();
}

// Main execution
async function main() {
  if (process.argv.includes("--setup")) {
    return DatabaseOps.setup();
  }

  if (process.argv.includes("--reset")) {
    return DatabaseOps.reset();
  }

  if (process.argv.includes("--seed")) {
    return DatabaseOps.seed();
  }

  if (process.argv.includes("--health")) {
    return DatabaseOps.healthCheck();
  }

  if (process.argv.includes("--benchmark")) {
    return DatabaseOps.benchmark();
  }

  if (process.argv.includes("--cleanup")) {
    return DatabaseOps.cleanup();
  }

  if (process.argv.includes("--logs")) {
    return DatabaseOps.logs();
  }

  // Interactive mode
  return showMenu();
}

// Error handling
process.on("SIGINT", () => {
  console.log("\n👋 Exiting test database manager...");
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error.message);
  process.exit(1);
});

// Run
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });
}

module.exports = { DatabaseOps, CONFIG };
