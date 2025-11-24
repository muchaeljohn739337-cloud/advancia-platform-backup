# Advancia Pay - Disaster Recovery Plan

## 🚨 Emergency Contacts

### Service Providers

-   **Render Support**: <https://render.com/support> (for database/backend)
-   **Vercel Support**: <https://vercel.com/support> (for frontend)
-   **Cloudflare Support**: <https://www.cloudflare.com/support> (for DNS/CDN)
-   **Stripe Support**: <https://support.stripe.com> (for payments)
-   **Sentry Support**: <https://sentry.io/support> (for monitoring)
-   **Digital Ocean Support**: <https://www.digitalocean.com/support> (for backups)

### Critical Team Contacts

-   **Primary Admin**: [Add email/phone]
-   **Technical Lead**: [Add email/phone]
-   **Database Admin**: [Add email/phone]

---

## 📋 Pre-Disaster Preparation

### 1. Automated Backups (Already Configured)

✅ **GitHub Actions**: Nightly backups at midnight UTC

-   File: `.github/workflows/backup-and-migrate.yml`
-   Destination: Digital Ocean Spaces (S3-compatible)
-   Retention: 30 days

### 2. Manual Backup Before Major Changes

```bash
cd backend
npm run db:backup
```

### 3. Environment Variables Backup

**⚠️ Store in password manager (NOT in git or cloud drives)**

Required secrets to backup:

-   `DATABASE_URL`
-   `JWT_SECRET` and `JWT_REFRESH_SECRET`
-   `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
-   `WALLET_ENCRYPTION_KEY` and `WALLET_MASTER_SEED`
-   `ADMIN_BTC_WALLET_ADDRESS`, `ADMIN_ETH_WALLET_ADDRESS`
-   `SENTRY_DSN`
-   All other secrets from `.env.production.template`

---

## 🔥 Disaster Scenarios & Recovery

### Scenario 1: Database Corruption/Loss

#### Detection

-   Database connection errors in logs
-   Sentry alerts for database errors
-   Users unable to login/access data

#### Recovery Steps

1. **Stop all services immediately**

```bash
# Render: Suspend backend service via dashboard
# This prevents further data corruption
```

2. **List available backups**

```bash
cd backend
npm run db:list-backups
```

3. **Download latest backup**

```bash
# Download from Digital Ocean Spaces
aws s3 cp s3://advancia-backups/backup-YYYY-MM-DD.sql ./backup.sql --endpoint-url=https://nyc3.digitaloceanspaces.com
```

4. **Create new database instance**

-   Go to Render dashboard → PostgreSQL
-   Create new database (or use backup/restore feature)
-   Copy new `DATABASE_URL`

5. **Restore backup**

```bash
# Set DATABASE_URL to new instance
export DATABASE_URL="postgresql://..."

# Restore backup
npm run db:restore -- backup.sql

# Verify integrity
npm run db:verify
```

6. **Update environment variables**

-   Render: Update `DATABASE_URL` in backend service
-   Restart backend service

7. **Verify restoration**

```bash
# Run health check
curl https://api.your-domain.com/api/health

# Check critical tables
npx prisma studio
```

#### Estimated Recovery Time: 30-60 minutes

---

### Scenario 2: Backend Service Down

#### Detection

-   Health check failures (`/api/health`)
-   Sentry alerts for server errors
-   Frontend shows connection errors

#### Recovery Steps

1. **Check Render dashboard**

-   View logs for error messages
-   Check if service crashed or suspended

2. **Common fixes**

```bash
# If env vars missing:
# - Go to Render dashboard → Environment
# - Verify all required vars are set
# - Restart service

# If build failed:
# - Check build logs in Render
# - Fix TypeScript/build errors
# - Push fix and redeploy
```

3. **Manual restart**

-   Render dashboard → Your service → Manual Deploy → Deploy latest commit

4. **Rollback if needed**

```bash
# Revert to previous working commit
git revert <bad-commit-hash>
git push origin main

# Render will auto-deploy previous version
```

#### Estimated Recovery Time: 5-15 minutes

---

### Scenario 3: DNS/Domain Issues

#### Detection

-   Domain not resolving
-   SSL certificate errors
-   "DNS_PROBE_FINISHED_NXDOMAIN" errors

#### Recovery Steps

1. **Check Cloudflare dashboard**

-   Verify DNS records are present:
    -   `A` record: `@` → Render IP
    -   `CNAME` record: `api` → `your-backend.onrender.com`

2. **Verify domain registration**

-   Check domain hasn't expired
-   Renew if necessary

3. **Check SSL certificates**

-   Cloudflare: SSL/TLS → Full (strict) mode
-   Render: Auto-SSL should be enabled

4. **Flush DNS cache** (for testing)

```bash
# Windows
ipconfig /flushdns

