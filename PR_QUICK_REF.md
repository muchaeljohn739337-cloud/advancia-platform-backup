# 🚀 PR Quick Reference Card

**Bookmark this! One-page guide for perfect PRs.**

---

## 🎯 Choose Your Template

```bash
# Standard PR (auto-loads)
Just create PR normally

# Bug Fix
?template=bug_fix.md

# Feature
?template=feature.md

# Hotfix
?template=hotfix.md
```

---

## 🌿 Branch Name Format

```
<type>/<issue>-<description>

Examples:
feat/234-add-crypto-wallet
fix/456-stripe-webhook
hotfix/789-payment-down
```

---

## 📝 Commit Message Format

```
<type>(<scope>): <subject>

Examples:
feat(auth): add 2FA support
fix(payments): resolve webhook timeout
perf(db): optimize user queries
```

### Types

`feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert` `hotfix`

---

## 🏷️ PR Title Format

```
<type>: <Clear description>

✅ feat: Add two-factor authentication
✅ fix: Resolve Stripe webhook timeout
❌ update files
❌ fix
```

---

## 🔗 Link Issues

**Close issues:**

```markdown
Closes #123
Fixes #456
Resolves #789
```

**Reference only:**

```markdown
Related to #123
Part of #456
```

---

## 🤖 Auto-Checks (Wait for ✅)

-   ✅ Linting
-   ✅ Type checking
-   ✅ Build verification
-   ✅ Tests
-   ✅ Security scan
-   ✅ Duplicate detection

---

## 🔀 Merge Strategy

| Use Case                  | Strategy   |
| ------------------------- | ---------- |
| Multiple WIP commits      | **Squash** |
| Clean single commit       | **Squash** |
| Feature with sub-features | **Merge**  |
| Hotfix                    | **Squash** |
| Linear history needed     | **Rebase** |

**Default: Squash and Merge** ⭐

---

## ✅ Pre-Submit Checklist

```markdown
- [ ] Tests pass (`npm test`)
- [ ] Builds succeed (`npm run build`)
- [ ] No hardcoded secrets
- [ ] Issues linked
- [ ] Documentation updated
- [ ] Reviewers assigned
- [ ] PR title follows format
```

---

## 🚨 Hotfix Fast Track

1. **Branch:** `hotfix/issue-description`
2. **Template:** `?template=hotfix.md`
3. **Title:** `hotfix: Critical issue description`
4. **Test:** Verify in staging
5. **Merge:** Immediate after 1 approval
6. **Deploy:** Use deployment guide
7. **Monitor:** Watch metrics for 1 hour
8. **Follow-up:** Create post-mortem issue

---

## 👥 Who Reviews What?

**Auto-assigned based on files:**

| Files Changed | Reviewer        |
| ------------- | --------------- |
| `backend/**`  | @backend-team   |
| `frontend/**` | @frontend-team  |
| `prisma/**`   | @database-admin |
| `auth.ts`     | @security-team  |

---

## 📏 PR Size Guide

| Label | Lines    | Ideal For               |
| ----- | -------- | ----------------------- |
| XS    | <10      | Docs, config            |
| S     | 10-100   | Bug fixes               |
| M     | 100-500  | Small features          |
| L     | 500-1000 | Large features          |
| XL    | 1000+    | Split into smaller PRs! |

**Target: Keep PRs under 500 lines** 🎯

---

## ⚡ Speed Up Reviews

1. **Clear description** - What & Why
2. **Link issues** - Use keywords
3. **Add screenshots** - For UI changes
4. **Complete checklist** - All boxes ticked
5. **Test thoroughly** - Provide test evidence
6. **Document changes** - Update README/docs
7. **Small focused PRs** - One concern per PR
8. **Responsive** - Address feedback quickly

---

## 🚫 Common Rejections

| Reason            | Fix                          |
| ----------------- | ---------------------------- |
| No tests          | Add unit/integration tests   |
| Build fails       | Run `npm run build` locally  |
| Hardcoded secrets | Move to .env                 |
| No description    | Fill out template completely |
| Too large         | Split into smaller PRs       |
| Merge conflicts   | Rebase on latest main        |
| Missing docs      | Update README/docs           |

---

## 📱 Quick Commands

```bash
# Create branch
git checkout -b feat/123-description

# Commit with format
git commit -m "feat(scope): description"

# Push and create PR
git push -u origin feat/123-description

# Update from main
git fetch origin
git rebase origin/main

# Run all checks locally
npm test && npm run build && npm run lint
```

---

## 🎨 Perfect PR Example (Short)

````markdown
## Description

Adds 2FA authentication using TOTP for enhanced security.

## Related Issues

Closes #234

## Testing

- [x] Unit tests (95% coverage)
- [x] Manual testing completed
- [x] Works on mobile and desktop

## Deployment

Add to .env:

```bash
TOTP_SECRET=<generate-with-crypto>
```
````

## Screenshots

[Before/After images]

```

---

## 🆘 Quick Help

| Issue | Solution |
|-------|----------|
| CI failing | Check logs in Actions tab |
| Merge conflicts | `git rebase origin/main` |
| Wrong template | Close and recreate with ?template= |
| Missing reviewer | Check CODEOWNERS file |
| Can't merge | Wait for approvals + green checks |

---

## 📚 Full Guide

**See: [PR_GUIDE.md](PR_GUIDE.md)**

---

**🎯 Remember:** Good PRs = Fast reviews = Happy team! 🚀
```
