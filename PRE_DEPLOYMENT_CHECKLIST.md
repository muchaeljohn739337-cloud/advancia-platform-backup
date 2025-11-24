# Pre-Deployment Checklist for Advancia Pay

## 🔐 Security & Secrets

### Environment Variables

-   [ ] All secrets generated using cryptographically secure methods
-   [ ] No test/dev values in production `.env`
-   [ ] Stripe keys are **LIVE** keys (sk*live*..., whsec*live*...)
-   [ ] JWT secrets are at least 32 characters
-   [ ] Wallet encryption keys are 32 bytes (64 hex chars)
-   [ ] Admin wallet addresses verified and correct
-   [ ] Database URL includes `sslmode=require`
-   [ ] All secrets stored in password manager

### Run Environment Validation

```bash
cd backend
npx ts-node scripts/verify-env.ts
```

**Expected**: `✅ VALIDATION PASSED - Safe to deploy`

---

## 🗄️ Database

### Schema & Migrations

-   [ ] All Prisma migrations applied

```bash
cd backend
npx prisma migrate status
```

**Expected**: `Database schema is up to date!`

-   [ ] No pending schema changes

```bash
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma
```

**Expected**: No differences

### Performance Indexes

-   [ ] Indexes added for frequently queried fields
-   [ ] Composite indexes for common query patterns

```sql
-- Verify indexes exist
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('users', 'transactions', 'crypto_withdrawals')
ORDER BY tablename, indexname;
```

### Backup Verification

-   [ ] Latest automated backup exists (check Digital Ocean Spaces)
-   [ ] Manual backup created before deployment

```bash
npm run db:backup
```

-   [ ] Backup restoration tested successfully

```bash
npm run db:restore -- backup-test.sql
```

---

## 🔨 Build & Tests

### Backend

-   [ ] TypeScript compiles without errors

```bash
cd backend
npm run build
```

-   [ ] All tests passing

```bash
npm test
```

-   [ ] No linting errors

```bash
npm run lint
```

-   [ ] Security test suite passes

```bash
npm test -- security.test.ts
```

### Frontend

-   [ ] Next.js builds successfully

```bash
cd frontend
npm run build
```

-   [ ] No TypeScript errors

```bash
npm run type-check
```

-   [ ] Production build optimized
-   [ ] No console errors in production build

---

## 🔌 External Services

### Stripe

-   [ ] Webhook endpoint registered: `https://api.your-domain.com/api/payments/webhook`
-   [ ] Webhook secret updated in env vars
-   [ ] Test payment processed successfully in production mode
-   [ ] Webhook events received (check Stripe dashboard logs)

### Sentry

-   [ ] Sentry DSN configured
-   [ ] Test error sent and received

```bash
curl -X POST https://api.your-domain.com/api/test/sentry-error
```

-   [ ] Source maps uploaded (for better stack traces)
-   [ ] Alerts configured for critical errors

### Email (Gmail SMTP)

-   [ ] App Password generated (not regular password!)
-   [ ] Test email sent successfully

```bash
curl -X POST https://api.your-domain.com/api/test/send-email -H "Content-Type: application/json" -d '{"to":"test@example.com"}'
```

-   [ ] OTP emails delivering within 30 seconds

### Cryptomus / NOWPayments

-   [ ] Production API keys configured
-   [ ] Test crypto payment processed
-   [ ] Webhook endpoint registered with provider
-   [ ] Supported currencies verified

---

## 🌐 Infrastructure

### Render (Backend)

-   [ ] PostgreSQL database provisioned
-   [ ] Database backups enabled (automatic)
-   [ ] Backend service deployed
-   [ ] Environment variables set
-   [ ] Health check endpoint responding: `/api/health`
-   [ ] Auto-deploy from GitHub enabled
-   [ ] Instance size appropriate for load

### Vercel (Frontend)

-   [ ] Project connected to GitHub
-   [ ] Environment variables set
-   [ ] Custom domain configured
-   [ ] HTTPS/SSL working
-   [ ] Auto-deploy from GitHub enabled
-   [ ] Build settings optimized

### Cloudflare (DNS/CDN)

-   [ ] Domain added to Cloudflare
-   [ ] DNS records configured:
    -   `A` record: `@` → Render backend IP
    -   `CNAME` record: `api` → `your-backend.onrender.com`
    -   `CNAME` record: `www` → Vercel
-   [ ] SSL/TLS mode: Full (strict)
-   [ ] Security rules configured (rate limiting, bot protection)
-   [ ] CDN caching rules set

### Digital Ocean Spaces (Backups)

-   [ ] S3 bucket created
-   [ ] AWS credentials configured for GitHub Actions
-   [ ] Automated backup workflow running
-   [ ] Latest backup exists and is valid

---

## 🔍 Monitoring & Logging

### Sentry

