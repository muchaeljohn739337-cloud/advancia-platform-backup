#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates that all required environment variables are set
 */

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const requiredVars = [
  "NODE_ENV",
  "DATABASE_URL",
  "JWT_SECRET",
  "ENCRYPTION_KEY",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "STRIPE_SECRET_KEY",
  "STRIPE_PUBLISHABLE_KEY",
];

const recommendedVars = [
  "REDIS_URL",
  "JWT_EXPIRES_IN",
  "BCRYPT_ROUNDS",
  "RATE_LIMIT_MAX_REQUESTS",
];

console.log("🔍 Validating Environment Configuration\n");

let missingRequired = [];
let missingRecommended = [];

requiredVars.forEach((varName) => {
  if (!process.env[varName]) {
    missingRequired.push(varName);
  }
});

recommendedVars.forEach((varName) => {
  if (!process.env[varName]) {
    missingRecommended.push(varName);
  }
});

if (missingRequired.length > 0) {
  console.log("❌ Missing Required Environment Variables:");
  missingRequired.forEach((varName) => {
    console.log(`   - ${varName}`);
  });
  console.log("\n💡 Set these variables in your .env.local file");
  process.exit(1);
}

if (missingRecommended.length > 0) {
  console.log("⚠️  Missing Recommended Environment Variables:");
  missingRecommended.forEach((varName) => {
    console.log(`   - ${varName}`);
  });
  console.log("\n💡 Consider setting these for optimal performance");
}

console.log("✅ Environment validation passed!");

// Additional validations
const issues = [];

// Check JWT secret length
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  issues.push("JWT_SECRET should be at least 32 characters long");
}

// Check encryption key length
if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length !== 32) {
  issues.push("ENCRYPTION_KEY must be exactly 32 characters long");
}

// Check database URL format
if (
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.startsWith("postgresql://")
) {
  issues.push("DATABASE_URL should start with postgresql://");
}

if (issues.length > 0) {
  console.log("\n⚠️  Configuration Issues:");
  issues.forEach((issue) => {
    console.log(`   - ${issue}`);
  });
} else {
  console.log("✅ All configurations look good!");
}

console.log("\n🎯 Ready to start the application!");
