# 🔒 Branch Protection - Quick Start

**Status:** Ready to Deploy  
**Last Updated:** November 17, 2025

---

## 🚀 Quick Setup (Choose One)

### Option 1: Automated Script (Fastest) ⚡

```powershell
# PowerShell (Windows)
$env:GITHUB_TOKEN = "your_github_token_here"
.\setup-branch-protection.ps1 -Branch main -Level standard
```

```bash
# Bash (Linux/Mac)
export GITHUB_TOKEN="your_github_token_here"
chmod +x setup-branch-protection.sh
./setup-branch-protection.sh main standard
```

### Option 2: GitHub Actions Workflow 🤖

1. Add `GH_ADMIN_PAT` secret to repository
2. Go to: **Actions → Setup Branch Protection → Run workflow**
3. Select branch and protection level
4. Click "Run workflow"

### Option 3: Manual Setup (UI) 👆

1. Go to: **Repository Settings → Branches**
2. Click: **Add branch protection rule**
3. Configure as per: [`BRANCH_PROTECTION_GUIDE.md`](BRANCH_PROTECTION_GUIDE.md)

---

## 📋 Files Created

| File                                            | Purpose                                     |
| ----------------------------------------------- | ------------------------------------------- |
| `.github/workflows/setup-branch-protection.yml` | Automated workflow to apply protection      |
| `.github/CODEOWNERS`                            | Define code ownership for automatic reviews |
| `BRANCH_PROTECTION_GUIDE.md`                    | Complete documentation and troubleshooting  |
| `setup-branch-protection.ps1`                   | PowerShell setup script                     |
| `setup-branch-protection.sh`                    | Bash setup script                           |

---

## 🎯 Protection Levels

### ⚪ Minimal

-   No required checks
-   No PR reviews
-   Allows force push
-   **Use for:** Development branches

### 🟡 Standard (Recommended)

-   Required checks: build, type-lint, CI
-   1 PR review required
-   No force push
-   **Use for:** Main production branch

### 🔴 Strict

-   Required checks: all tests
-   2 PR reviews + code owner
-   Enforce for admins
-   Linear history required
-   **Use for:** Critical systems

---

## ⚡ Quick Commands

```bash
# Test protection (should fail)
git push origin main
# Error: Protected branch update failed ✅

# Correct workflow
git checkout -b feature/test
git push origin feature/test
gh pr create --title "Test" --body "Testing protection"
gh pr merge --auto --squash
```

---

## 🔑 Get GitHub Token

1. Go to: <https://github.com/settings/tokens>
2. Click: **Generate new token (classic)**
3. Name: `Branch Protection Token`
4. Scopes: ✅ `repo`, ✅ `admin:repo_hook`
5. Click: **Generate token**
6. Copy token (you won't see it again!)

---

## 📚 Full Documentation

See [`BRANCH_PROTECTION_GUIDE.md`](BRANCH_PROTECTION_GUIDE.md) for:

-   Detailed setup instructions
-   Troubleshooting guide
-   CODEOWNERS configuration
-   Emergency bypass procedures
-   Testing and verification

---

## ✅ Verification

After setup, verify protection is active:

```bash
# Check via GitHub CLI
gh api repos/:owner/:repo/branches/main/protection | jq

# Check via UI
# Look for 🛡️ icon next to branch name on GitHub
```

---

## 🚨 Important Notes

-   ⚠️ **Never force push to protected branches**
-   ✅ **Always work in feature branches**
-   ✅ **Create PRs for all changes**
-   ✅ **Get required approvals before merging**
-   🔐 **Keep GitHub tokens secure** (never commit them!)

---

**Need Help?** See [BRANCH_PROTECTION_GUIDE.md](BRANCH_PROTECTION_GUIDE.md) or contact DevOps team.
