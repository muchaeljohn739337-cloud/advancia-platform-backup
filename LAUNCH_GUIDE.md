# Quick Launch Guide - Advancia Pay Production Deployment

**Status:** ✅ Ready for Launch
**Date:** December 2024

## 🎯 Pre-Launch Status

### ✅ Completed Tasks

-   [x] Script audit (243 scripts validated)
-   [x] Database migrations applied (65 tables)
-   [x] Backup/restore validation (PASS)
-   [x] Admin routes enabled in `index.ts`
-   [x] Wallet routes enabled
-   [x] Cryptomus routes enabled
-   [x] Socket.IO injections enabled (notifications, transactions, admin, tokens, support, payments, withdrawals)
-   [x] Node engine mismatch resolved (>=20.0.0)
-   [x] Frontend configured for local API
-   [x] Production secrets generated
-   [x] Dependencies installed (backend + frontend)

### 🔄 Pending Tasks (Pre-Production)

-   [ ] Load secrets into Render dashboard
-   [ ] Load secrets into Vercel dashboard
-   [ ] Generate BIP39 24-word mnemonic for wallet master seed
-   [ ] Configure Stripe live mode webhook
-   [ ] Test payment flows (Stripe + Cryptomus)
-   [ ] Switch to Stripe live keys
-   [ ] DNS verification (Cloudflare)
-   [ ] SSL certificate validation
-   [ ] Load testing (optional but recommended)

---

## 🚀 Local Development Quick Start

### Start Development Environment

```powershell
# Option 1: Automated launch (recommended)
pwsh -ExecutionPolicy Bypass -File scripts/launch-dev.ps1

# Option 2: Manual startup
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Access Points

-   **Frontend:** <http://localhost:3000>
-   **Backend API:** <http://localhost:4000>
-   **API Health:** <http://localhost:4000/health>
-   **Prisma Studio:** `cd backend && npx prisma studio` → <http://localhost:5555>

---

## 📦 Production Deployment Steps

### Step 1: Configure Secrets (15 minutes)

**See:** `PRODUCTION_SECRETS_GUIDE.md`

1. **Render (Backend)**
   -   Login to [Render Dashboard](https://dashboard.render.com)
   -   Navigate to backend service → Environment tab
   -   Add all backend secrets from generated list
   -   Click Save Changes (auto-deploys)

2. **Vercel (Frontend)**
   -   Login to [Vercel Dashboard](https://vercel.com/dashboard)
   -   Navigate to frontend project → Settings → Environment Variables
   -   Add frontend secrets (`NEXT_PUBLIC_*`, `NEXTAUTH_SECRET`)
   -   Redeploy

### Step 2: Generate Wallet Master Seed (5 minutes)

⚠️ **CRITICAL SECURITY STEP**

1. Go to <https://iancoleman.io/bip39/> (preferably offline)
2. Select **24 words** entropy
3. Generate mnemonic phrase
4. **Write on paper** and store in physical safe
5. Copy to password manager (1Password/LastPass)
6. Add to Render environment:

```env
WALLET_MASTER_SEED=word1 word2 word3 ... word24
```

### Step 3: Configure Stripe Live Mode (10 minutes)

1. Switch Stripe dashboard to **Live Mode**
2. Copy live API keys:
   -   Backend: `STRIPE_SECRET_KEY=sk_live_xxxxx`
   -   Frontend: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx`
3. Create live webhook:
   -   URL: `https://api.advancia.com/api/payments/webhook`
   -   Events: `payment_intent.succeeded`, `payment_intent.failed`
   -   Copy: `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`
4. Update Render + Vercel environment variables

### Step 4: DNS & SSL Verification (5 minutes)

```powershell
# Verify DNS records
nslookup advancia.com
nslookup api.advancia.com

# Test SSL certificates
curl -I https://advancia.com
curl -I https://api.advancia.com

# Check Cloudflare SSL mode
# Should be: Full (strict) or Full
```

### Step 5: Smoke Testing (15 minutes)

```bash
# Test health endpoints
curl https://api.advancia.com/health
# Expected: {"status":"ok","timestamp":"..."}

# Test authentication
curl -X POST https://api.advancia.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Test Stripe webhook delivery
# In Stripe dashboard → Webhooks → Send test webhook
# Verify in backend logs (Render dashboard)

# Test frontend
# Open https://advancia.com in browser
# Navigate through: Login → Dashboard → Payments
```

---

## 🧪 Testing Checklist

### Authentication Flow

-   [ ] Email/password login
-   [ ] OTP verification email received
-   [ ] JWT token refresh works
-   [ ] 2FA setup and validation
-   [ ] Password reset flow

### Payment Flows

-   [ ] Stripe test payment succeeds
-   [ ] Stripe webhook updates transaction status
-   [ ] Cryptomus crypto invoice created
-   [ ] Crypto payment confirmation received
-   [ ] Transaction history accurate

### Admin Functions

