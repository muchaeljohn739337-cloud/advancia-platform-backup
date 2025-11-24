#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates all required environment variables and services
 */

require("dotenv").config({ path: ".env.local" });

const crypto = require("crypto");
const { createClient } = require("redis");

const REQUIRED_VARS = [
  "NODE_ENV",
  "PORT",
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "ENCRYPTION_KEY",
  "REDIS_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "ADMIN_EMAIL",
  "CORS_ORIGIN",
];

const RECOMMENDED_VARS = [
  "ALERT_EMAIL",
  "RATE_LIMIT_WINDOW_MS",
  "RATE_LIMIT_MAX_REQUESTS",
  "HEALTH_CHECK_URL",
  "LOG_FILE",
];

let errors = [];
let warnings = [];

function validateEnvironmentVariable(name, value, required = true) {
  if (required && !value) {
    errors.push(`❌ ${name} is required but not set`);
    return false;
  }

  if (!required && !value) {
    warnings.push(`⚠️  ${name} is recommended but not set`);
    return true;
  }

  // Specific validations
  switch (name) {
    case "JWT_SECRET":
    case "JWT_REFRESH_SECRET":
      if (value.length < 64) {
        errors.push(`❌ ${name} must be at least 64 characters long`);
        return false;
      }
      break;
    case "ENCRYPTION_KEY":
      if (value.length !== 32) {
        errors.push(`❌ ${name} must be exactly 32 characters long`);
        return false;
      }
      break;
    case "DATABASE_URL":
      if (!value.startsWith("postgresql://")) {
        errors.push(`❌ ${name} must be a valid PostgreSQL connection string`);
        return false;
      }
      break;
    case "REDIS_URL":
      if (!value.startsWith("redis://")) {
        errors.push(`❌ ${name} must be a valid Redis connection string`);
        return false;
      }
      break;
    case "PORT":
      const port = parseInt(value);
      if (isNaN(port) || port < 1 || port > 65535) {
        errors.push(`❌ ${name} must be a valid port number (1-65535)`);
        return false;
      }
      break;
  }

  console.log(`✅ ${name} is valid`);
  return true;
}

async function validateRedisConnection() {
  try {
    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();
    await client.ping();
    await client.disconnect();
    console.log("✅ Redis connection successful");
    return true;
  } catch (error) {
    errors.push(`❌ Redis connection failed: ${error.message}`);
    return false;
  }
}

function validateEncryptionKey() {
  try {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key.length !== 32) {
      errors.push("❌ ENCRYPTION_KEY must be exactly 32 characters");
      return false;
    }

    // Test that the key can be used for encryption (basic validation)
    const testData = "test";
    const algorithm = "aes-256-cbc";
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted =
      cipher.update(testData, "utf8", "hex") + cipher.final("hex");

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    const decrypted =
      decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");

    if (decrypted !== testData) {
      errors.push("❌ ENCRYPTION_KEY encryption/decryption test failed");
      return false;
    }

    console.log("✅ Encryption key validation successful");
    return true;
  } catch (error) {
    errors.push(`❌ Encryption key validation failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("🔍 Environment Validation Starting...");
  console.log("=====================================");
  console.log("");

  // Validate required variables
  console.log("📋 Checking Required Variables:");
  REQUIRED_VARS.forEach((varName) => {
    validateEnvironmentVariable(varName, process.env[varName], true);
  });
  console.log("");

  // Validate recommended variables
  console.log("📋 Checking Recommended Variables:");
  RECOMMENDED_VARS.forEach((varName) => {
    validateEnvironmentVariable(varName, process.env[varName], false);
  });
  console.log("");

  // Validate Redis connection
  console.log("🔗 Testing Service Connections:");
  await validateRedisConnection();

  // Validate encryption
  validateEncryptionKey();

  console.log("");
  console.log("📊 Validation Results:");
  console.log("======================");

  if (errors.length > 0) {
    console.log(`❌ ${errors.length} error(s) found:`);
    errors.forEach((error) => console.log(`   ${error}`));
    console.log("");
  }

  if (warnings.length > 0) {
    console.log(`⚠️  ${warnings.length} warning(s):`);
    warnings.forEach((warning) => console.log(`   ${warning}`));
    console.log("");
  }

  if (errors.length === 0) {
    console.log(
      "✅ Environment validation passed! ✅ All configurations look good!",
    );
    if (warnings.length === 0) {
      console.log("🎉 No warnings - environment is perfectly configured!");
    } else {
      console.log(
        "⚠️  Environment is functional but consider addressing warnings for optimal security.",
      );
    }
    process.exit(0);
  } else {
    console.log(
      "❌ Environment validation failed. Please fix the errors above.",
    );
    process.exit(1);
  }
}

// Handle promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

main().catch((error) => {
  console.error("❌ Validation script failed:", error);
  process.exit(1);
});
