# Security Incident Remediation - Action Plan

**Status**: 🟡 In Progress  
**Generated**: 2025-01-17  
**Incident ID**: SEC-2025-01-17-001

---

## ✅ Phase 1: Detection & Documentation (COMPLETE)

-   [x] Identified exposed secrets in `fix-env.sh`, `SYSTEMATIC_FIX_GUIDE.md`, `setup-docker-registry.ps1`
-   [x] Created comprehensive security audit: `SECURITY_AUDIT_2025-11-17.md`
-   [x] Sanitized files with placeholders
-   [x] Created `SECRET_MANAGEMENT_GUIDE.md`
-   [x] Implemented branch protection system
-   [x] Created sensitive file scanning tools

---

## ✅ Phase 2: Secret Generation (COMPLETE)

-   [x] Generated new `JWT_SECRET` (64 bytes, base64)
-   [x] Generated new `SESSION_SECRET` (64 bytes, base64)
-   [x] Generated new `NEXTAUTH_SECRET` (32 bytes, hex)
-   [x] Generated new `API_KEY` (32 bytes, hex)
-   [x] Created `.env.NEW` templates with rotated secrets

---

## 🔴 Phase 3: Credential Revocation (URGENT - DO NOW!)

### Step 3.1: Revoke Stripe Keys

```text
1. Open: https://dashboard.stripe.com/test/apikeys
2. Find key: sk_test_51SCXq1CnLcSzsQoTXqbzLwgmT6Mbb8Fj2ZEngSnjmwnm2P0iZGZKq2oYHWHwKAgAGRLs3qm0FUacfQ06oL6jvZYf00j1763pTI
3. Click "Delete" or "Roll Key"
4. Generate new secret key
5. Copy new keys to backend/.env.NEW (replace placeholders)
6. Copy new publishable key to frontend/.env.NEW
```

### Step 3.2: Revoke GitHub Token

```text
1. Open: https://github.com/settings/tokens
2. Find token: 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
3. Click "Delete"
4. Generate new PAT with same scopes: repo, workflow, write:packages
5. Update scripts/setup-docker-registry.ps1 (use secure prompt)
```

### Step 3.3: Rotate Database Password

```
1. Connect to DigitalOcean Managed PostgreSQL
2. Generate new password: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
3. Update password in database console
4. Update DATABASE_URL in backend/.env.NEW
```

**⏰ Estimated Time**: 15 minutes  
**⚠️ Impact**: Old tokens/keys will stop working immediately

---

## 🟡 Phase 4: Environment Updates (HIGH PRIORITY)

### Step 4.1: Update Local Environments

```powershell
# Backend
cd backend
Copy-Item .env .env.OLD
Copy-Item .env.NEW .env
# Edit .env and fill remaining placeholders (Stripe, DB password)

# Frontend
cd ../frontend
Copy-Item .env.local .env.local.OLD -ErrorAction SilentlyContinue
Copy-Item .env.NEW .env.local
# Edit .env.local and fill Stripe publishable key
```

### Step 4.2: Update GitHub Secrets

```text
1. Open: https://github.com/muchaeljohn739337-cloud/-modular-saas-platform/settings/secrets/actions
2. Update these secrets:
   - JWT_SECRET → tG3DgbZdj1BxjSCAOsmqy0BmSyx2gqcse5sSaR4Nna+MStuX8nIRZ4C/B5GiHY7E4ilVGbOhZMy5WdC5/oOcug==
   - SESSION_SECRET → Cpe6uK6WEgaClVewmn2qGlk9ISGNkXIVObUPzNTjKUgehHv4WsSU1udWnCMgygj9ikKhCl4t47iQR1dCtPk2+g==
   - NEXTAUTH_SECRET → 7e17d53349d43194df57ef4f8afe72f492436195d9b664ffb3088479690070d0
   - API_KEY → 1f28d952b06a431d34c29b874132629f3dfd9c4e3f3244ac2b63f125d8636fe5
   - STRIPE_SECRET_KEY → (new key from Step 3.1)
   - DATABASE_URL → (new URL from Step 3.3)
```

### Step 4.3: Update Production Environment

```bash
# SSH to DigitalOcean Droplet
ssh root@your-server-ip

# Update .env files
cd /var/www/advancia-pay-ledger/backend
nano .env  # Update JWT_SECRET, SESSION_SECRET, STRIPE_SECRET_KEY, DATABASE_URL

cd ../frontend
nano .env.production  # Update NEXTAUTH_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Restart services
pm2 restart all
pm2 save
```

**⏰ Estimated Time**: 20 minutes  
**⚠️ Impact**: Users will be logged out, need to re-authenticate

---

## 🟢 Phase 5: Testing & Verification (MEDIUM PRIORITY)

### Step 5.1: Test Backend

```powershell
cd backend
npm run dev
```

**Verify**:

-   Server starts on port 4000
-   Database connection successful
-   JWT token generation works
-   Stripe integration functional

