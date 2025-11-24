# 🔒 Sensitive Files Protection

Automated scanning and protection for sensitive files and secrets in your repository.

---

## 🚀 Quick Start

### 1. Run Security Scan

**PowerShell (Windows):**

```powershell
.\scripts\scan-sensitive-files.ps1
```

**Bash (Linux/Mac):**

```bash
chmod +x scripts/scan-sensitive-files.sh
./scripts/scan-sensitive-files.sh
```

### 2. Install Pre-Commit Hook (Recommended)

```bash
# Install the hook
cp scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Test it
echo "sk_live_test123" >> test.txt
git add test.txt
git commit -m "test"  # Should be blocked!
rm test.txt
```

### 3. Enable GitHub Actions

The security scan workflow runs automatically on:

-   Every push
-   Every pull request
-   Daily at 2 AM UTC
-   Manual trigger

View: `.github/workflows/security-scan-sensitive-files.yml`

---

## 🛡️ What's Protected

### Sensitive File Patterns

-   ❌ `.env`, `.env.local`, `.env.production`
-   ❌ `*.pem`, `*.key`, `*.p12`, `*.pfx`
-   ❌ `*secrets*.json`, `*credentials*.json`
-   ❌ `*.sql`, `*.dump`, `*.backup`
-   ❌ `id_rsa*`, SSH/GPG keys

### Sensitive Content Patterns

-   🔴 **CRITICAL:**
    -   AWS Access Keys (`AKIA...`)
    -   GitHub Tokens (`ghp_...`, `gho_...`)
    -   Stripe Live Keys (`sk_live_...`)
    -   Private Keys (`-----BEGIN PRIVATE KEY-----`)

-   🟡 **HIGH:**
    -   Hardcoded passwords
    -   JWT secrets
    -   Database URLs with credentials

-   🔵 **MEDIUM:**
    -   Stripe Test Keys
    -   Generic secret keys

---

## 📋 Scripts Overview

### `scan-sensitive-files.ps1` / `.sh`

Full repository scanner with detailed reporting.

**Usage:**

```powershell
# Basic scan
.\scripts\scan-sensitive-files.ps1

# Detailed output
.\scripts\scan-sensitive-files.ps1 -Detailed

# Auto-fix .gitignore issues
.\scripts\scan-sensitive-files.ps1 -Fix
```

```bash
# Basic scan
./scripts/scan-sensitive-files.sh

# Detailed output
./scripts/scan-sensitive-files.sh --detailed

# Auto-fix .gitignore issues
./scripts/scan-sensitive-files.sh --fix
```

**Output:**

```
🔍 Sensitive Files Scanner
================================================================================

🔎 Scanning for sensitive file patterns...
Checking: Environment Files
  ✅ Ignored: ./backend/.env.example

🔍 Scanning file contents for secrets...
  [CRITICAL] ./fix-env.sh:21 - Stripe Live Keys

🔒 Checking .gitignore protection...
  ✅ All patterns present

================================================================================
📊 SCAN SUMMARY
================================================================================

Files Scanned: 150

Issues Found:
  🔴 CRITICAL: 1
  🟡 HIGH: 0
  🔵 MEDIUM: 0
  📝 TOTAL: 1
```

### `pre-commit.sh`

Git hook that blocks commits with sensitive data.

**Features:**

-   Scans staged files only (fast)
-   Blocks .env files
-   Detects common secret patterns
-   Provides actionable feedback

**Install:**

```bash
cp scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

**Bypass (emergency only):**

```bash
git commit --no-verify -m "Emergency fix"
```

---

## 🔧 GitHub Actions Workflow

### Features

-   ✅ Custom scanner integration
-   ✅ Gitleaks secret detection
-   ✅ File pattern validation
-   ✅ .gitignore verification
-   ✅ Automated reports
-   ✅ Artifact uploads

### Workflow Triggers

```yaml
on:
  push:
    branches: ["**"] # All pushes
  pull_request:
    branches: [main] # PRs to main
  schedule:
    - cron: "0 2 * * *" # Daily at 2 AM
  workflow_dispatch: # Manual trigger
