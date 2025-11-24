# Advancia Pay Ledger - Deployment Guide

## Quick Overview

**Production Stack:**

-   **Backend + Database**: Render
-   **Frontend**: Vercel
-   **Backups**: Digital Ocean Spaces
-   **CDN/DNS**: Cloudflare
-   **Monitoring**: Sentry
-   **Cost**: $19/month

---

## 1. Backend Deployment (Render)

### A. Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **PostgreSQL**
2. Configure:
   -   **Name**: `advancia-pay-db`
   -   **Region**: Choose closest to your users
   -   **Plan**: Starter ($7/mo) or Free (90-day trial)
3. Copy **Internal Database URL** (starts with `postgresql://`)

### B. Create Web Service

1. **Render Dashboard** → **New** → **Web Service**
2. Connect GitHub repo: `your-org/-modular-saas-platform`
3. Configure:
   -   **Name**: `advancia-pay-backend`
   -   **Root Directory**: Leave empty
   -   **Build Command**: `cd backend && npm install && npx prisma generate && npx prisma migrate deploy`
   -   **Start Command**: `cd backend && npm start`
   -   **Branch**: `main`
4. Add environment variables (see `backend/.env.example`)
5. Deploy!

**Backend URL**: `https://advancia-pay-backend.onrender.com`

---

## 2. Frontend Deployment (Vercel)

### A. Import Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → **Add New** → **Project**
2. Import from GitHub: `your-org/-modular-saas-platform`
3. Configure:
   -   **Framework Preset**: Next.js
   -   **Root Directory**: `frontend`
4. Add environment variables:

   ```bash
   NEXT_PUBLIC_API_URL=https://advancia-pay-backend.onrender.com
   NEXT_PUBLIC_WS_URL=https://advancia-pay-backend.onrender.com
   ```

5. Deploy!

**Frontend URL**: `https://advancia-pay.vercel.app`

---

## 3. Digital Ocean Spaces (Backups)

### A. Create Space

1. [Digital Ocean Dashboard](https://cloud.digitalocean.com) → **Spaces** → **Create Space**
2. Configure:
   -   **Name**: `advancia-backups`
   -   **Region**: New York 3 (or closest)
   -   **CDN**: Disabled
3. **Cost**: $5/month

### B. Generate Access Keys

1. **API** → **Spaces Keys** → **Generate New Key**
2. Save **Access Key** and **Secret Key**

### C. Add to GitHub Secrets

Repository → **Settings** → **Secrets** → **Actions**:

```
DO_SPACES_KEY=<your-access-key>
DO_SPACES_SECRET=<your-secret-key>
DO_SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
DO_SPACES_REGION=nyc3
DO_SPACES_BUCKET=advancia-backups
DATABASE_URL=<render-postgresql-internal-url>
```

**Backups run nightly at 2 AM UTC** via `.github/workflows/backup-and-migrate.yml`

---

## 4. Cloudflare Configuration

### A. Add Custom Domains

**Vercel**:

1. Vercel → Project Settings → Domains → Add `app.advancia.pay`
2. Copy CNAME record

**Cloudflare**:

1. DNS → Add CNAME:
   -   **Name**: `app`
   -   **Target**: `cname.vercel-dns.com`
   -   **Proxy**: ✅ Enabled

2. Add CNAME for API (optional):
   -   **Name**: `api`
   -   **Target**: `advancia-pay-backend.onrender.com`
   -   **Proxy**: ✅ Enabled

### B. SSL/TLS Settings

1. **SSL/TLS** → Mode: **Full (strict)**
2. Enable:
   -   ✅ Always Use HTTPS
   -   ✅ Automatic HTTPS Rewrites
   -   ✅ Minimum TLS 1.2

---

## 5. Update Environment Variables

After DNS propagates:

**Render** (backend):

```bash
FRONTEND_URL=https://app.advancia.pay
```

**Vercel** (frontend):

```bash
NEXT_PUBLIC_API_URL=https://api.advancia.pay
NEXT_PUBLIC_WS_URL=wss://api.advancia.pay
```

Redeploy both services.

---

## 6. Stripe Webhook Configuration

1. [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. Add endpoint: `https://api.advancia.pay/api/payments/webhook`
3. Events: `payment_intent.succeeded`, `payment_intent.failed`
4. Copy **Signing Secret** → Update in Render

---

## 7. Post-Deployment Checklist

-   [ ] Backend health: `curl https://api.advancia.pay/api/health`
-   [ ] Frontend loads: `https://app.advancia.pay`
-   [ ] User registration works
-   [ ] Login functional
-   [ ] WebSocket connects (check browser console)
-   [ ] Stripe test payment succeeds
-   [ ] Sentry receiving errors
-   [ ] Nightly backups running (check GitHub Actions)
-   [ ] Cloudflare SSL active (green padlock)

---

## 8. Local Development

```bash
# Backend (Terminal 1)
cd backend
npm install
npx prisma generate
npm run dev

# Frontend (Terminal 2)
cd frontend
npm install
npm run dev
```

Access:

-   Frontend: <http://localhost:3000>
-   Backend: <http://localhost:4000/api/health>
-   Database UI: `cd backend && npx prisma studio`

---

## 9. Rollback Procedures

### Render Backend

1. Dashboard → Deploys → Find last stable deployment
2. Click **⋮** → **Redeploy**

### Vercel Frontend

1. Dashboard → Deployments → Find stable deployment
2. Click **⋮** → **Promote to Production**

### Database Restore

```bash
# Download from DO Spaces
s3cmd get s3://advancia-backups/backup-YYYY-MM-DD.sql.gz

# Restore
gunzip -c backup-YYYY-MM-DD.sql.gz | psql $DATABASE_URL
```

---

## 10. Monitoring & Logs

**Render**:

-   Real-time logs: Dashboard → Logs tab
-   Export: Last 7 days

**Vercel**:

-   Real-time logs: Dashboard → Functions → View logs

**Sentry**:

-   Errors: <https://sentry.io/organizations/your-org/projects/advancia-pay-backend>

---

## Support

-   **Render**: <https://render.com/docs>
-   **Vercel**: <https://vercel.com/docs>
-   **Cloudflare**: <https://developers.cloudflare.com>
-   **Digital Ocean**: <https://docs.digitalocean.com/products/spaces>

---

**Estimated Setup Time**: 2-3 hours  
**Monthly Cost**: $19 (production) | $0 (free tier for development)
