# Quick Start Guide — Security & High Availability

## ✅ Your System is Production-Ready

All security features, authentication, and high-availability mechanisms are **already implemented**. This guide shows you what's in place and how to use it.

---

## 🔐 What's Already Secured

### Authentication

-   ✅ Email/password with **Argon2id** hashing (industry best practice)
-   ✅ Email OTP (rate-limited: 5/min)
-   ✅ Password reset with secure tokens (1-hour expiry)
-   ✅ 2FA/TOTP (Google Authenticator compatible)
-   ✅ JWT with 7-day expiration
-   ✅ Refresh token rotation

### Brute-Force Protection

-   ✅ Global API rate limit: 300 requests/minute
-   ✅ Login rate limit: 5 attempts/15 minutes (Redis-backed)
-   ✅ OTP rate limit: 5 attempts/minute
-   ✅ Real-time alerts to admins via Socket.IO

### HTTPS & Cookies

-   ✅ Helmet security headers (CSP, HSTS, X-Frame-Options)
-   ✅ Secure cookies: httpOnly, secure, sameSite
-   ✅ CORS whitelist (no wildcards)
-   ✅ Cloudflare SSL termination

### Secrets

-   ✅ AES-256-GCM encryption for sensitive data
-   ✅ `.env` files encrypted and excluded from git
-   ✅ JWT secrets validated (minimum 32 characters)

### High Availability

-   ✅ Health checks at `/health` and `/api/health`
-   ✅ Graceful shutdown (30s timeout)
-   ✅ Maintenance mode page with auto-refresh
-   ✅ Redis for distributed rate limiting
-   ✅ Socket.IO for real-time monitoring

---

## 🚀 Production Checklist

### 1. Set Required Environment Variables

**Backend** (`backend/.env`):

```bash
# Security
JWT_SECRET=<minimum-32-char-random-string>
DATA_ENCRYPTION_KEY=<64-char-hex-for-aes-256>
TELEGRAM_WEBHOOK_SECRET=<random-string>

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Redis (for rate limiting)
REDIS_URL=redis://localhost:6379

# Email (for OTP/password reset)
EMAIL_USER=<your-smtp-email>
EMAIL_PASSWORD=<your-smtp-password>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Monitoring
SENTRY_DSN=<your-sentry-dsn>
NODE_ENV=production

# Frontend URL (for CORS and email links)
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Frontend** (`frontend/.env`):

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com

# Optional: Trustpilot widget
NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID=<your-bu-id>
NEXT_PUBLIC_TRUSTPILOT_DOMAIN=yourdomain.com

# Optional: Google Search Console
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=<google-verification-code>

# Optional: Organization info (for Schema.org JSON-LD)
NEXT_PUBLIC_ORG_NAME=Advancia
NEXT_PUBLIC_ORG_URL=https://yourdomain.com
NEXT_PUBLIC_LOGO_URL=https://yourdomain.com/logo.png

# Only if you have ACCURATE ratings - never fake these
# NEXT_PUBLIC_RATING_VALUE=4.8
# NEXT_PUBLIC_RATING_COUNT=1234

# Optional: Lockdown mode (emergency use)
# NEXT_PUBLIC_LOCKDOWN=true
```

### 2. Start Services

```pwsh
# Start Docker (db, redis, nginx)
Push-Location 'c:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform'
docker compose up -d
Pop-Location

# Run Prisma migrations
Push-Location 'c:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\backend'
pnpm exec prisma migrate dev --name add_fintech_models
pnpm exec prisma generate
Pop-Location

# Start backend (production)
Push-Location 'c:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\backend'
pnpm run build
NODE_ENV=production pm2 start ecosystem.config.js
Pop-Location

# Start frontend (production)
Push-Location 'c:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\frontend'
pnpm run build
NODE_ENV=production pm2 start npm --name "frontend" -- start
Pop-Location
```

### 3. Verify Health

```pwsh
# Check backend health
curl http://localhost:4000/health

# Expected response (200 OK):
# {"status":"healthy","timestamp":"...","database":"connected"}

# Check frontend
curl http://localhost:3000
```

---

## 🛡️ Security Features in Action

### Rate Limiting

-   **Where**: `backend/src/middleware/rateLimiterRedis.ts`
-   **What**: Blocks IPs after 5 failed login attempts for 15 minutes
-   **Alerts**: Real-time notifications to admins via Socket.IO

### Password Security

-   **Algorithm**: Argon2id (memory-hard, GPU-resistant)
-   **Migration**: Automatically upgrades bcrypt hashes on login
-   **Location**: `backend/src/utils/password.ts`

### Session Management

-   **Expiration**: JWT tokens expire after 7 days
-   **Refresh**: Automatic refresh token rotation
-   **Tracking**: Real-time session list in admin dashboard
-   **Invalidation**: Logout immediately revokes tokens

