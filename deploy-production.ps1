#!/usr/bin/env pwsh
# Master Production Deployment Script
# Deploys Frontend (Vercel) + Backend (Render/DO) + Database (Render PostgreSQL)
# Usage: .\deploy-production.ps1

param(
    [switch]$FrontendOnly,
    [switch]$BackendOnly,
    [switch]$All,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

if ($Help -or (-not ($FrontendOnly -or $BackendOnly -or $All))) {
    Write-Host @"
🚀 Advancia Pay - Master Production Deployment

USAGE:
  .\deploy-production.ps1 [-FrontendOnly] [-BackendOnly] [-All] [-Help]

OPTIONS:
  -FrontendOnly    Deploy only frontend to Vercel
  -BackendOnly     Deploy only backend (requires manual Render/DO setup)
  -All             Deploy both frontend and backend
  -Help            Show this help message

EXAMPLES:
  .\deploy-production.ps1 -FrontendOnly   # Deploy frontend to Vercel
  .\deploy-production.ps1 -All            # Full deployment

PREREQUISITES:
  ✅ Vercel CLI installed: npm i -g vercel@latest
  ✅ Vercel token: Set via 'vercel login' or env var
  ✅ Render PostgreSQL: Database created and URL copied
  ✅ Backend environment: DATABASE_URL configured

DEPLOYMENT TARGETS:
  Frontend → Vercel (https://advancia.vercel.app)
  Backend  → Render Web Service or Digital Ocean
  Database → Render PostgreSQL

"@
    exit 0
}

Write-Host @"

╔══════════════════════════════════════════════════════════╗
║                                                          ║
║        🚀 ADVANCIA PAY - PRODUCTION DEPLOYMENT 🚀        ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# Check Vercel CLI
if ($FrontendOnly -or $All) {
    Write-Host "🔍 Checking Vercel CLI..." -ForegroundColor Yellow
    try {
        $vercelVersion = vercel --version 2>&1
        Write-Host "✅ Vercel CLI v$vercelVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Vercel CLI not installed" -ForegroundColor Red
        Write-Host "   Install: npm install -g vercel@latest`n"
        exit 1
    }
}

# Deploy Frontend
if ($FrontendOnly -or $All) {
    Write-Host "`n" + ("="*60) -ForegroundColor Gray
    Write-Host "📦 DEPLOYING FRONTEND TO VERCEL" -ForegroundColor Cyan
    Write-Host ("="*60) + "`n" -ForegroundColor Gray
    
    # Pre-flight checks
    Write-Host "🔍 Running pre-flight checks..." -ForegroundColor Yellow
    
    if (-not (Test-Path "frontend/package.json")) {
        Write-Host "❌ frontend/package.json not found!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Frontend directory verified" -ForegroundColor Green
    
    # Test build
    Write-Host "`n🔨 Testing frontend build..." -ForegroundColor Yellow
    Push-Location frontend
    try {
        $env:NEXT_TELEMETRY_DISABLED = "1"
        npm run build 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Frontend build successful" -ForegroundColor Green
        } else {
            Write-Host "❌ Frontend build failed - check errors above" -ForegroundColor Red
            Pop-Location
            exit 1
        }
    } finally {
        Pop-Location
    }
    
    # Confirm production deployment
    Write-Host "`n⚠️  PRODUCTION DEPLOYMENT TO VERCEL" -ForegroundColor Red
    Write-Host "   This will deploy your app to the live production site." -ForegroundColor Yellow
    Write-Host "   URL: https://advancia.vercel.app`n"
    
    $confirm = Read-Host "Continue with production deployment? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "❌ Deployment cancelled`n" -ForegroundColor Yellow
        exit 0
    }
    
    # Deploy to Vercel
    Write-Host "`n🚀 Deploying to Vercel production...`n" -ForegroundColor Cyan
    vercel --prod --yes
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ FRONTEND DEPLOYED SUCCESSFULLY!`n" -ForegroundColor Green
        Write-Host "🌐 Live at: https://advancia.vercel.app" -ForegroundColor Cyan
        Write-Host "📊 Dashboard: https://vercel.com/dashboard`n" -ForegroundColor Gray
    } else {
        Write-Host "`n❌ Frontend deployment failed`n" -ForegroundColor Red
        exit 1
    }
}

# Deploy Backend
if ($BackendOnly -or $All) {
    Write-Host "`n" + ("="*60) -ForegroundColor Gray
    Write-Host "📦 BACKEND DEPLOYMENT INSTRUCTIONS" -ForegroundColor Cyan
    Write-Host ("="*60) + "`n" -ForegroundColor Gray
    
    Write-Host @"
Backend deployment requires manual steps:

🔧 OPTION A: Render Web Service (Recommended)
   1. Go to: https://dashboard.render.com/new/web
   2. Connect your GitHub repository
   3. Configure:
      - Name: advancia-backend
      - Build Command: cd backend && npm install && npm run build
      - Start Command: cd backend && npm start
   4. Add environment variables:
      - DATABASE_URL (from Render PostgreSQL)
      - FRONTEND_URL=https://advancia.vercel.app
      - NODE_ENV=production
      - JWT_SECRET (generate secure random string)

🔧 OPTION B: Digital Ocean Droplet
   1. SSH: ssh root@your-droplet-ip
   2. Pull latest: cd /var/www/advancia-backend && git pull
   3. Install: npm install
   4. Build: npm run build
   5. Restart: pm2 restart advancia-backend

📚 Full guide: See DEPLOYMENT_GUIDE.md

"@ -ForegroundColor Yellow
    
    Write-Host "Backend deployment information displayed above." -ForegroundColor Green
}

# Final Summary
Write-Host "`n" + ("="*60) -ForegroundColor Gray
Write-Host "✅ DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host ("="*60) + "`n" -ForegroundColor Gray

if ($FrontendOnly -or $All) {
    Write-Host "Frontend:" -ForegroundColor Cyan
    Write-Host "  ✅ Deployed to Vercel"
    Write-Host "  🌐 https://advancia.vercel.app`n"
}

if ($BackendOnly -or $All) {
    Write-Host "Backend:" -ForegroundColor Cyan
    Write-Host "  ⏳ Manual deployment required (see instructions above)"
    Write-Host "  📖 Guide: DEPLOYMENT_GUIDE.md`n"
}

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Test frontend: Open https://advancia.vercel.app"
Write-Host "  2. Verify API: Check network requests in browser DevTools"
Write-Host "  3. Monitor: vercel logs --prod"
Write-Host "  4. Database: Ensure Render PostgreSQL is connected`n"

Write-Host "🎉 Happy deploying!`n" -ForegroundColor Green
