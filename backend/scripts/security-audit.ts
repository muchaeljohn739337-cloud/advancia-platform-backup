import { execSync } from "child_process";
import fs from "fs";
import path from "path";

class SecurityAuditor {
  private issues: string[] = [];
  private warnings: string[] = [];

  async audit() {
    console.log("🔒 Running security audit...\n");

    this.checkDependencies();
    this.checkSecrets();
    this.checkCORS();
    this.checkRateLimiting();
    this.checkHelmet();

    this.reportResults();

    if (this.issues.length > 0) {
      console.error("\n❌ SECURITY AUDIT FAILED - Fix issues before deploying");
      process.exit(1);
    }

    console.log("\n✅ Security audit passed!");
    process.exit(0);
  }

  private checkDependencies() {
    console.log("1. Checking for vulnerable dependencies...");
    try {
      const auditOutput = execSync("npm audit --production --json", {
        encoding: "utf-8",
        cwd: path.join(__dirname, ".."),
      });
      const audit = JSON.parse(auditOutput);

      if (
        audit.metadata.vulnerabilities.high > 0 ||
        audit.metadata.vulnerabilities.critical > 0
      ) {
        this.issues.push(
          `Found ${audit.metadata.vulnerabilities.critical} critical and ${audit.metadata.vulnerabilities.high} high vulnerabilities`,
        );
      } else {
        console.log("  ✅ No critical/high vulnerabilities found");
      }
    } catch (error: any) {
      if (error.stdout) {
        try {
          const audit = JSON.parse(error.stdout);
          if (
            audit.metadata.vulnerabilities.high > 0 ||
            audit.metadata.vulnerabilities.critical > 0
          ) {
            this.issues.push(
              `Found ${audit.metadata.vulnerabilities.critical} critical and ${audit.metadata.vulnerabilities.high} high vulnerabilities`,
            );
          } else {
            console.log("  ✅ No critical/high vulnerabilities found");
          }
        } catch {
          console.log("  ℹ️  Could not parse npm audit output");
        }
      }
    }
  }

  private checkSecrets() {
    console.log("\n2. Checking for exposed secrets...");
    const envFile = path.join(__dirname, "..", ".env");

    if (!fs.existsSync(envFile)) {
      this.warnings.push(
        ".env file not found - make sure to configure before deployment",
      );
      return;
    }

    const envContent = fs.readFileSync(envFile, "utf-8");

    const placeholders = [
      "your-",
      "YOUR_",
      "CHANGE_ME",
      "example",
      "test123",
      "<GENERATE",
    ];
    placeholders.forEach((placeholder) => {
      if (envContent.includes(placeholder)) {
        this.warnings.push(
          `Possible placeholder value found in .env: "${placeholder}"`,
        );
      }
    });

    console.log("  ✅ Secret check complete");
  }

  private checkCORS() {
    console.log("\n3. Checking CORS configuration...");
    const configPath = path.join(__dirname, "..", "src", "config", "index.ts");

    if (!fs.existsSync(configPath)) {
      this.warnings.push("config/index.ts not found");
      return;
    }

    const configContent = fs.readFileSync(configPath, "utf-8");

    if (
      configContent.includes("origin: '*'") ||
      configContent.includes('origin:"*"')
    ) {
      this.issues.push(
        "CORS allows all origins (*) - restrict to specific domains in production",
      );
    } else {
      console.log("  ✅ CORS appears to be restricted");
    }
  }

  private checkRateLimiting() {
    console.log("\n4. Checking rate limiting...");
    const indexPath = path.join(__dirname, "..", "src", "index.ts");

    if (!fs.existsSync(indexPath)) {
      this.issues.push("src/index.ts not found");
      return;
    }

    const indexContent = fs.readFileSync(indexPath, "utf-8");

    if (
      !indexContent.includes("rateLimit") &&
      !indexContent.includes("rateLimiter")
    ) {
      this.warnings.push("Rate limiting not found in src/index.ts");
    } else {
      console.log("  ✅ Rate limiting configured");
    }
  }

  private checkHelmet() {
    console.log("\n5. Checking Helmet security headers...");
    const indexPath = path.join(__dirname, "..", "src", "index.ts");

    if (!fs.existsSync(indexPath)) {
      return;
    }

    const indexContent = fs.readFileSync(indexPath, "utf-8");

    if (!indexContent.includes("helmet")) {
      this.warnings.push("Helmet security headers not found - consider adding");
    } else {
      console.log("  ✅ Helmet configured");
    }
  }

  private reportResults() {
    if (this.issues.length > 0) {
      console.error("\n❌ SECURITY ISSUES:");
      this.issues.forEach((issue) => console.error(`  - ${issue}`));
    }

    if (this.warnings.length > 0) {
      console.warn("\n⚠️  SECURITY WARNINGS:");
      this.warnings.forEach((warn) => console.warn(`  - ${warn}`));
    }

    console.log("\n📊 SUMMARY:");
    console.log(`  Issues: ${this.issues.length}`);
    console.log(`  Warnings: ${this.warnings.length}`);
  }
}

new SecurityAuditor().audit();
