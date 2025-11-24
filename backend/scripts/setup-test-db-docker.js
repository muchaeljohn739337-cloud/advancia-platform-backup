#!/usr/bin/env node
/**
 * PostgreSQL Test Database Setup with Docker
 * Enhanced with environment validation and graceful cleanup
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Load test environment
require("dotenv").config({ path: ".env.test" });

console.log("🔧 Test Database Setup with Docker - Advancia Pay Ledger");

const CONFIG = {
  CONTAINER_NAME: "postgres-test",
  POSTGRES_PORT: "5433",
  POSTGRES_PASSWORD: "postgres",
  POSTGRES_DB: "advancia_payledger_test",
  DATABASE_URL:
    "postgresql://postgres:postgres@localhost:5433/advancia_payledger_test",
};

/**
 * Execute commands with better error handling
 */
function execCommand(command, options = {}) {
  try {
    return execSync(command, {
      stdio: options.silent ? "pipe" : "inherit",
      encoding: "utf8",
      ...options,
    });
  } catch (error) {
    if (!options.allowFailure) {
      throw new Error(`Command failed: ${command}\n${error.message}`);
    }
    return null;
  }
}

/**
 * Check if container is running
 */
function isContainerRunning(containerName) {
  try {
    const result = execCommand(`docker ps --format "{{.Names}}"`, {
      silent: true,
      allowFailure: true,
    });
    return result && result.includes(containerName);
  } catch {
    return false;
  }
}

/**
 * Validate environment per architecture guide
 */
function validateEnvironment() {
  console.log("🔍 Validating environment...");

  // Check required files
  const requiredFiles = ["prisma/schema.prisma", "package.json"];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(
        `Required file not found: ${file}. Please run from backend directory.`,
      );
    }
  }

  // Check package.json dependencies
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const requiredDeps = ["@prisma/client", "prisma"];

  for (const dep of requiredDeps) {
    if (
      !packageJson.dependencies?.[dep] &&
      !packageJson.devDependencies?.[dep]
    ) {
      console.warn(`⚠️ Warning: ${dep} not found in dependencies`);
    }
  }

  console.log("✅ Environment validation passed");
}

/**
 * Setup cleanup handlers for graceful shutdown
 */
function setupCleanupHandlers() {
  const cleanup = (signal) => {
    console.log(`\n🧹 Received ${signal}, cleaning up...`);
    try {
      if (isContainerRunning(CONFIG.CONTAINER_NAME)) {
        console.log("🛑 Stopping PostgreSQL container...");
        execCommand(`docker stop ${CONFIG.CONTAINER_NAME}`, {
          silent: true,
          allowFailure: true,
        });
        execCommand(`docker rm ${CONFIG.CONTAINER_NAME}`, {
          silent: true,
          allowFailure: true,
        });
        console.log("✅ Container cleaned up");
      }
    } catch (error) {
      console.error("❌ Cleanup error:", error.message);
    }
    process.exit(0);
  };

  // Handle various termination signals
  process.on("SIGINT", () => cleanup("SIGINT"));
  process.on("SIGTERM", () => cleanup("SIGTERM"));

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught Exception:", error);
    cleanup("uncaughtException");
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
    cleanup("unhandledRejection");
  });
}

/**
 * Create .env.test if it doesn't exist
 */
function ensureTestEnvironment() {
  const envTestPath = ".env.test";

  if (!fs.existsSync(envTestPath)) {
    console.log("📝 Creating .env.test file...");

    const envTestContent = `# Test Environment - Advancia Pay Ledger
DATABASE_URL=${CONFIG.DATABASE_URL}
NODE_ENV=test
PORT=4001

# JWT Configuration
JWT_SECRET=test-jwt-secret-key-for-testing-only-minimum-32-chars
JWT_EXPIRES_IN=1h

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Disable external services in tests
DISABLE_NOTIFICATIONS=true
DISABLE_EMAIL=true
DISABLE_STRIPE=true
DISABLE_CRYPTOMUS=true

# Test API Keys
STRIPE_SECRET_KEY=sk_test_fake
CRYPTOMUS_API_KEY=fake_api_key
EMAIL_USER=test@example.com
`;

    fs.writeFileSync(envTestPath, envTestContent);
    console.log("✅ Created .env.test file");
  }
}