# Mac/Linux
sudo dscacheutil -flushcache
```

5. **Update DNS if needed**

```bash
# Get Render IP
dig your-backend.onrender.com

# Update Cloudflare A record if IP changed
```

#### Estimated Recovery Time: 15-30 minutes (+ DNS propagation 5-15 min)

---

### Scenario 4: Compromised Secrets

#### Detection

-   Unauthorized transactions
-   Unusual API activity
-   Security alerts from Stripe/payment providers

#### Recovery Steps

1. **Immediate actions**

```bash
# 1. Suspend all services (Render + Vercel)
# 2. Rotate ALL secrets:

# Generate new JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Stripe: Dashboard → Developers → API keys → Roll keys
# Email: Generate new App Password (Google Account → Security)
# Wallet keys: Generate new encryption key + addresses
```

2. **Update all environment variables**

-   Backend (Render): Update all secrets
-   Frontend (Vercel): Update `NEXTAUTH_SECRET`
-   Database: Rotate password if compromised

3. **Force logout all users**

```sql
-- Connect to database
UPDATE users SET "lastLogin" = NULL;

-- Clear all active sessions
DELETE FROM sessions;
```

4. **Notify users**

-   Send email about security incident
-   Require password reset for all users

5. **Audit logs**

```sql
-- Check recent suspicious activity
SELECT * FROM user_activities
WHERE "createdAt" > NOW() - INTERVAL '24 hours'
AND successful = false
ORDER BY "createdAt" DESC;
```

#### Estimated Recovery Time: 1-2 hours

---

### Scenario 5: Payment Provider Issues

#### Detection

-   Stripe webhook failures
-   Payment processing errors
-   User reports failed transactions

#### Recovery Steps

1. **Check Stripe dashboard**

-   View webhook logs
-   Verify webhook endpoint is reachable
-   Check webhook signing secret

2. **Update webhook endpoint**

```bash
# Stripe dashboard → Developers → Webhooks
# Verify endpoint: https://api.your-domain.com/api/payments/webhook
# Events to listen: payment_intent.succeeded, payment_intent.failed
```

3. **Manually reconcile failed payments**

```sql
-- Find pending payments
SELECT * FROM transactions
WHERE status = 'pending'
AND "createdAt" < NOW() - INTERVAL '1 hour';

-- Update based on Stripe dashboard
UPDATE transactions
SET status = 'completed', "updatedAt" = NOW()
WHERE id = 'transaction-id';
```

4. **Test payment flow**

```bash
# Use Stripe test card: 4242 4242 4242 4242
# Verify webhook receives events
```

#### Estimated Recovery Time: 30-45 minutes

---

## 🔍 Post-Recovery Verification

### 1. Health Checks

```bash
# Backend
curl https://api.your-domain.com/api/health

# Database connectivity
curl https://api.your-domain.com/api/admin/stats
```

### 2. Critical Flows

-   [ ] User login works
-   [ ] Payment processing works
-   [ ] Crypto withdrawal requests work
-   [ ] Email notifications send
-   [ ] Admin dashboard accessible

### 3. Monitoring

-   [ ] Sentry receiving events
-   [ ] Logs showing in Render
-   [ ] No critical errors in console

---

## 📚 Documentation References

-   **Render Database Docs**: <https://render.com/docs/databases>
-   **Prisma Backup Guide**: <https://www.prisma.io/docs/guides/database/backup-and-restore>
-   **Cloudflare DNS**: <https://developers.cloudflare.com/dns/>
-   **Stripe Webhooks**: <https://stripe.com/docs/webhooks>

---

## 🔄 Regular Maintenance

### Daily

-   [ ] Monitor Sentry for errors
-   [ ] Check automated backup success

### Weekly

-   [ ] Review database size and performance
-   [ ] Test backup restoration process
-   [ ] Audit user activity logs

### Monthly

-   [ ] Rotate non-critical secrets
-   [ ] Update dependencies
-   [ ] Review and update this disaster recovery plan

---

## 📞 Incident Response Checklist

1. **Identify severity**
   -   Critical: Service down, data loss, security breach
   -   High: Payment issues, degraded performance
   -   Medium: Non-critical features broken
   -   Low: Minor bugs, cosmetic issues

2. **Communicate**
   -   Internal: Notify team immediately
   -   External: Status page update (if applicable)
   -   Users: Email notification (for critical issues)

3. **Document**
   -   Record timeline of events
   -   Note all actions taken
   -   Document root cause
   -   Create post-mortem report

4. **Follow up**
   -   Implement preventive measures
   -   Update runbooks
   -   Train team on lessons learned

---

**Last Updated**: November 22, 2025  
**Version**: 1.0  
**Owner**: [Your Name/Team]
