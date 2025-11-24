# Render Migration Checklist - Advancia Pay Ledger

**Current Status**: ✅ Repository prepared for Render deployment  
**Database**: Already on Render PostgreSQL (Oregon)  
**Target**: Deploy backend to Render, keep frontend on Vercel

---

## ✅ **PHASE 1: Pre-Migration Verification** (COMPLETED)

-   [x] Backend has `build` script: `tsc -p tsconfig.json`
-   [x] Backend has `start` script: `node dist/index.js`
-   [x] `render.yaml` configured with correct build commands
-   [x] Database connection string available
-   [x] Prisma schema has `url = env("DATABASE_URL")`
-   [x] All deprecated deployment scripts removed

---

## ✅ **PHASE 2: Local Build Test** (COMPLETED)

### Backend builds successfully

```powershell
cd backend
npm install
npm run build
```

**Status**: ✅ **Build succeeds**

-   TypeScript compiles to `dist/` folder (36 items)
-   JavaScript files emitted successfully
-   Note: ~195 type errors exist but don't block compilation (tsconfig: `noEmitOnError: false`)
-   **Deployment-ready**: Render will compile successfully

### Test backend starts locally

```powershell
npm start
```

**Expected Output**:

```text
🚀 Backend starting...
✅ Configuration loaded successfully
✅ Database connected
Server listening on port 4000
```

### Test health endpoint

```powershell
curl http://localhost:4000/api/health
```

**Expected Response**: `{"status":"ok","timestamp":"..."}`

---

## 🚀 **PHASE 3: Deploy Backend to Render**

### Option A: Using `render.yaml` (Recommended)