async function setupTestDatabase() {
  try {
    // Setup cleanup handlers first
    setupCleanupHandlers();

    // Validate environment
    validateEnvironment();
    ensureTestEnvironment();
    // Check if Docker is available
    console.log("1️⃣ Checking Docker...");
    try {
      execCommand("docker --version", { silent: true });
      console.log("✅ Docker is available");
    } catch (error) {
      console.error(
        "❌ Docker not found. Install with: winget install Docker.DockerDesktop",
      );
      console.error("💡 Or use CI environment with PostgreSQL");
      process.exit(1);
    }

    // Check if PostgreSQL container is running
    if (isContainerRunning(CONFIG.CONTAINER_NAME)) {
      console.log("✅ PostgreSQL container already running");
    } else {
      console.log("2️⃣ Setting up PostgreSQL container...");
      // Stop and remove existing container if it exists
      try {
        execCommand(`docker stop ${CONFIG.CONTAINER_NAME}`, {
          silent: true,
          allowFailure: true,
        });
        execCommand(`docker rm ${CONFIG.CONTAINER_NAME}`, {
          silent: true,
          allowFailure: true,
        });
        console.log("🗑️ Cleaned up any existing container");
      } catch (e) {
        // Container doesn't exist, that's fine
      }

      console.log(
        `🚀 Starting PostgreSQL container on port ${CONFIG.POSTGRES_PORT}...`,
      );
      execCommand(
        `docker run -d --name ${CONFIG.CONTAINER_NAME} -p ${CONFIG.POSTGRES_PORT}:5432 -e POSTGRES_PASSWORD=${CONFIG.POSTGRES_PASSWORD} -e POSTGRES_DB=${CONFIG.POSTGRES_DB} postgres:15-alpine`,
      );

      // Wait for PostgreSQL to be ready with better feedback
      console.log("⏳ Waiting for PostgreSQL to be ready...");
      let retries = 30;
      let delay = 1000;

      while (retries > 0) {
        try {
          execCommand(`docker exec ${CONFIG.CONTAINER_NAME} pg_isready`, {
            silent: true,
          });
          console.log("✅ PostgreSQL is ready!");
          break;
        } catch (e) {
          retries--;
          if (retries === 0) throw new Error("PostgreSQL failed to start");
          console.log(`⏳ Attempt ${31 - retries}/30 - waiting ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay = Math.min(delay * 1.1, 5000); // Exponential backoff
        }
      }
    }

    // Generate Prisma client
    console.log("3️⃣ Generating Prisma client...");
    execCommand("npx prisma generate");

    // Run migrations
    console.log("4️⃣ Running database migrations...");
    execCommand("npx prisma migrate deploy", {
      env: {
        ...process.env,
        DATABASE_URL: CONFIG.DATABASE_URL,
      },
    });

    // Verify database
    console.log("5️⃣ Verifying database...");
    execCommand("npx prisma migrate status", {
      env: {
        ...process.env,
        DATABASE_URL: CONFIG.DATABASE_URL,
      },
    });

    // Optional: Seed test data if exists
    if (fs.existsSync("prisma/seed.ts") || fs.existsSync("prisma/seed.js")) {
      console.log("6️⃣ Seeding test data...");
      execCommand("npx prisma db seed", {
        env: {
          ...process.env,
          DATABASE_URL: CONFIG.DATABASE_URL,
        },
        allowFailure: true,
      });
    }

    console.log("\n🎉 Test database setup complete!");
    console.log("📋 Summary:");
    console.log(`   • PostgreSQL: localhost:${CONFIG.POSTGRES_PORT}`);
    console.log(`   • Database: ${CONFIG.POSTGRES_DB}`);
    console.log(`   • Connection: ${CONFIG.DATABASE_URL}`);

    console.log("\n💡 Next Steps:");
    console.log("   • Backend: npm run dev (port 4000)");
    console.log("   • Frontend: cd ../frontend && npm run dev (port 3000)");
    console.log("   • Tests: npm test");
    console.log("   • Database UI: npx prisma studio");
    console.log("   • Cleanup: docker stop postgres-test");

    console.log("\n🌐 Frontend Integration Tips:");
    console.log(
      "   • Add to frontend .env.local: NEXT_PUBLIC_API_URL=http://localhost:4000",
    );
    console.log("   • Ensure CORS origins include your frontend URL");
    console.log(
      "   • Socket.IO client should connect to: http://localhost:4000",
    );
  } catch (error) {
    console.error("❌ Database setup failed:", error.message);

    if (error.message.includes("Docker")) {
      console.log("\n🔧 Docker Troubleshooting:");
      console.log(
        "   • Install Docker Desktop: https://www.docker.com/products/docker-desktop/",
      );
      console.log("   • Verify Docker is running: docker --version");
      console.log("   • Check Docker daemon: docker ps");
    }

    if (error.message.includes("prisma")) {
      console.log("\n🔧 Prisma Troubleshooting:");
      console.log("   • Install dependencies: npm install");
      console.log("   • Generate client: npx prisma generate");
      console.log("   • Check schema: npx prisma format");
    }

    if (error.message.includes("port") || error.message.includes("5433")) {
      console.log("\n🔧 Port Troubleshooting:");
      console.log("   • Check port usage: netstat -an | findstr :5433");
      console.log(
        "   • Stop conflicting containers: docker stop postgres-test",
      );
      console.log("   • Use different port: Set POSTGRES_PORT in .env.test");
    }

    if (
      error.message.includes("connection") ||
      error.message.includes("timeout")
    ) {
      console.log("\n🔧 Connection Troubleshooting:");
      console.log(
        "   • Wait longer for PostgreSQL: Increase POSTGRES_TIMEOUT in CONFIG",
      );
      console.log("   • Check container logs: docker logs postgres-test");
      console.log("   • Verify network: docker network ls");
    }

    console.log("\n📞 Get Help:");
    console.log("   • Check logs: docker logs postgres-test");
    console.log("   • Database status: docker ps -a");
    console.log(
      "   • Full cleanup: docker rm -f postgres-test && npm run setup:test-db",
    );
    console.log(
      "   • Manual connection: docker exec -it postgres-test psql -U postgres -d advancia_payledger_test",
    );

    console.log("\n🚀 Alternative Setup:");
    console.log(
      "   • Use CI/CD database: Set DATABASE_URL for external PostgreSQL",
    );
    console.log("   • Use SQLite: Update schema.prisma provider to 'sqlite'");
    console.log(
      "   • Docker Compose: docker-compose -f docker-compose.dev-db.yml up",
    );

    process.exit(1);
  }
}

setupTestDatabase();