-   [ ] Error tracking enabled
-   [ ] Performance monitoring enabled (10% sample rate)
-   [ ] Sensitive data filtered from events
-   [ ] Team members invited

### Application Logs

-   [ ] Winston logger configured
-   [ ] Log level set to `info` in production
-   [ ] Render logs accessible
-   [ ] No sensitive data logged (passwords, tokens, etc.)

### Metrics (Optional)

-   [ ] Prometheus metrics endpoint: `/api/metrics`
-   [ ] Grafana dashboard connected (if using)

---

## 🔒 Security Hardening

### Authentication

-   [ ] JWT tokens expire appropriately (15min access, 7d refresh)
-   [ ] TOTP 2FA working for admin accounts
-   [ ] Password requirements enforced (8+ chars, complexity)
-   [ ] Rate limiting enabled on auth endpoints

### API Security

-   [ ] CORS configured with production domains only
-   [ ] Helmet.js security headers enabled
-   [ ] SQL injection protection (Prisma ORM)
-   [ ] XSS protection enabled
-   [ ] CSRF protection (for cookie-based sessions)

### Crypto Security

-   [ ] IP whitelisting enabled for withdrawals
-   [ ] Wallet address whitelisting enforced
-   [ ] Multi-step approval for large withdrawals
-   [ ] Cold wallet storage for admin funds

---

## 📱 User Experience

### Core Flows

-   [ ] User registration works
-   [ ] Email verification works
-   [ ] Login with password works
-   [ ] Login with 2FA works
-   [ ] Password reset works
-   [ ] Payment processing works (Stripe + Crypto)
-   [ ] Withdrawal requests work
-   [ ] Admin dashboard accessible
-   [ ] Real-time notifications work (Socket.IO)

### Performance

-   [ ] Page load time < 3 seconds
-   [ ] API response time < 500ms (P95)
-   [ ] Database queries optimized (use indexes)
-   [ ] Images optimized and compressed
-   [ ] CDN caching enabled

### Cross-Browser Testing

-   [ ] Chrome (latest)
-   [ ] Firefox (latest)
-   [ ] Safari (latest)
-   [ ] Edge (latest)
-   [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## 📋 Documentation

### Code Documentation

-   [ ] README files updated
-   [ ] API documentation current (API_REFERENCE.md)
-   [ ] Architecture diagram updated
-   [ ] Deployment guide current (DEPLOYMENT_GUIDE.md)

### Operations Documentation

-   [ ] Disaster recovery plan created (DISASTER_RECOVERY.md)
-   [ ] Environment variables documented (.env.production.template)
-   [ ] Backup/restore procedures documented
-   [ ] Runbooks for common issues

---

## 🚀 Deployment

### Pre-Deployment

-   [ ] All above checks completed ✅
-   [ ] Team notified of deployment window
-   [ ] Maintenance window scheduled (if needed)
-   [ ] Rollback plan prepared

### Deployment Steps

1. [ ] Create database backup

```bash
cd backend
npm run db:backup
```

2. [ ] Run migrations (if any)

```bash
npx prisma migrate deploy
```

3. [ ] Push to main branch

```bash
git push origin main
```

4. [ ] Monitor deployment logs
   -   Render: Watch build and deploy logs
   -   Vercel: Watch build logs

5. [ ] Verify deployment

```bash
# Health check
curl https://api.your-domain.com/api/health

# Frontend
open https://your-domain.com
```

### Post-Deployment

-   [ ] Smoke tests passed (login, payment, withdrawal)
-   [ ] No errors in Sentry
-   [ ] No critical errors in logs
-   [ ] Database connections healthy
-   [ ] All services responding

### Monitoring (First 24 Hours)

-   [ ] Check Sentry every 2 hours for errors
-   [ ] Monitor server CPU/memory usage
-   [ ] Monitor database performance
-   [ ] Review user feedback/support tickets

---

## 🔄 Rollback Procedure

If critical issues detected:

1. **Immediate rollback**

```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

2. **Restore database** (if schema changed)

```bash
npm run db:restore -- backup-pre-deployment.sql
```

3. **Verify rollback**

```bash
curl https://api.your-domain.com/api/health
```

4. **Notify users** (if service was affected)

---

## ✅ Sign-Off

-   [ ] **Technical Lead**: Approved
-   [ ] **Security Review**: Passed
-   [ ] **Database Admin**: Backup verified
-   [ ] **DevOps**: Infrastructure ready
-   [ ] **QA**: Tests passed
-   [ ] **Product Owner**: Business requirements met

---

**Deployment Date**: **\*\***\_\_\_**\*\***  
**Deployed By**: **\*\***\_\_\_**\*\***  
**Version**: **\*\***\_\_\_**\*\***  
**Commit Hash**: **\*\***\_\_\_**\*\***

---

**Notes**:

-   Keep this checklist in version control
-   Update after each deployment
-   Document any issues encountered
-   Add new checks as needed
