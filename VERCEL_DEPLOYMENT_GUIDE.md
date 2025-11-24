# 🚀 Vercel + Render PostgreSQL Deployment Guide

## Quick Start (5 Minutes)

### Step 1: Deploy Frontend to Vercel

```bash
# Login to Vercel
vercel login

# Deploy to production
cd frontend
vercel --prod

# Or deploy from root (Vercel auto-detects Next.js)
vercel --prod
```

### Step 2: Configure Render PostgreSQL

1. **Go to**: <https://dashboard.render.com/>
2. **Create PostgreSQL Database**:
   -   Name: `advancia-db`
   -   Region: `Oregon (US West)` or closest to your users
   -   Plan: `Starter` ($7/month) or `Free` (expires after 90 days)
3. **Copy Connection String**:

   ```
   postgresql://username:password@host:5432/database
   ```

### Step 3: Update Environment Variables

#### Vercel Frontend Environment Variables

```bash
# Go to: https://vercel.com/your-project/settings/environment-variables

NEXT_PUBLIC_API_URL=https://advancia-backend.onrender.com
NEXT_PUBLIC_FRONTEND_URL=https://advancia.vercel.app
NODE_ENV=production
```

#### Render Backend Environment Variables

```bash
# In Render Dashboard → Your Web Service → Environment

DATABASE_URL=postgresql://user:pass@host:5432/advancia_db
FRONTEND_URL=https://advancia.vercel.app
BACKEND_URL=https://advancia-backend.onrender.com
NODE_ENV=production
JWT_SECRET=<generate-secure-random-string>
SESSION_SECRET=<generate-secure-random-string>

# Optional (enable if needed)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
CRYPTOMUS_API_KEY=...
CRYPTOMUS_MERCHANT_ID=...
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

---

## 📋 Detailed Deployment Steps

### A. Vercel Token Authentication

```bash
# Set token in environment (get from Vercel dashboard)
$env:VERCEL_TOKEN = "YOUR_VERCEL_TOKEN_HERE"

# Or use interactive login
vercel login
```

### B. Link Project to Vercel

```bash
cd frontend
vercel link

# Follow prompts:
# ? Set up and deploy? Yes
# ? Which scope? (Select your account)
# ? Link to existing project? No
# ? What's your project's name? advancia-pay
# ? In which directory is your code located? ./
```

### C. Configure Build Settings

Vercel auto-detects Next.js, but you can customize in `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### D. Deploy to Production

```bash
# Deploy with production optimizations
vercel --prod

# Deploy to preview (staging)
vercel

# Deploy with specific environment
vercel --prod --env NEXT_PUBLIC_API_URL=https://api.example.com
```

---

## 🐘 Render PostgreSQL Setup

### 1. Create Database

**Dashboard**: <https://dashboard.render.com/new/database>

-   **Name**: `advancia-db`
-   **Database**: `advancia_db`
-   **User**: Auto-generated
-   **Region**: Oregon (US West)
-   **PostgreSQL Version**: 16
-   **Plan**: Starter ($7/mo) or Free

### 2. Get Connection Details

After creation, copy:

-   **Internal Database URL** (for Render services): `postgresql://...`
-   **External Database URL** (for local dev): `postgresql://...`

### 3. Connect Backend to Render PostgreSQL

#### Option A: Deploy Backend to Render

1. **Create Web Service**: <https://dashboard.render.com/new/web>
2. **Connect Repository**: Link your GitHub repo
3. **Configure**:
   -   Name: `advancia-backend`
   -   Region: Same as database (Oregon)
   -   Branch: `main` or `preview`
   -   Build Command: `cd backend && npm install && npm run build`
   -   Start Command: `cd backend && npm start`
4. **Environment Variables**: Add `DATABASE_URL` from Render PostgreSQL

#### Option B: Deploy Backend to Digital Ocean

If you prefer Digital Ocean (already configured):

```bash
# Update backend .env with Render PostgreSQL URL
DATABASE_URL=postgresql://user:pass@host.render.com:5432/advancia_db

# Deploy to Digital Ocean
ssh root@your-droplet-ip
cd /var/www/advancia-backend
git pull
npm install
npm run build
pm2 restart advancia-backend
```

### 4. Run Prisma Migrations

```bash
# From your local machine (with Render PostgreSQL URL)
cd backend
export DATABASE_URL="postgresql://user:pass@host.render.com:5432/advancia_db"
npx prisma migrate deploy

# Or from Render Web Service (auto-runs on deploy)
# Add to Build Command:
cd backend && npm install && npx prisma migrate deploy && npm run build
```

---

## 🔒 Security Checklist

### Vercel Security