### IP Reputation

-   **Tracking**: Prisma model `IPReputation` tracks suspicious IPs
-   **Detection**: VPN, proxy, Tor, datacenter detection
-   **Actions**: Automatic blacklisting for high-risk IPs
-   **Location**: `backend/src/services/fraudDetectionService.ts`

---

## 🔧 Maintenance Mode

### Enable Maintenance Mode

**Method 1: Environment Variable** (Recommended)

```bash
# Backend .env
MAINTENANCE_MODE=true

# Frontend .env
NEXT_PUBLIC_LOCKDOWN=true
```

**Method 2: Nginx Redirect**

```nginx
# In nginx/advancia.conf
if (-f /var/www/maintenance.html) {
  return 503;
}
```

### What Happens?

1. Frontend redirects all pages to `/maintenance` (except `/auth`, `/news`, `/faq`)
2. Maintenance page auto-refreshes every 15 seconds
3. Users can click "Check Status Now" to manually check
4. Service auto-resumes when health check passes

### Maintenance Page Features

-   Professional animated UI
-   Auto-countdown timer
-   Manual status check button
-   Contact information
-   Location: `frontend/src/app/maintenance/page.tsx`

---

## 🚨 Emergency Procedures

### Service Goes Down

1. **Engineers are auto-alerted** via Sentry
2. **Load balancer detects failure** via `/health` endpoint
3. **Traffic rerouted** to healthy instances (if multi-instance)
4. **Graceful shutdown** ensures no data loss
5. **Users see maintenance page** automatically

### High Traffic / DDoS

1. **Rate limiters activate** (300 req/min global, 5 req/15min auth)
2. **Cloudflare absorbs** L3/L4 attacks
3. **Redis tracks** rate limit violations
4. **Admins alerted** via Socket.IO real-time
5. **Auto-scaling** (if configured with PM2 cluster mode)

### Database Issues

1. **Health check fails** (no Prisma connection)
2. **503 returned** to load balancer
3. **Instance removed** from rotation
4. **Graceful shutdown** closes connections cleanly
5. **Manual intervention** (engineers fix DB)

---

## 📊 Monitoring & Alerts

### Real-Time Monitoring

-   **Socket.IO Dashboard**: Admins see rate limit events live
-   **Sentry**: All errors logged with stack traces
-   **Health Checks**: Load balancer pings every 30s
-   **PM2**: Process monitoring and auto-restart

### What Engineers See

-   Failed login attempts (IP, timestamp, count)
-   Rate limit violations (endpoint, IP, threshold)
-   Database connection issues
-   Uncaught exceptions
-   Performance bottlenecks

### What Users See

-   Professional maintenance page (if down)
-   Generic error messages (in production)
-   No stack traces or sensitive info
-   Contact information for support

---

## 🎯 Testing Your Setup

### 1. Test Rate Limiting

```pwsh
# Attempt 6 logins rapidly (5th should fail)
for ($i=1; $i -le 6; $i++) {
  Invoke-RestMethod -Method Post -Uri "http://localhost:4000/api/auth/login" `
    -Body (@{email='test@test.com'; password='wrong'} | ConvertTo-Json) `
    -ContentType 'application/json'
  Write-Host "Attempt $i"
}
```

### 2. Test Health Check

```pwsh
# Should return 200 OK
Invoke-RestMethod -Uri "http://localhost:4000/health"

# Stop database, should return 503
docker compose stop db
Invoke-RestMethod -Uri "http://localhost:4000/health"
```

### 3. Test Maintenance Mode

```bash
# Enable in frontend/.env
NEXT_PUBLIC_LOCKDOWN=true

# Restart frontend
pm2 restart frontend

# Visit any page → redirects to /maintenance
```

### 4. Test Graceful Shutdown

```pwsh
# Start backend
pm2 start backend

# Send SIGTERM (graceful)
pm2 stop backend

# Check logs: should see "Shutting down gracefully..."
pm2 logs backend --lines 50
```

---

## 📞 Support & Documentation

-   **Full Security Audit**: `SECURITY_AND_HA_STATUS.md`
-   **Deployment Guide**: `DEPLOYMENT_ARCHITECTURE.md`
-   **API Reference**: `API_REFERENCE.md`
-   **Founders Ops Handbook**: `FOUNDERS_OPS_HANDBOOK.md`

---

## ✅ You're Ready for Production

All security and high-availability features are **implemented, tested, and production-ready**. Engineers handle issues silently via Sentry alerts. Users experience minimal disruption during maintenance.

**Key Takeaway**: Your system is designed to **never suddenly shut down**. Graceful shutdowns, health checks, and maintenance mode ensure smooth operations even during emergencies.

---

**Last Updated**: November 18, 2025  
**Status**: Production-Ready ✅
