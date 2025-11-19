#!/usr/bin/env pwsh
# DigitalOcean Backend Deployment Script
# Deploys backend to droplet at 157.245.8.131

param(
    [string]$DropletIP = "157.245.8.131",
    [string]$AppPath = "/var/www/advancia-backend",
    [string]$Branch = "main",
    [switch]$FullRestart,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
🚀 Advancia Pay Backend Deployment to DigitalOcean

USAGE:
  .\deploy-backend-do.ps1 [-DropletIP <ip>] [-Branch <branch>] [-FullRestart] [-Help]

OPTIONS:
  -DropletIP     Droplet IP address (default: 157.245.8.131)
  -AppPath       Application path on droplet (default: /var/www/advancia-backend)
  -Branch        Git branch to deploy (default: main)
  -FullRestart   Stop and start PM2 instead of reload
  -Help          Show this help message

EXAMPLES:
  .\deploy-backend-do.ps1                    # Quick deploy
  .\deploy-backend-do.ps1 -Branch preview    # Deploy preview branch
  .\deploy-backend-do.ps1 -FullRestart       # Full restart with PM2

PREREQUISITES:
  1. SSH key configured for root@$DropletIP
  2. Backend repo cloned at $AppPath
  3. PM2 installed and configured
  4. Environment variables set on droplet

"@
    exit 0
}

$ErrorActionPreference = "Continue"

Write-Host "`n🚀 Deploying Backend to DigitalOcean" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Droplet: $DropletIP" -ForegroundColor Yellow
Write-Host "Path:    $AppPath" -ForegroundColor Yellow
Write-Host "Branch:  $Branch`n" -ForegroundColor Yellow

# Check SSH connectivity
Write-Host "🔍 Testing SSH connection (you may need to enter password)..." -ForegroundColor Magenta
Write-Host "   If prompted, enter root password for $DropletIP" -ForegroundColor Yellow

# Deployment commands
$deployScript = @"
#!/bin/bash
set -e

echo "📦 Starting backend deployment..."

# Navigate to app directory
cd $AppPath || { echo "❌ App directory not found"; exit 1; }

# Check current branch
current_branch=\$(git branch --show-current)
echo "📍 Current branch: \$current_branch"

# Stash any local changes
git stash

# Fetch latest
echo "📥 Fetching latest changes..."
git fetch origin

# Checkout target branch
echo "🔀 Checking out $Branch..."
git checkout $Branch
git pull origin $Branch

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build TypeScript
echo "🔨 Building application..."
npm run build

# Database migrations (if needed)
if [ -f "prisma/schema.prisma" ]; then
    echo "🗄️ Running database migrations..."
    npx prisma migrate deploy
    npx prisma generate
fi

# PM2 restart strategy
if [ "$($FullRestart.IsPresent)" == "True" ]; then
    echo "🔄 Full restart with PM2..."
    pm2 stop advancia-backend || true
    pm2 delete advancia-backend || true
    PORT=4000 pm2 start npm --name advancia-backend -- start
else
    echo "🔄 Reloading with PM2 (zero-downtime)..."
    pm2 reload advancia-backend || PORT=4000 pm2 start npm --name advancia-backend -- start
fi

# Save PM2 configuration
pm2 save

# Health check
echo "🏥 Running health check..."
sleep 3
if curl -f http://localhost:4000/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "⚠️ Health check failed - checking logs..."
    pm2 logs advancia-backend --lines 20
    exit 1
fi

echo "✅ Deployment complete!"
echo "📊 PM2 Status:"
pm2 list

"@

# Write deployment script to temp file
$tempScript = [System.IO.Path]::GetTempFileName()
$deployScript | Out-File -FilePath $tempScript -Encoding UTF8

Write-Host "`n🚀 Executing deployment on droplet..." -ForegroundColor Cyan
Write-Host "   (Enter password when prompted)`n" -ForegroundColor Yellow

# Copy and execute deployment script
Get-Content $tempScript | ssh root@$DropletIP "bash -s"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "`n📊 Backend Status:" -ForegroundColor Cyan
    Write-Host "  URL:    https://api.advanciapayledger.com" -ForegroundColor White
    Write-Host "  Health: https://api.advanciapayledger.com/health" -ForegroundColor White
    Write-Host "  Droplet: ssh root@$DropletIP" -ForegroundColor Gray
    
    # Test health endpoint
    Write-Host "`n🏥 Testing production health endpoint..." -ForegroundColor Magenta
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri "https://api.advanciapayledger.com/health" -TimeoutSec 10
        Write-Host "✅ Production API is healthy!" -ForegroundColor Green
        Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
    } catch {
        Write-Host "⚠️ Production health check failed (may need DNS propagation)" -ForegroundColor Yellow
        Write-Host "   Try: ssh root@$DropletIP 'curl http://localhost:4000/health'" -ForegroundColor Gray
    }
} else {
    Write-Host "`n❌ DEPLOYMENT FAILED" -ForegroundColor Red
    Write-Host "   Check logs: ssh root@$DropletIP 'pm2 logs advancia-backend'" -ForegroundColor Yellow
    exit 1
}

# Cleanup
Remove-Item $tempScript -Force

Write-Host "`n📚 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Verify frontend can reach backend" -ForegroundColor White
Write-Host "  2. Check PM2 logs: ssh root@$DropletIP 'pm2 logs advancia-backend'" -ForegroundColor White
Write-Host "  3. Monitor metrics: ssh root@$DropletIP 'pm2 monit'" -ForegroundColor White
Write-Host ""