```

### View Results

1. Go to: **Actions** tab
2. Select: **Security - Scan Sensitive Files**
3. View latest run
4. Download: **gitleaks-report** artifact

---

## 🎯 CODEOWNERS Protection

Sensitive files require security team approval:

```
# Security-Sensitive Files
/backend/src/middleware/auth.ts              @security-team
/backend/src/routes/auth.ts                  @security-team
/scripts/scan-sensitive-files.*              @security-team
/SECURITY*.md                                @security-team
/SECRET_MANAGEMENT_GUIDE.md                  @security-team

# Payment Processing
/backend/src/routes/payments.ts              @security-team @backend-team

# Secret Management
/scripts/secrets/**                          @security-team
```

Update `.github/CODEOWNERS` with your team names!

---

## 🚨 What to Do If Secrets Are Found

### Immediate Actions

1. **STOP** - Don't push if you haven't already
2. **Remove** the sensitive data from files
3. **Rotate** the exposed credentials immediately
4. **Run scan** again to verify removal

### If Already Pushed

1. **Revoke credentials immediately:**
   -   GitHub: <https://github.com/settings/tokens>
   -   Stripe: <https://dashboard.stripe.com/apikeys>
   -   AWS: IAM Console

2. **Remove from git history:**

   ```bash
   # Using BFG Repo Cleaner (recommended)
   bfg --replace-text secrets.txt repo.git

   # Or using git filter-branch
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/file" \
     --prune-empty --tag-name-filter cat -- --all

   # Force push (WARNING: Rewrites history)
   git push origin --force --all
   ```

3. **Notify team** about the incident

4. **Update documentation** with new credentials

---

## 📊 Scan Report Example

```
🔍 Sensitive Files Scanner
================================================================================

🔎 Scanning for sensitive file patterns...
Checking: Environment Files
  ❌ TRACKED: ./backend/.env
  ✅ Ignored: ./backend/.env.example

🔍 Scanning file contents for secrets...
  [CRITICAL] ./scripts/deploy.sh:45 - AWS Keys
  [HIGH] ./config/database.ts:12 - Database URLs
  [MEDIUM] ./test/fixtures.ts:8 - Stripe Test Keys

🔒 Checking .gitignore protection...
  ⚠️  Missing: *.pem
  ⚠️  Missing: *.dump

================================================================================
📊 SCAN SUMMARY
================================================================================

Files Scanned: 237

Issues Found:
  🔴 CRITICAL: 1
  🟡 HIGH: 1
  🔵 MEDIUM: 1
  📝 TOTAL: 3

⚠️  ACTION REQUIRED
Review and fix all issues above before committing!

📚 Recommendations:
  1. Review SECRET_MANAGEMENT_GUIDE.md
  2. Use environment variables for secrets
  3. Never commit .env files
  4. Rotate any exposed credentials immediately
  5. Enable GitHub secret scanning
```

---

## ✅ Best Practices

### DO ✅

-   ✅ Use environment variables for secrets
-   ✅ Keep secrets in GitHub Secrets / Azure Key Vault
-   ✅ Run scans before committing
-   ✅ Enable pre-commit hooks
-   ✅ Use `.env.example` files with placeholders
-   ✅ Rotate credentials regularly

### DON'T ❌

-   ❌ Commit .env files
-   ❌ Hardcode passwords in code
-   ❌ Share secrets in Slack/Email
-   ❌ Use production keys in development
-   ❌ Skip security scans
-   ❌ Disable pre-commit hooks without reason

---

## 🔗 Related Documentation

-   **[SECRET_MANAGEMENT_GUIDE.md](../SECRET_MANAGEMENT_GUIDE.md)** - Complete secret management guide
-   **[SECURITY_AUDIT_2025-11-17.md](../SECURITY_AUDIT_2025-11-17.md)** - Latest security audit
-   **[BRANCH_PROTECTION_GUIDE.md](../BRANCH_PROTECTION_GUIDE.md)** - Branch protection setup

---

## 🆘 Troubleshooting

### "Command not found: scan-sensitive-files.sh"

```bash
chmod +x scripts/scan-sensitive-files.sh
./scripts/scan-sensitive-files.sh
```

### "Permission denied" on pre-commit hook

```bash
chmod +x .git/hooks/pre-commit
```

### Scan reports false positives

Edit the script and adjust regex patterns, or add file to ignore list.

### Need to commit despite warnings

```bash
# Emergency only - use with extreme caution
git commit --no-verify -m "Emergency fix"
```

---

**Maintained By:** Security Team  
**Last Updated:** November 17, 2025  
**Review Frequency:** Monthly