-   [ ] Admin login works
-   [ ] User management accessible
-   [ ] Analytics dashboard loads
-   [ ] Admin wallet operations (if applicable)
-   [ ] System alerts functional

### Real-time Features

-   [ ] Socket.IO connection established
-   [ ] Notifications received in real-time
-   [ ] Transaction updates push to frontend
-   [ ] Support chat messages delivered

---

## 📊 Monitoring Setup

### Sentry Error Tracking

1. Verify Sentry DSN in Render/Vercel
2. Test error capture:

```javascript
// In browser console
throw new Error("Test Sentry integration");
```

1. Confirm error appears in Sentry dashboard

### Production Monitoring

```powershell
# Automated monitoring script
pwsh -File scripts/monitor-production.ps1

# Manual health check
curl https://api.advancia.com/health
```

---

## 🔥 Troubleshooting

### Backend Won't Start

```bash
# Check Render logs
# Dashboard → Service → Logs tab

# Common issues:
# 1. Missing DATABASE_URL → Check Render environment
# 2. Port binding error → Render uses PORT env var
# 3. Migration failures → Run `npm run migrate:deploy` manually
```

### Frontend 500 Errors

```bash
# Check Vercel logs
# Dashboard → Project → Deployments → View Function Logs

# Common issues:
# 1. NEXT_PUBLIC_API_URL wrong → Check Vercel env vars
# 2. NEXTAUTH_SECRET missing → Add to Vercel
# 3. Build failures → Check build logs in deployment
```

### Database Connection Issues

```bash
# Test connection from Render Shell
psql $DATABASE_URL -c "SELECT NOW();"

# Verify Prisma schema
npx prisma db pull
npx prisma validate
```

### Payment Webhook Failures

```bash
# Verify webhook signature
# In Stripe dashboard → Webhooks → View attempts
# Look for signature verification errors

# Check Render logs for webhook handler
# Search for: "Stripe webhook received"
```

---

## 📈 Performance Optimization (Post-Launch)

### Database Indexing

```sql
-- Run after first week of production data
-- See: DATABASE_INDEXES_MIGRATION.md
CREATE INDEX idx_transactions_user_created ON transactions(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action, created_at DESC);
```

### CDN Configuration

-   Enable Cloudflare caching for static assets
-   Set cache TTL: 1 hour for API, 1 week for static
-   Configure Page Rules for `/api/*` (bypass cache)

### Load Balancing (If Scaling Needed)

-   Render auto-scales horizontally
-   Consider Redis for session storage (already configured)
-   Enable database read replicas if read-heavy

---

## 🎉 Launch Day Checklist

### T-24 Hours

-   [ ] All secrets loaded and verified
-   [ ] Backup/restore tested on production DB
-   [ ] DNS propagation complete
-   [ ] SSL certificates valid
-   [ ] Monitoring dashboards configured

### T-1 Hour

-   [ ] Final smoke tests pass
-   [ ] Team notified of launch window
-   [ ] Support channels ready (email, chat)
-   [ ] Rollback plan documented

### T-0 (Launch)

-   [ ] Switch DNS to production servers
-   [ ] Monitor error rates (Sentry)
-   [ ] Watch server metrics (Render dashboard)
-   [ ] Test first real transaction
-   [ ] Send launch announcement

### T+1 Hour

-   [ ] User registrations working
-   [ ] Payment processing normal
-   [ ] No critical errors in Sentry
-   [ ] Response times acceptable (<500ms p95)

### T+24 Hours

-   [ ] Review error logs
-   [ ] Check database performance
-   [ ] User feedback collected
-   [ ] Plan first hotfix if needed

---

## 🔗 Essential Links

-   **Render Dashboard:** <https://dashboard.render.com>
-   **Vercel Dashboard:** <https://vercel.com/dashboard>
-   **Stripe Dashboard:** <https://dashboard.stripe.com>
-   **Sentry Dashboard:** <https://sentry.io>
-   **Cloudflare Dashboard:** <https://dash.cloudflare.com>
-   **Cryptomus Dashboard:** <https://app.cryptomus.com>
-   **Production Site:** <https://advancia.com>
-   **API Endpoint:** <https://api.advancia.com>

---

## 📞 Emergency Contacts

### Critical Issue Response

1. Check Sentry for error traces
2. Review Render logs for backend issues
3. Check Vercel logs for frontend issues
4. Rollback via Render/Vercel dashboard if needed
5. Notify team in #incidents Slack channel

### Rollback Procedure

```bash
# Render (Backend)
# Dashboard → Service → Deployments → Select previous deploy → Rollback

# Vercel (Frontend)
# Dashboard → Project → Deployments → Select previous → Promote to Production

# Database (if migration issue)
cd backend
npx prisma migrate resolve --rolled-back <migration_name>
```

---

**Last Updated:** December 2024
**Next Review:** Pre-launch final check
**Status:** ✅ READY FOR PRODUCTION DEPLOYMENT
