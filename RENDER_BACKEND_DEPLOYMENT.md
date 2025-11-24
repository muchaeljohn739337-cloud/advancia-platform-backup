# 🚀 Systematic Render Backend Deployment Guide

**Database ID**: `dpg-d4f112trnu6s73doipjg-a`  
**Database URL**: `postgresql://db_adnan_postrl_user:Gd1XFfDxFVsM5MltemAhFE3zPNcRh5hg@dpg-d4f112trnu6s73doipjg-a.oregon-postgres.render.com/db_adnan_postrl`

---

## 📋 Step-by-Step Deployment

### Step 1: Deploy Using Render Blueprint (Automatic)

Render Blueprint will read your `render.yaml` and automatically create the service.

1. **Go to**: <https://dashboard.render.com/select-repo?type=blueprint>

2. **Connect GitHub Repository**:
   -   Click **"Connect"** next to: `muchaeljohn739337-cloud/-modular-saas-platform`
   -   If not listed, click **"Configure account"** → Grant access to repo

3. **Blueprint Detection**:
   -   Render will automatically detect `render.yaml` in your repo
   -   Click **"Apply"** or **"Create New Services"**

4. **Review Configuration**:
   -   Service Name: `advancia-backend`
   -   Region: `Oregon (US West)`
   -   Branch: `preview-clean`
   -   Root Directory: `backend`
   -   Runtime: `Node`

5. **Environment Variables to Add**:

   You'll need to manually add these 5 secrets (they're marked as `sync: false`):

   ```bash
   JWT_SECRET=26373148a4dc57ca185e3c28d5c0f5e62aaf65de42e5ff112671ea6ada8a82a4862d96b70378d7e89f3026df8ee8feb6f98f30acc385fc77ce1149ac9b64eedb

   SESSION_SECRET=9c937f2cffe448795b67b22dda7e4633a20afeb921f76c7e318f334e84e1d469e8f2a5fa0fc6656508f3853a3876db82013bb735bffae029eeabfaa8cb3a0014

   JWT_SECRET_ENCRYPTED=451b119d54937f2837be04577ea89582a41c35f4cd442acac8f5a0d39b56755706c87e94052bb82405d69fa47c5e723d3e4f77b7b70ca4fe3d53b570b7b9f059

   JWT_ENCRYPTION_KEY=27b02842f7342e98d588d97201050f0284e21e7cad8b9d71bff2093d65261559

   JWT_ENCRYPTION_IV=5b4505dafc9542bca397f46a1eed201a
   ```

6. **Click "Apply"** → Render will create your backend service

---

### Step 2: Alternative - Manual Service Creation

If Blueprint doesn't work, create manually:

1. **Go to**: <https://dashboard.render.com/create?type=webUse> our existing ErrorHandler utility class instead of writing custom try-catch blocks for each endpoint.

2. **Connect Repository**:
   -   Click **"Build and deploy from a Git repository"**
   -   Select: `muchaeljohn739337-cloud/-modular-saas-platform`
   -   Click **"Connect"**

3. **Configure Settings**:

   ```
   Name: advancia-backend
   Region: Oregon (US West)
   Branch: preview-clean
   Root Directory: backend
   Runtime: Node
   Build Command: npm ci && npx prisma generate && npx prisma migrate deploy && npm run build
   Start Command: npm start
   Instance Type: Free
   ```

4. **Add Environment Variables** (click "Advanced"):

   Copy-paste each line:

   ```bash
   NODE_ENV=production
   PORT=4000
   DATABASE_URL=postgresql://db_adnan_postrl_user:Gd1XFfDxFVsM5MltemAhFE3zPNcRh5hg@dpg-d4f112trnu6s73doipjg-a.oregon-postgres.render.com/db_adnan_postrl
   FRONTEND_URL=https://advanciapayledger.com
   ALLOWED_ORIGINS=https://advanciapayledger.com,https://www.advanciapayledger.com
   VAPID_SUBJECT=mailto:support@advanciapayledger.com
   JWT_SECRET=26373148a4dc57ca185e3c28d5c0f5e62aaf65de42e5ff112671ea6ada8a82a4862d96b70378d7e89f3026df8ee8feb6f98f30acc385fc77ce1149ac9b64eedb
   SESSION_SECRET=9c937f2cffe448795b67b22dda7e4633a20afeb921f76c7e318f334e84e1d469e8f2a5fa0fc6656508f3853a3876db82013bb735bffae029eeabfaa8cb3a0014
   JWT_SECRET_ENCRYPTED=451b119d54937f2837be04577ea89582a41c35f4cd442acac8f5a0d39b56755706c87e94052bb82405d69fa47c5e723d3e4f77b7b70ca4fe3d53b570b7b9f059
   JWT_ENCRYPTION_KEY=27b02842f7342e98d588d97201050f0284e21e7cad8b9d71bff2093d65261559
   JWT_ENCRYPTION_IV=5b4505dafc9542bca397f46a1eed201a
   ```

