# Deploy to Digital Ocean App Platform

[![Deploy to DO](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/muchaeljohn739337-cloud/-modular-saas-platform/tree/main)

## 🚀 One-Click Deployment

This project is configured to deploy to Digital Ocean App Platform with a single click!

### What Gets Deployed:

1. **Backend API** (Node.js + Express + Prisma)

   - Auto-scales based on traffic
   - Health checks enabled
   - OpenTelemetry tracing configured
   - Runs on `/api/*` routes

2. **Frontend** (Next.js)

   - Static site generation
   - Optimized builds
   - Auto-connects to backend API

3. **PostgreSQL Database** (Managed)
   - Version 16
   - Automatic backups
   - High availability
   - Production-ready

### Deployment Steps:

#### Option 1: One-Click Deploy (Recommended)

1. **Click the Deploy Button** above
2. **Connect GitHub** - Authorize Digital Ocean to access your repo
3. **Configure Environment Variables**:
   ```
   JWT_SECRET=<generate-random-32-char-string>
   SESSION_SECRET=<generate-random-32-char-string>
   EMAIL_USER=<your-gmail-address>
   EMAIL_PASSWORD=<your-gmail-app-password>
   ```
4. **Review & Deploy** - Click "Create Resources"
5. **Wait 5-10 minutes** for deployment
6. **Done!** Your app is live at `https://your-app.ondigitalocean.app`

#### Option 2: Manual Setup via Dashboard

1. Go to https://cloud.digitalocean.com/apps
2. Click **"Create App"**
3. Select **GitHub** as source
4. Choose your repository: `muchaeljohn739337-cloud/-modular-saas-platform`
5. Branch: `main`
6. App Platform auto-detects the `.do/app.yaml` configuration
7. Add environment variables (see above)
8. Click **"Next"** → **"Create Resources"**

#### Option 3: Using doctl CLI

```powershell
# Install doctl (if not already installed)
choco install doctl

# Authenticate
doctl auth init --context advancia

# Create app from spec
doctl apps create --spec .do/app.yaml

# Get app ID and monitor deployment
doctl apps list
doctl apps get <APP-ID>
```

### Post-Deployment:

1. **Get Your URLs**:

   - Backend API: `https://backend-api-xxxxx.ondigitalocean.app/api`
   - Frontend: `https://frontend-xxxxx.ondigitalocean.app`

2. **Run Database Migrations**:

   ```powershell
   # SSH into backend container
   doctl apps logs <APP-ID> backend-api --type run

   # Or trigger migration via console
   # App Platform runs migrations automatically during build
   ```

3. **Update Frontend Environment**:
   - App Platform automatically injects `NEXT_PUBLIC_API_URL`
   - No manual configuration needed!

### Costs:

- **Backend API**: $5/month (Basic plan)
- **Frontend**: $0/month (Static site)
- **Database**: $15/month (Starter plan) or $0 for 90 days
- **Total**: ~$20/month (or $5/month for 90 days with free DB)

### Monitoring:

- **Logs**: https://cloud.digitalocean.com/apps/<APP-ID>/logs
- **Metrics**: Built-in CPU, memory, requests/sec
- **Alerts**: Configure in App Platform dashboard

### Scaling:

App Platform auto-scales based on traffic. To adjust:

1. Go to your app in the dashboard
2. Click on **backend-api** component
3. Adjust **instance count** (1-10 instances)
4. Adjust **instance size** (basic-xxs to professional-xl)

### Rollback:

If deployment fails, App Platform keeps previous version running:

```powershell
# List deployments
doctl apps list-deployments <APP-ID>

# Rollback to previous deployment
doctl apps create-deployment <APP-ID> --deployment-id <PREVIOUS-DEPLOYMENT-ID>
```

### Custom Domain:

1. Go to app **Settings** → **Domains**
2. Add your domain: `advanciapayledger.com`
3. Update DNS records as instructed
4. SSL certificate auto-provisioned

### Environment Variables:

Update via dashboard or CLI:

```powershell
doctl apps update <APP-ID> --spec .do/app.yaml
```

### Troubleshooting:

**Build fails?**

- Check logs: `doctl apps logs <APP-ID> backend-api --type build`
- Verify `package.json` scripts are correct

**Database connection fails?**

- App Platform auto-injects `DATABASE_URL`
- Check **Environment** tab in dashboard

**Frontend can't reach backend?**

- Verify `NEXT_PUBLIC_API_URL` points to backend
- Check CORS settings in `backend/src/config/index.ts`

### Local Development:

```powershell
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Support:

- [App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [Community Forum](https://www.digitalocean.com/community/tags/app-platform)
- [Support Tickets](https://cloud.digitalocean.com/support/tickets)

---

**Ready to deploy?** Click the button at the top! 🚀
