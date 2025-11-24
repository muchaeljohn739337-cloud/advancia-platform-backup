import { execSync } from "child_process";
import { exit } from "process";

console.log("🚀 ADVANCIA PAY - PRE-PRODUCTION VERIFICATION\n");
console.log("=".repeat(60));
console.log("\n");

const scripts = [
  { name: "Environment Variables", script: "verify-env.ts", critical: true },
  {
    name: "Database Migrations",
    script: "verify-migrations.ts",
    critical: true,
  },
  { name: "Security Audit", script: "security-audit.ts", critical: true },
  { name: "API Health Check", script: "verify-api.ts", critical: false },
  { name: "Storage (R2) Check", script: "verify-storage.ts", critical: false },
  {
    name: "Stripe Webhook Signature",
    script: "verify-stripe-webhook.ts",
    critical: true,
  },
  {
    name: "CORS & Security Headers",
    script: "verify-cors-security.ts",
    critical: false,
  },
];

let allPassed = true;
let criticalFailed = false;

for (const { name, script, critical } of scripts) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Running: ${name}`);
  console.log("=".repeat(60));

  try {
    execSync(`npx ts-node scripts/${script}`, {
      stdio: "inherit",
      cwd: __dirname + "/..",
    });
    console.log(`\n✅ ${name} PASSED`);
  } catch (error) {
    console.error(`\n❌ ${name} FAILED`);
    allPassed = false;
    if (critical) {
      criticalFailed = true;
    }
  }
}

console.log(`\n${"=".repeat(60)}`);
console.log("FINAL RESULT");
console.log("=".repeat(60));

if (allPassed) {
  console.log("\n✅ ALL VERIFICATIONS PASSED - READY FOR PRODUCTION! 🎉\n");
  console.log("Next steps:");
  console.log("1. Review PRE_DEPLOYMENT_CHECKLIST.md");
  console.log("2. Backup database: npm run db:backup");
  console.log("3. Deploy: git push origin main");
  console.log("\n");
  exit(0);
} else if (criticalFailed) {
  console.error(
    "\n❌ CRITICAL VERIFICATIONS FAILED - DO NOT DEPLOY TO PRODUCTION!\n",
  );
  console.error("Fix all critical issues above before proceeding.\n");
  exit(1);
} else {
  console.warn("\n⚠️  SOME NON-CRITICAL VERIFICATIONS FAILED\n");
  console.warn("Review warnings above. You may proceed with caution.\n");
  exit(0);
}
