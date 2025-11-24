# 🚀 Perfect Pull Request Guide

**Complete guide to creating high-quality PRs in Advancia Pay**

---

## 📚 Table of Contents

1. [PR Template Selection](#pr-template-selection)
2. [Commit Message Standards](#commit-message-standards)
3. [Branch Naming Conventions](#branch-naming-conventions)
4. [PR Title Format](#pr-title-format)
5. [Linking Issues](#linking-issues)
6. [Automated Checks](#automated-checks)
7. [Review Process](#review-process)
8. [Merge Strategies](#merge-strategies)
9. [Perfect PR Examples](#perfect-pr-examples)
10. [Common Mistakes to Avoid](#common-mistakes-to-avoid)

---

## 🎯 PR Template Selection

We have 4 specialized templates:

### 1. Standard PR (Default)

**Use for:** Most changes, general improvements

```
Template: .github/pull_request_template.md (auto-loaded)
```

### 2. Bug Fix PR

**Use for:** Fixing bugs, addressing issues

```
Add to PR URL: ?template=bug_fix.md
Example: /compare/main...fix/auth-bug?template=bug_fix.md
```

### 3. Feature PR

**Use for:** New features, enhancements

```
Add to PR URL: ?template=feature.md
Example: /compare/main...feat/crypto-wallet?template=feature.md
```

### 4. Hotfix PR

**Use for:** Critical production fixes

```
Add to PR URL: ?template=hotfix.md
Example: /compare/main...hotfix/payment-crash?template=hotfix.md
```

---

## 📝 Commit Message Standards

We follow [Conventional Commits](https://www.conventionalcommits.org/) format:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

-   `feat`: New feature
-   `fix`: Bug fix
-   `docs`: Documentation changes
-   `style`: Code style/formatting (no logic change)
-   `refactor`: Code refactoring
-   `perf`: Performance improvements
-   `test`: Adding/updating tests
-   `build`: Build system changes
-   `ci`: CI/CD changes
-   `chore`: Maintenance tasks
-   `revert`: Reverting previous changes
-   `hotfix`: Critical production fix

### Examples

#### Good ✅

```bash
feat(auth): add 2FA support with TOTP

Implements two-factor authentication using time-based one-time passwords.
Users can enable 2FA in settings and must verify with authenticator app.

Closes #234
```

```bash
fix(payments): resolve Stripe webhook signature validation

The webhook signature was failing due to incorrect timestamp comparison.
Changed to use Stripe's built-in validation method.

Fixes #456
```

```bash
perf(database): optimize user query with indexed search

Added composite index on (email, subscriptionStatus) to improve
login query performance by 80%.

Before: 450ms average
After: 90ms average
```

#### Bad ❌

```bash
# Too vague
update code

# No type
Added new feature for users

# All caps
FIX BUG IN LOGIN

# Not descriptive
fix stuff
```

---

## 🌿 Branch Naming Conventions

### Format

```
<type>/<issue-number>-<brief-description>
```

### Examples

```bash
feat/234-add-2fa-authentication
fix/456-stripe-webhook-validation
hotfix/789-payment-processor-down
docs/update-api-documentation
refactor/cleanup-auth-middleware
test/add-payment-integration-tests
chore/upgrade-dependencies
```

### Branch Prefixes

| Prefix      | Purpose          | Example                   |
| ----------- | ---------------- | ------------------------- |
| `feat/`     | New features     | `feat/123-crypto-wallet`  |
| `fix/`      | Bug fixes        | `fix/456-login-error`     |
| `hotfix/`   | Critical fixes   | `hotfix/789-payment-down` |
| `docs/`     | Documentation    | `docs/update-readme`      |
| `refactor/` | Code refactoring | `refactor/auth-service`   |
| `test/`     | Tests            | `test/payment-flows`      |
| `chore/`    | Maintenance      | `chore/update-deps`       |
| `release/`  | Release prep     | `release/v1.2.0`          |

---

## 🏷️ PR Title Format

### Standard Format

```
<type>: <Clear description starting with capital>
```

### Examples

#### Excellent ✅

```
feat: Add two-factor authentication support
fix: Resolve Stripe webhook signature validation error
perf: Optimize database queries with composite indexes
docs: Update API authentication documentation
```

#### Poor ❌

```
Update files
fix
Added stuff
FIXED BUG
```

### Auto-validation

Our CI checks PR titles using semantic-pr action. Invalid titles will fail checks.

---

## 🔗 Linking Issues

### GitHub Keywords

Use these keywords to automatically close issues:

#### Close Issue

```markdown
Closes #123
Fixes #456
Resolves #789
```

#### Reference Issue (without closing)

```markdown
Related to #123
Part of #456
Addresses #789
See #101
```

### Multiple Issues

```markdown
Closes #123, #456
Fixes #789 and resolves #101
```

### Cross-Repository

```markdown
Fixes owner/repo#123
```

### Example PR Description

```markdown
## Description

Implements two-factor authentication using TOTP.

## Related Issues

Closes #234
Addresses #189
Part of #156
```

---

## 🤖 Automated Checks

### What Runs Automatically

#### 1. Auto-Labeling

-   **File-based:** Labels added based on changed files
-   **Size-based:** `size/xs`, `size/s`, `size/m`, `size/l`, `size/xl`
-   **Branch-based:** Labels from branch name prefix

#### 2. Auto-Assignment

-   **CODEOWNERS:** Reviewers auto-assigned based on files
-   **Team-based:** Backend/frontend teams assigned automatically

#### 3. Quality Checks

-   ✅ Linting (ESLint)
-   ✅ Type checking (TypeScript)
-   ✅ Build verification
-   ✅ Test execution
-   ✅ Security scanning

#### 4. Duplicate Detection

-   Checks for duplicate PRs from same branch
-   Adds `duplicate` label if found

#### 5. PR Title Validation

-   Enforces Conventional Commits format
-   Must start with valid type
-   Subject must be capitalized

### Check Status

View checks at bottom of PR:

```
✅ All checks passed - Ready to merge
❌ Some checks failed - Review required
🟡 Checks pending - Wait for completion
```

---

## 👥 Review Process

### 1. Request Reviews

**Auto-assigned based on:**

-   CODEOWNERS file
-   Changed files
-   Team membership

**Manual requests:**

```
Click "Reviewers" → Select team or individual
```

### 2. Review Requirements

| Branch    | Required Approvals | Who Can Approve       |
| --------- | ------------------ | --------------------- |
| `main`    | 1                  | Any team member       |
| `staging` | 1                  | Backend/Frontend lead |
| `develop` | Optional           | Any developer         |

### 3. Addressing Feedback

```markdown
## Reviewer Comment:

"This function needs error handling"

## Your Response:

✅ Added try-catch block with proper error logging (commit abc123)
```

### 4. Re-requesting Review

After addressing feedback:

```
Click ⟲ next to reviewer name to re-request review
```

---

## 🔀 Merge Strategies

### Available Options

#### 1. Merge Commit (Default)

```bash
✅ Use for: Feature branches, release branches
✅ Preserves: Complete commit history
❌ Avoid for: Single-commit PRs, hotfixes
```

**Result:**

```
* Merge pull request #123 from feat/new-feature
|\
| * feat: Add feature X
| * fix: Address review feedback
|/
* Previous commit
```

#### 2. Squash and Merge

```bash
✅ Use for: Multiple small commits, work-in-progress commits
✅ Preserves: Clean linear history
✅ Best for: Most PRs
```

**Result:**

```
* feat: Add feature X (#123)
* Previous commit
```

#### 3. Rebase and Merge

```bash
✅ Use for: Linear history preference
✅ Preserves: Individual commits
❌ Avoid for: Merge conflicts, complex history
```

**Result:**

```
* fix: Address review feedback
* feat: Add feature X
* Previous commit
```

### When to Use Each

| Scenario                   | Strategy   | Reason             |
| -------------------------- | ---------- | ------------------ |
| Multiple WIP commits       | **Squash** | Clean history      |
| Single logical commit      | **Squash** | Simplest           |
| Feature with sub-features  | **Merge**  | Preserve structure |
| Hotfix                     | **Squash** | Quick clean merge  |
| Multiple distinct changes  | **Merge**  | Keep separation    |
| Linear history requirement | **Rebase** | No merge commits   |

### Configure in `.github/settings.yml`

```yaml
merge:
  allow_merge_commit: true
  allow_squash_merge: true
  allow_rebase_merge: true
  default_merge_method: squash
```

---

## ✨ Perfect PR Examples

### Example 1: Feature PR

#### Branch Name

```
feat/234-add-crypto-wallet
```

#### Commit History

```bash
feat(wallet): add BTC wallet generation
feat(wallet): add ETH wallet support
feat(wallet): implement wallet encryption
test(wallet): add wallet generation tests
docs(wallet): update wallet API documentation
```

#### PR Title

```
feat: Add cryptocurrency wallet generation (BTC, ETH, USDT)
```

#### PR Description

````markdown
## Description

Implements custodial cryptocurrency wallet generation using BIP-44 standard.
Users can generate BTC, ETH, and USDT wallets with encrypted private key storage.

## Related Issues

Closes #234
Addresses #189 (wallet security requirements)

## Type of Change

- [x] ✨ New feature
- [ ] 🐛 Bug fix
- [ ] 📝 Documentation

## Testing

- [x] Unit tests (95% coverage)
- [x] Integration tests
- [x] Manual testing completed

### Test Scenarios

1. Generate BTC wallet → Success (address format validated)
2. Generate ETH wallet → Success (checksum validated)
3. Encrypt private keys → Success (AES-256-GCM)
4. Decrypt for transactions → Success (correct decryption)

## Security

- [x] Private keys encrypted at rest (AES-256-GCM)
- [x] BIP-44 derivation paths implemented
- [x] Rate limiting added (5 wallets per hour)
- [x] Audit logging enabled

## Documentation

- [x] API endpoints documented
- [x] Code comments added
- [x] README updated

## Deployment

### Environment Variables

```bash
WALLET_ENCRYPTION_KEY=<64-char-hex>  # Add to .env
```
````

### Database Migration

```bash
npx prisma migrate dev --name add_crypto_wallets
```

## Screenshots

[Screenshot of wallet generation UI]

## Performance

-   Wallet generation: ~200ms average
-   No impact on existing endpoints

## Rollback Plan

Feature can be disabled with:

```bash
CRYPTO_WALLET_ENABLED=false
```

```

#### Result
- ✅ Clear description
- ✅ All checklist items completed
- ✅ Issues linked with keywords
- ✅ Tests documented
- ✅ Security reviewed
- ✅ Deployment steps clear
- ✅ Screenshots included

---

### Example 2: Bug Fix PR

#### Branch Name
```

fix/456-stripe-webhook-timeout

````

#### Commits
```bash
fix(payments): increase Stripe webhook timeout to 30s
test(payments): add webhook timeout test case
````

#### PR Title

```
fix: Resolve Stripe webhook timeout causing failed payments
```

#### PR Description

````markdown
## Bug Description

Stripe webhook handlers were timing out after 10 seconds, causing
payment confirmations to fail even though payments succeeded.

### Impact

- 12% of payments affected (last 24 hours)
- ~$2,400 in stuck transactions
- 47 support tickets

## Root Cause

Webhook handler included slow database queries and external API calls:

1. User lookup query (5s)
2. Blockchain confirmation check (8s)
3. Notification service call (3s)
   Total: ~16s > 10s timeout

## Solution

1. Increased timeout to 30s
2. Moved blockchain check to background job
3. Optimized user query with index

## Related Issues

Fixes #456
Related to #123 (webhook monitoring)

## Testing

### Before Fix

```bash
# Reproduction
1. Make $100 payment
2. Webhook received
3. After 10s → Timeout error
4. Payment marked as "pending" incorrectly
```
````

### After Fix

```bash
# Verification
1. Make $100 payment
2. Webhook received
3. Completes in ~8s
4. Payment marked "completed" correctly
```

### Test Cases Added

-   [x] Webhook timeout handling
-   [x] Background job execution
-   [x] Database query performance

## Performance Impact

-   Webhook processing: 16s → 8s (50% improvement)
-   Database query: 5s → 0.5s (indexed)

## Rollback Plan

```bash
# Revert commit
git revert abc123

# Redeploy
npm run build && pm2 restart advancia-backend
```

## Monitoring

Watch these metrics for 24 hours:

-   Webhook success rate (target: >98%)
-   Payment confirmation time (target: <10s)
-   Database query time (target: <1s)

```

---

### Example 3: Hotfix PR

#### Branch Name
```

hotfix/789-payment-processor-down

````

#### Commits
```bash
hotfix(payments): fallback to backup payment gateway
````

#### PR Title

```
hotfix: Enable backup payment gateway after primary failure
```

#### PR Description

````markdown
## 🚨 CRITICAL ISSUE

Primary payment gateway (Stripe) experiencing 100% failure rate.
All payment attempts returning 500 errors.

### Impact

- **Production DOWN** for payments
- All users affected (estimate: 1000+ active)
- Revenue loss: ~$500/hour
- Started: 2024-11-20 14:30 UTC
- Duration: 45 minutes

## Solution

Implemented automatic failover to backup gateway (Square) when
Stripe returns consecutive errors.

### Changes

1. Added circuit breaker pattern (3 failures → switch)
2. Fallback to Square API
3. Alert sent to #payments-alerts

## Testing

✅ Tested with production snapshot database
✅ Verified Square API credentials
✅ Confirmed payment flow end-to-end
✅ Rollback tested (takes 2 minutes)

## Deployment

### IMMEDIATE STEPS

```bash
1. Deploy: git pull && npm run build && pm2 restart
2. Verify: curl https://api.advancia.com/health
3. Monitor: watch -n 5 'curl https://api.advancia.com/api/payments/health'
```
````

### Rollback (if needed)

```bash
git revert abc123
npm run build && pm2 restart
```

## Monitoring

Watch for 1 hour:

-   Payment success rate: target >95%
-   Gateway response time: target <3s
-   Error rate: target <1%

## Follow-up Tasks

-   [ ] Post-mortem (#790)
-   [ ] Improve monitoring (#791)
-   [ ] Add redundancy tests (#792)

## Communication

-   [x] Engineering team notified
-   [x] Product team notified
-   [x] Support team notified
-   [ ] Customer email (if >2 hour outage)

Incident channel: #incident-2024-11-20

````

---

## ⚠️ Common Mistakes to Avoid

### 1. Vague Descriptions
❌ Bad:
```markdown
## Description
Updated some files
````

✅ Good:

```markdown
## Description

Refactored authentication middleware to use dependency injection,
improving testability and reducing coupling with database layer.
```

### 2. Missing Issue Links

❌ Bad:

```markdown
Fixes the login bug
```

✅ Good:

```markdown
Fixes #456 - Login fails with 2FA enabled
```

### 3. Incomplete Testing

❌ Bad:

```markdown
- [ ] Tests added
```

✅ Good:

```markdown
- [x] Unit tests (94% coverage)
- [x] Integration tests (login flow)
- [x] Manual testing scenarios:
  1. Login with 2FA → Success
  2. Login without 2FA → Success
  3. Invalid 2FA code → Error displayed
```

### 4. No Deployment Steps

❌ Bad:

```markdown
Ready to deploy
```

✅ Good:

```markdown
## Deployment

1. Run migration: `npx prisma migrate deploy`
2. Add env var: `NEW_FEATURE_ENABLED=true`
3. Restart backend: `pm2 restart advancia-backend`
4. Verify health: `curl /api/health`
```

### 5. Large Unfocused PRs

❌ Bad:

```
Changed files: 87
+4,523 −2,891

Adds feature X, fixes bugs Y and Z, refactors service A,
updates dependencies, changes styling...
```

✅ Good:

```
Changed files: 12
+456 −123

Implements feature X with tests and documentation
```

**Tip:** Break large PRs into smaller, focused ones:

-   PR #1: Add feature X
-   PR #2: Fix related bug Y
-   PR #3: Update documentation

### 6. Mixing Concerns

❌ Bad:

```bash
feat: Add crypto wallet + Fix auth bug + Update dependencies
```

✅ Good:

```bash
# Separate PRs
PR #1: feat: Add cryptocurrency wallet generation
PR #2: fix: Resolve authentication timeout issue
PR #3: chore: Update dependencies to latest versions
```

### 7. No Screenshots for UI Changes

❌ Bad:

```markdown
Updated the dashboard UI
```

✅ Good:

```markdown
## Screenshots

### Before

![Old dashboard](before.png)

### After

![New dashboard](after.png)
```

### 8. Ignoring Review Feedback

❌ Bad:

```markdown
Reviewer: "This needs error handling"
[No response, force-merged]
```

✅ Good:

```markdown
Reviewer: "This needs error handling"
Author: "✅ Added try-catch block in commit abc123"
[Re-requested review]
```

---

## 📋 Pre-Submission Checklist

Before creating your PR:

```markdown
- [ ] Branch follows naming convention
- [ ] Commits follow Conventional Commits format
- [ ] PR title is clear and descriptive
- [ ] Description is complete
- [ ] Issues linked with keywords
- [ ] All tests pass locally
- [ ] Backend builds successfully
- [ ] Frontend builds successfully
- [ ] Production check passes
- [ ] Documentation updated
- [ ] Security reviewed
- [ ] Deployment steps documented
- [ ] Reviewers assigned
- [ ] Labels applied
```

---

## 🎓 Additional Resources

-   [Conventional Commits](https://www.conventionalcommits.org/)
-   [GitHub PR Documentation](https://docs.github.com/en/pull-requests)
-   [Code Review Best Practices](../docs/CODE_REVIEW.md)
-   [Git Workflow Guide](../docs/GIT_WORKFLOW.md)
-   [CODEOWNERS Guide](../docs/CODEOWNERS.md)

---

## 🆘 Need Help?

-   💬 Ask in Slack: #dev-help
-   📧 Email: <dev-team@advancia.com>
-   📚 Wiki: <https://wiki.advancia.com/pr-guide>

---

**Remember:** A perfect PR is not about perfection, it's about clear communication,
thorough testing, and making your reviewer's job easier. 🚀