### Step 5.2: Test Frontend

```powershell
cd frontend
npm run dev
```

**Verify**:

-   App loads on <http://localhost:3000>
-   Login/signup works with new JWT secrets
-   Stripe payment flow functional
-   Socket.IO connects

### Step 5.3: Test API Endpoints

```powershell
# Test health check
curl http://localhost:4000/health

# Test authentication
curl -X POST http://localhost:4000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"test123"}'
```

**⏰ Estimated Time**: 30 minutes

---

## 🟡 Phase 6: Git History Cleanup (MEDIUM PRIORITY)

### Step 6.1: Backup Current State

```powershell
git clone --mirror https://github.com/muchaeljohn739337-cloud/-modular-saas-platform.git backup-repo
cd backup-repo
git bundle create ../repo-backup-2025-01-17.bundle --all
cd ..
```

### Step 6.2: Clean History with BFG

```powershell
# Install BFG (if not installed)
choco install bfg-repo-cleaner  # or download from https://rtyley.github.io/bfg-repo-cleaner/

# Create secrets file
@"
sk_test_51SCXq1CnLcSzsQoTXqbzLwgmT6Mbb8Fj2ZEngSnjmwnm2P0iZGZKq2oYHWHwKAgAGRLs3qm0FUacfQ06oL6jvZYf00j1763pTI
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
4X382w30rRZlhrbS+BIktNJ3+Cn0zDZG3gN2ku5ttugHu2pjeQJKtmF9SLwRxDPUoF9Ph9kbQfSYlaK6Yg8kNg==
Wumg3AcgUwDbTDTRz+SWWpvus1zZ8QamJzvB6R6OJrtGcGS4kwpy/HRbqXJG3IeZl13AB7FcX7ak8KkYTNJhIA==
AdvanciaSecure2025!
"@ | Out-File -FilePath secrets.txt -Encoding UTF8

# Clean repository
bfg --replace-text secrets.txt -modular-saas-platform
cd -modular-saas-platform
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Step 6.3: Force Push Cleaned History

```powershell
# ⚠️ COORDINATE WITH TEAM BEFORE DOING THIS!
git push origin --force --all
git push origin --force --tags
```

**⏰ Estimated Time**: 45 minutes  
**⚠️ Impact**: All team members must re-clone repository

---

## 🟢 Phase 7: Documentation & Monitoring (LOW PRIORITY)

### Step 7.1: Update Documentation

-   [x] Update `SECURITY_AUDIT_2025-11-17.md` with completion status
-   [ ] Update `README.md` with new security measures
-   [ ] Add incident to `CHANGELOG.md`

### Step 7.2: Enable GitHub Security Features

```text
1. Go to: https://github.com/muchaeljohn739337-cloud/-modular-saas-platform/settings/security_analysis
2. Enable:
   - Dependabot alerts
   - Secret scanning
   - Code scanning (CodeQL)
3. Configure alerts to notify @security-team
```

### Step 7.3: Team Communication

```
Send notification to team:
- Subject: [URGENT] Security Incident - Action Required
- Details: JWT/SESSION secrets rotated, users must re-login
- Action: Pull latest changes, update local .env files
- Timeline: Git history cleanup scheduled for [DATE]
```

**⏰ Estimated Time**: 30 minutes

---

## 📊 Progress Tracker

| Phase            | Status      | Time Estimate | Actual Time | Blocker |
| ---------------- | ----------- | ------------- | ----------- | ------- |
| 1. Detection     | ✅ Complete | 2h            | 2h          | None    |
| 2. Generation    | ✅ Complete | 15m           | 15m         | None    |
| 3. Revocation    | 🔴 Pending  | 15m           | -           | None    |
| 4. Updates       | 🟡 Pending  | 20m           | -           | Phase 3 |
| 5. Testing       | 🟢 Pending  | 30m           | -           | Phase 4 |
| 6. Cleanup       | 🟡 Pending  | 45m           | -           | Phase 5 |
| 7. Documentation | 🟢 Pending  | 30m           | -           | Phase 6 |

**Total Estimated Time**: ~4 hours  
**Critical Path**: Phases 3 → 4 → 5 (must be sequential)

---

## 🆘 Emergency Rollback

If issues occur after updating secrets:

```powershell
# Restore old .env files
cd backend
Copy-Item .env.OLD .env

cd ../frontend
Copy-Item .env.local.OLD .env.local

# Restart services
npm run dev  # in both backend/ and frontend/
```

**Note**: Old secrets are compromised, rollback is temporary only!

---

## 📞 Support Contacts

-   **Security Team**: <security@advancia.com>
-   **DevOps**: <devops@advancia.com>
-   **On-Call**: +1-XXX-XXX-XXXX

---

## 🔐 Post-Incident Review

Schedule meeting to discuss:

1. Root cause analysis
2. Process improvements
3. Training needs
4. Monitoring enhancements