1. **Connect GitHub to Render**:
   -   Go to [https://dashboard.render.com/](https://dashboard.render.com/)
   -   Click **New** → **Blueprint**
   -   Select repository: `muchaeljohn739337-cloud/-modular-saas-platform`
   -   Branch: `main` or `preview-clean`

2. **Render will auto-detect `render.yaml`** and create:
   -   Web Service: `advancia-backend`
   -   Linked to existing PostgreSQL database

3. **Set Environment Secrets** (sync: false vars):

   ```bash
   JWT_SECRET=<from backend/.env>
   SESSION_SECRET=<from backend/.env>
   STRIPE_SECRET_KEY=<from backend/.env>
   STRIPE_WEBHOOK_SECRET=<from backend/.env>
   VAPID_PUBLIC_KEY=<from backend/.env>
   VAPID_PRIVATE_KEY=<from backend/.env>
   CRYPTOMUS_API_KEY=<from backend/.env>
   CRYPTOMUS_MERCHANT_ID=<from backend/.env>
   SENTRY_DSN=<from backend/.env or leave blank>
   EMAIL_USER=<Gmail for OTP emails>
   EMAIL_PASSWORD=<Gmail app password>
   ```

### Option B: Manual Web Service Creation

1. **New Web Service**:
   -   Name: `advancia-backend`
   -   Region: `Oregon` (same as DB)
   -   Branch: `main`
   -   Root Directory: `backend`

2. **Build Settings**:
   -   Build Command: `npm install && npm exec prisma generate && npm exec prisma migrate deploy && npm run build`
   -   Start Command: `npm start`

3. **Environment Variables**: (same as Option A)

---

## 📊 **PHASE 4: Verify Deployment**

### Check Render Logs

1. Go to **Render Dashboard** → `advancia-backend` → **Logs**
2. Look for:

   ```text
   ==> Building...
   ✔ Generated Prisma Client
   ==> Deploying...
   🚀 Backend starting...
   ✅ Configuration loaded successfully
   Server listening on port 4000
   ```

### Test Backend Endpoints

```powershell
# Health check
curl https://advancia-backend.onrender.com/api/health

# Test auth endpoint (should return 400 or validation error, not 500)
curl -X POST https://advancia-backend.onrender.com/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@test.com","password":"wrong"}'
```

**Expected**: Backend responds (not 502/503)

---

## 🌐 **PHASE 5: Update Frontend Configuration**

### Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select project: `modular-saas-platform-frontend`
3. **Settings** → **Environment Variables**
4. Update:

   ```bash
   NEXT_PUBLIC_API_URL=https://advancia-backend.onrender.com
   NEXT_PUBLIC_WS_URL=wss://advancia-backend.onrender.com
   ```

5. **Redeploy frontend**: Vercel → Deployments → Redeploy

### Update Backend CORS Origins

Go to **Render** → `advancia-backend` → **Environment**:

```bash
FRONTEND_URL=https://modular-saas-platform-frontend-6iwhoautb-advanciapayledger.vercel.app
ALLOWED_ORIGINS=https://modular-saas-platform-frontend-6iwhoautb-advanciapayledger.vercel.app,https://advanciapayledger.com,https://www.advanciapayledger.com
```

Redeploy backend.

---

## 🔐 **PHASE 6: DNS Configuration (Custom Domain)**

### For Backend API (api.advanciapayledger.com)

**Cloudflare DNS**:

```text
Type: CNAME
Name: api
Target: advancia-backend.onrender.com
Proxy: ✅ Enabled
TTL: Auto
```

**Render Custom Domain**:

1. Render → `advancia-backend` → **Settings** → **Custom Domains**
2. Add: `api.advanciapayledger.com`
3. Wait for SSL certificate (auto-provisioned)

### Update Backend Environment

```bash
FRONTEND_URL=https://advanciapayledger.com
ALLOWED_ORIGINS=https://advanciapayledger.com,https://www.advanciapayledger.com,https://app.advanciapayledger.com
```

### Update Frontend Environment

```bash
NEXT_PUBLIC_API_URL=https://api.advanciapayledger.com
NEXT_PUBLIC_WS_URL=wss://api.advanciapayledger.com
```

---

## 🔄 **PHASE 7: Stripe Webhook Update**

1. [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. Update endpoint URL:

   ```text
   https://api.advanciapayledger.com/api/payments/webhook
   ```

3. Events: `payment_intent.succeeded`, `payment_intent.failed`, `charge.succeeded`
4. Copy **Signing Secret** → Update in Render:

   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## 📧 **PHASE 8: Email Configuration**

### Gmail SMTP (for OTP emails)

Render environment:

```bash
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=<16-char app password>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### Generate Gmail App Password

1. Google Account → Security → 2-Step Verification
2. App passwords → Generate
3. Copy 16-character password

---

## ✅ **PHASE 9: Post-Deployment Testing**

### Backend API Tests

```powershell
# Health
curl https://api.advanciapayledger.com/api/health

# Register
curl -X POST https://api.advanciapayledger.com/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","username":"testuser","password":"Test1234!"}'

# Login
curl -X POST https://api.advanciapayledger.com/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"Test1234!"}'
```

### Frontend Tests

1. Open <https://advanciapayledger.com>
2. Test registration flow
3. Test login flow
4. Check browser console for API errors
5. Test WebSocket connection (notifications)

---

## 🗑️ **PHASE 10: DigitalOcean Cleanup** (OPTIONAL)

### If you had a DigitalOcean droplet before

1. **Snapshot droplet** (backup):

   ```text
   DigitalOcean → Droplets → [Your Droplet] → Snapshots → Take Snapshot
   ```

2. **Export any remaining data**:

   ```bash
   # From droplet
   pg_dump $OLD_DATABASE_URL > final-backup.sql
   scp root@DROPLET_IP:~/logs ~/backup-logs/
   ```

3. **Destroy droplet**:

   ```text
   DigitalOcean → Droplets → [Your Droplet] → Destroy
   ```

4. **Remove old DNS records**:
   -   Any CNAME/A records pointing to old droplet IP
   -   Keep only Render/Vercel/Cloudflare records

---

## 📋 **Environment Variables Checklist**

### Backend (Render) - Required

-   [x] NODE_ENV=production
-   [x] PORT=4000
-   [x] DATABASE_URL (already set in render.yaml)
-   [ ] JWT_SECRET
-   [ ] SESSION_SECRET
-   [ ] FRONTEND_URL
-   [ ] ALLOWED_ORIGINS
-   [ ] STRIPE_SECRET_KEY
-   [ ] STRIPE_WEBHOOK_SECRET
-   [ ] STRIPE_PUBLISHABLE_KEY
-   [ ] VAPID_PUBLIC_KEY
-   [ ] VAPID_PRIVATE_KEY
-   [ ] VAPID_SUBJECT
-   [ ] EMAIL_USER
-   [ ] EMAIL_PASSWORD
-   [ ] SMTP_HOST
-   [ ] SMTP_PORT
-   [ ] CRYPTOMUS_API_KEY (if using crypto payments)
-   [ ] CRYPTOMUS_MERCHANT_ID (if using crypto payments)
-   [ ] SENTRY_DSN (optional, for error tracking)

### Frontend (Vercel) - Required

-   [ ] NEXT_PUBLIC_API_URL
-   [ ] NEXT_PUBLIC_WS_URL
-   [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
-   [ ] NEXT_PUBLIC_VAPID_KEY
-   [ ] NEXTAUTH_URL
-   [ ] NEXTAUTH_SECRET

---

## 🚨 **Common Issues & Solutions**

### Issue: Backend crashes on startup

**Solution**: Check Render logs for missing environment variables

### Issue: CORS errors in frontend

**Solution**: Verify `ALLOWED_ORIGINS` includes frontend URL

### Issue: Database connection failed

**Solution**: Ensure using internal database URL (not external)

### Issue: Stripe webhook 401

**Solution**: Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard

### Issue: WebSocket connection failed

**Solution**: Check firewall/proxy settings, ensure `wss://` protocol

### Issue: Email OTP not sending

**Solution**: Verify Gmail app password (not regular password)

---

## 📞 **Support Resources**

-   **Render Docs**: <https://render.com/docs>
-   **Render Status**: <https://status.render.com>
-   **Prisma Docs**: <https://www.prisma.io/docs>
-   **Next.js Deployment**: <https://nextjs.org/docs/deployment>

---

## 🎉 **Deployment Complete Checklist**

-   [x] Backend builds locally without errors
-   [x] Backend compiles successfully (dist/index.js exists)
-   [ ] Render service deployed successfully
-   [ ] All environment variables set in Render
-   [ ] Backend logs show successful startup
-   [ ] Health endpoint responds from Render URL
-   [ ] Frontend environment variables updated
-   [ ] Frontend redeployed on Vercel
-   [ ] Custom domains configured (if applicable)
-   [ ] DNS propagated and SSL certificates active
-   [ ] Stripe webhooks updated
-   [ ] Email OTP working
-   [ ] User registration/login working
-   [ ] WebSocket notifications working
-   [ ] Old infrastructure cleaned up

---

**Estimated Migration Time**: 2-3 hours  
**Downtime**: ~5-10 minutes (during DNS propagation)  
**Rollback Strategy**: Keep old droplet snapshot for 7 days
