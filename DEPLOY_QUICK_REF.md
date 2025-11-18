# 🚀 Quick Deploy Reference Card

## One-Command Full Deployment
```powershell
$env:DATABASE_URL = "postgresql://user:pass@host:port/db" ; .\scripts\saas-deploy-orchestrator.ps1
```

## Individual Steps

### 1. Frontend Only
```powershell
.\scripts\deploy-frontend-vercel.ps1
# OR: cd frontend && vercel --prod
```

### 2. Database Migration Only
```powershell
.\scripts\apply-production-migration.ps1 -DatabaseUrl $env:DATABASE_URL
```

### 3. Tests Only
```powershell
.\scripts\run-production-tests.ps1 -ApiUrl "https://api.advanciapayledger.com"
```

## Health Checks

```powershell
# API
Invoke-RestMethod https://api.advanciapayledger.com/health

# Frontend  
Start-Process https://your-vercel-domain.vercel.app

# PM2 (SSH to droplet)
ssh root@157.245.8.131 "pm2 status && pm2 logs --lines 20"
```

## Emergency Rollback

```powershell
# Restore DB from backup
psql $env:DATABASE_URL -f backups/wallet_migration_backup_YYYYMMDD_HHMMSS.sql

# Rollback Vercel deployment
vercel rollback https://your-vercel-domain.vercel.app
```

## Environment Variables Required

### Backend (Droplet)
- `DATABASE_URL`
- `WALLET_MASTER_SEED` (24 words)
- `WALLET_ENCRYPTION_KEY` (base64)
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `EMAIL_USER`, `EMAIL_PASSWORD`

### Frontend (Vercel)
- `NEXT_PUBLIC_API_URL`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## Monitoring URLs
- Vercel: https://vercel.com/dashboard
- Sentry: https://sentry.io
- DigitalOcean: https://cloud.digitalocean.com
- Cloudflare: https://dash.cloudflare.com

## Logs Location
- Deployment: `logs/deployment_TIMESTAMP.log`
- PM2: `pm2 logs advancia-backend`
- Vercel: Vercel dashboard → Project → Logs
