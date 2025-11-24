// Environment Variable Verification Script for Production Deployment
import dotenv from "dotenv";
dotenv.config();

const REQUIRED_PRODUCTION_VARS = [
  "NODE_ENV",
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "EMAIL_USER",
  "EMAIL_PASSWORD",
  "WALLET_ENCRYPTION_KEY",
  "WALLET_MASTER_SEED",
  "ADMIN_BTC_WALLET_ADDRESS",
  "ADMIN_ETH_WALLET_ADDRESS",
  "SENTRY_DSN",
];

const OPTIONAL_VARS = [
  "CRYPTOMUS_API_KEY",
  "NOWPAYMENTS_API_KEY",
  "REDIS_URL",
  "RABBITMQ_URL",
  "AWS_ACCESS_KEY_ID",
  "VAPID_PUBLIC_KEY",
];

interface ValidationIssue {
  type: "missing" | "weak" | "suspicious" | "warning";
  variable: string;
  message: string;
}

function verifyEnv() {
  const issues: ValidationIssue[] = [];

  // Check required variables
  REQUIRED_PRODUCTION_VARS.forEach((varName) => {
    const value = process.env[varName];

    if (!value) {
      issues.push({
        type: "missing",
        variable: varName,
        message: "Required variable not set",
      });
      return;
    }

    // Production-specific validations
    if (process.env.NODE_ENV === "production") {
      // Check for test/dev values
      if (
        value.toLowerCase().includes("test") ||
        value.toLowerCase().includes("dev")
      ) {
        issues.push({
          type: "suspicious",
          variable: varName,
          message: "Contains test/dev keywords - should use production values",
        });
      }

      // Check secret length
      if (varName.includes("SECRET") && value.length < 32) {
        issues.push({
          type: "weak",
          variable: varName,
          message: `Too short (${value.length} chars) - should be at least 32 characters`,
        });
      }

      // Check Stripe live keys
      if (varName === "STRIPE_SECRET_KEY" && !value.startsWith("sk_live_")) {
        issues.push({
          type: "suspicious",
          variable: varName,
          message: "Not a LIVE key! Should start with sk_live_",
        });
      }

      if (varName === "STRIPE_WEBHOOK_SECRET" && !value.startsWith("whsec_")) {
        issues.push({
          type: "suspicious",
          variable: varName,
          message: "Invalid format - should start with whsec_",
        });
      }

      // Check database SSL
      if (varName === "DATABASE_URL" && !value.includes("sslmode=require")) {
        issues.push({
          type: "warning",
          variable: varName,
          message: "Missing sslmode=require - should use SSL in production",
        });
      }

      // Check wallet addresses
      if (
        varName === "ADMIN_BTC_WALLET_ADDRESS" &&
        !value.match(/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/)
      ) {
        issues.push({
          type: "suspicious",
          variable: varName,
          message: "Invalid Bitcoin address format",
        });
      }

      if (
        varName === "ADMIN_ETH_WALLET_ADDRESS" &&
        !value.match(/^0x[a-fA-F0-9]{40}$/)
      ) {
        issues.push({
          type: "suspicious",
          variable: varName,
          message: "Invalid Ethereum address format",
        });
      }
    }
  });

  // Check optional variables
  OPTIONAL_VARS.forEach((varName) => {
    const value = process.env[varName];
    if (!value) {
      issues.push({
        type: "warning",
        variable: varName,
        message: "Optional variable not set - some features may be disabled",
      });
    }
  });

  // Print results
  console.log("\n========================================");
  console.log("ENVIRONMENT VALIDATION REPORT");
  console.log("========================================\n");

  const missing = issues.filter((i) => i.type === "missing");
  const weak = issues.filter((i) => i.type === "weak");
  const suspicious = issues.filter((i) => i.type === "suspicious");
  const warnings = issues.filter((i) => i.type === "warning");

  if (missing.length > 0) {
    console.error("❌ MISSING REQUIRED VARIABLES:");
    missing.forEach((i) => console.error(`  - ${i.variable}: ${i.message}`));
    console.error("");
  }

  if (suspicious.length > 0) {
    console.error("🚨 SUSPICIOUS/DANGEROUS VALUES:");
    suspicious.forEach((i) => console.error(`  - ${i.variable}: ${i.message}`));
    console.error("");
  }

  if (weak.length > 0) {
    console.warn("⚠️  WEAK SECURITY:");
    weak.forEach((i) => console.warn(`  - ${i.variable}: ${i.message}`));
    console.warn("");
  }

  if (warnings.length > 0) {
    console.log("ℹ️  WARNINGS:");
    warnings.forEach((i) => console.log(`  - ${i.variable}: ${i.message}`));
    console.log("");
  }

  if (missing.length === 0 && suspicious.length === 0 && weak.length === 0) {
    console.log(
      "✅ All required environment variables are properly configured",
    );
    console.log("");
  }

  // Exit with error if critical issues found
  if (missing.length > 0 || suspicious.length > 0 || weak.length > 0) {
    console.error("❌ VALIDATION FAILED - Fix issues before deploying!");
    process.exitCode = 1;
  } else {
    console.log("✅ VALIDATION PASSED - Safe to deploy");
  }
}

// Run verification
verifyEnv();