5. **Set Health Check**:

   ```
   Health Check Path: /api/health
   ```

6. **Auto-Deploy**:
   -   Toggle **"Auto-Deploy"** to **ON**

7. **Click "Create Web Service"**

---

### Step 3: Monitor Deployment

**Logs URL**: <https://dashboard.render.com/>

Watch for these stages:

```bash
==> Cloning from https://github.com/muchaeljohn739337-cloud/-modular-saas-platform...
==> Checking out commit 978b673 in branch preview-clean
==> Using Node version 20.x
==> Running build command: npm ci && npx prisma generate && npx prisma migrate deploy && npm run build
    ✓ Installing dependencies...
    ✓ Generating Prisma Client...
    ✓ Running migrations...
    ✓ Building TypeScript...
==> Running start command: npm start
    Server listening on port 4000
==> Your service is live 🎉
```

**Expected Timeline**:

-   Clone: 30 seconds
-   Dependencies: 2-3 minutes
-   Prisma + Migrations: 1-2 minutes
-   Build: 1 minute
-   Start: 10 seconds
-   **Total: 5-7 minutes**

---

### Step 4: Get Backend URL

After deployment completes:

1. Go to your service dashboard
2. Copy the URL (format: `https://advancia-backend-[random].onrender.com`)
3. Example: `https://advancia-backend-abc123.onrender.com`

---

### Step 5: Test Backend

```powershell
# Test health endpoint directly
curl https://advancia-backend-[your-id].onrender.com/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-11-20T..."}
```

---

### Step 6: Update Cloudflare DNS

1. **Go to**: <https://dash.cloudflare.com/0bff66558872c58ed5b8b7942acc34d9/advanciapayledger.com/dns>

2. **Find DNS Record**: `api.advanciapayledger.com`

3. **Edit Record**:
   -   **Type**: CNAME
   -   **Name**: api
   -   **Target**: `advancia-backend-[your-id].onrender.com` (paste your Render URL without https://)
   -   **Proxy status**: ✅ Proxied (orange cloud)
   -   **TTL**: Auto

4. **Save Changes**

5. **Wait 2-5 minutes** for DNS propagation

---

### Step 7: Test Through Custom Domain

```powershell
# Test via Cloudflare
curl https://api.advanciapayledger.com/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-11-20T..."}
```

---

## 📊 Configuration Summary

### What's Automatically Configured

✅ **Service Settings**:

-   Name: advancia-backend
-   Region: Oregon (matches database)
-   Runtime: Node.js
-   Plan: Free
-   Auto-deploy: Enabled on `preview-clean` branch

✅ **Build Process**:

-   Install dependencies: `npm ci`
-   Generate Prisma Client: `npx prisma generate`
-   Run migrations: `npx prisma migrate deploy`
-   Build TypeScript: `npm run build`

✅ **Runtime**:

-   Start command: `npm start`
-   Port: 4000
-   Health check: `/api/health`

✅ **Environment Variables**:

-   NODE_ENV=production
-   PORT=4000
-   DATABASE_URL (Render PostgreSQL)
-   FRONTEND_URL, ALLOWED_ORIGINS
-   JWT secrets (5 keys)
-   VAPID_SUBJECT

---

## 🔍 Troubleshooting

### Build Fails

**Check logs for:**

1. **Node version issues**:

   ```bash
   # Add to backend/package.json:
   "engines": {
     "node": ">=20.0.0"
   }
   ```

2. **Prisma connection issues**:
   -   Verify DATABASE_URL is correct
   -   Check database is in same region (Oregon)

3. **Missing dependencies**:

   ```bash
   # Ensure package-lock.json is committed
   git add backend/package-lock.json
   git commit -m "chore: add package-lock"
   git push origin preview-clean
   ```

### Health Check Fails

**Verify**:

-   Backend starts on port 4000
-   Route `/api/health` exists in `backend/src/index.ts`
-   Server responds within 30 seconds

### Database Connection Error

**Check**:

-   DATABASE_URL environment variable is set
-   Database ID: `dpg-d4f112trnu6s73doipjg-a`
-   Backend and database in same region (Oregon)

---

## 🎯 Next Steps After Deployment

1. ✅ Backend live on Render
2. ✅ Health check passing
3. ⏳ Update Cloudflare DNS to Render URL
4. ⏳ Test through `api.advanciapayledger.com`
5. ⏳ Update Vercel frontend to use new backend URL

---

## 📝 Quick Reference

**Render Dashboard**: <https://dashboard.render.com/>  
**Database**: dpg-d4f112trnu6s73doipjg-a  
**Region**: Oregon (US West)  
**Branch**: preview-clean  
**Health Check**: /api/health

**Environment Variables**: 10 total (5 from render.yaml + 5 secrets)

---

**🚀 Ready to deploy! Follow Step 1 to get started.**