-   ✅ Use environment variables for all secrets
-   ✅ Enable "Automatically expose System Environment Variables" (OFF)
-   ✅ Add custom domains with SSL
-   ✅ Configure CORS headers in `vercel.json`
-   ✅ Enable DDoS protection (automatic)

### Render PostgreSQL Security

-   ✅ Use internal database URL for Render services
-   ✅ Whitelist IPs for external access
-   ✅ Enable SSL connections (required)
-   ✅ Regular backups (automatic on paid plans)
-   ✅ Rotate database credentials periodically

---

## 🧪 Testing Deployment

### 1. Test Frontend (Vercel)

```bash
curl https://advancia.vercel.app/api/health
# Expected: 200 OK (proxied to backend)
```

### 2. Test Backend (Render or Digital Ocean)

```bash
curl https://advancia-backend.onrender.com/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

### 3. Test Database Connection

```bash
# From backend service
curl https://advancia-backend.onrender.com/api/system/health
# Should show database status
```

---

## 🚨 Troubleshooting

### Vercel Build Fails

```bash
# Check build logs
vercel logs

# Common fixes:
# 1. Clear build cache
vercel --prod --force

# 2. Check Node version (should be 20.x)
# Add to package.json:
"engines": {
  "node": ">=20.0.0"
}

# 3. Increase memory limit
# vercel.json:
"build": {
  "env": {
    "NODE_OPTIONS": "--max-old-space-size=4096"
  }
}
```

### Render PostgreSQL Connection Issues

```bash
# Test connection from local
psql postgresql://user:pass@host.render.com:5432/advancia_db

# Common fixes:
# 1. Check IP whitelist in Render dashboard
# 2. Verify SSL is enabled (required by Render)
# 3. Use internal URL for Render services
```

### CORS Errors

```bash
# Update vercel.json rewrites:
"rewrites": [
  {
    "source": "/api/:path*",
    "destination": "https://advancia-backend.onrender.com/api/:path*"
  }
]

# Update backend CORS (backend/src/jobs/config/index.ts):
allowedOrigins: [
  "https://advancia.vercel.app",
  "https://advancia-pay.vercel.app",
  "https://*.vercel.app"
]
```

---

## 📊 Cost Breakdown

### Vercel

-   **Hobby Plan**: $0/month
    -   100GB bandwidth
    -   Serverless functions
    -   Custom domains
    -   Automatic SSL

-   **Pro Plan**: $20/month
    -   More bandwidth
    -   Team collaboration
    -   Advanced analytics

### Render PostgreSQL

-   **Free Plan**: $0/month
    -   90-day expiry
    -   1GB storage
    -   Good for testing

-   **Starter Plan**: $7/month
    -   No expiry
    -   10GB storage
    -   Daily backups
    -   99.9% uptime SLA

### Total Cost Estimate

-   **Development**: $0/month (Vercel Hobby + Render Free)
-   **Production**: $27/month (Vercel Hobby + Render Starter $7 + Render Web Service $7)

---

## 🎯 Production Checklist

Before going live:

### Frontend (Vercel)

-   [ ] Custom domain configured
-   [ ] SSL certificate active
-   [ ] Environment variables set
-   [ ] API proxy configured
-   [ ] CORS headers added
-   [ ] Analytics enabled

### Backend (Render/Digital Ocean)

-   [ ] Database connection tested
-   [ ] Prisma migrations run
-   [ ] Environment variables set
-   [ ] Health check endpoint working
-   [ ] Logs monitoring enabled
-   [ ] PM2 or Render auto-restart configured

### Database (Render PostgreSQL)

-   [ ] Connection string secured
-   [ ] Backups enabled
-   [ ] SSL enforced
-   [ ] IP whitelist configured
-   [ ] Connection pooling enabled

---

## 📚 Additional Resources

-   **Vercel Docs**: <https://vercel.com/docs>
-   **Render PostgreSQL Docs**: <https://render.com/docs/databases>
-   **Next.js Deployment**: <https://nextjs.org/docs/deployment>
-   **Prisma with PostgreSQL**: <https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project/postgresql>

---

## 🎉 Quick Deploy Commands

```bash
# 1. Deploy frontend to Vercel
vercel --prod

# 2. Get Render PostgreSQL URL
# Copy from: https://dashboard.render.com/databases

# 3. Update backend DATABASE_URL
# In Render Web Service or Digital Ocean .env

# 4. Run migrations
npx prisma migrate deploy

# 5. Restart backend
pm2 restart advancia-backend  # Or redeploy on Render

# 6. Test everything
curl https://advancia.vercel.app
curl https://advancia-backend.onrender.com/api/health
```

**You're ready for production! 🚀**
