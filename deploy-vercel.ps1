#!/usr/bin/env pwsh
# Vercel Production Deployment Script
# Usage: .\deploy-vercel.ps1

param(
    [switch]$Production,
    [switch]$Preview,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
🚀 Vercel Deployment Script

USAGE:
  .\deploy-vercel.ps1 [-Production] [-Preview] [-Help]

OPTIONS:
  -Production    Deploy to production (requires confirmation)
  -Preview       Deploy to preview/staging
  -Help          Show this help message

EXAMPLES:
  .\deploy-vercel.ps1 -Preview      # Deploy to preview
  .\deploy-vercel.ps1 -Production   # Deploy to production

PREREQUISITES:
  1. Vercel CLI installed: npm i -g vercel@latest
  2. Vercel token set: vercel login
  3. Frontend environment variables configured

"@
    exit 0
}

Write-Host "🚀 Advancia Pay - Vercel Deployment`n" -ForegroundColor Cyan

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version 2>&1
    Write-Host "✅ Vercel CLI v$vercelVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Install it first:" -ForegroundColor Red
    Write-Host "   npm install -g vercel@latest`n"
    exit 1
}

# Check if in correct directory
if (-not (Test-Path "frontend/package.json")) {
    Write-Host "❌ Error: Must run from project root directory" -ForegroundColor Red
    Write-Host "   Current: $PWD" -ForegroundColor Yellow
    exit 1
}

Write-Host "📁 Project root: $PWD" -ForegroundColor Gray

# Determine deployment target
$deployTarget = if ($Production) { "production" } else { "preview" }
$deployFlag = if ($Production) { "--prod" } else { "" }

Write-Host "📦 Deployment target: $deployTarget`n" -ForegroundColor Yellow

if ($Production) {
    Write-Host "⚠️  PRODUCTION DEPLOYMENT" -ForegroundColor Red
    Write-Host "   This will deploy to your live production site.`n" -ForegroundColor Yellow
    
    $confirm = Read-Host "Continue? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "❌ Deployment cancelled" -ForegroundColor Yellow
        exit 0
    }
}

# Pre-deployment checks
Write-Host "`n🔍 Running pre-deployment checks..." -ForegroundColor Cyan

# Check frontend build
Write-Host "   • Testing frontend build..." -ForegroundColor Gray
Push-Location frontend
try {
    $env:NEXT_TELEMETRY_DISABLED = "1"
    $buildTest = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Frontend build successful" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Frontend build failed" -ForegroundColor Red
        Write-Host $buildTest
        Pop-Location
        exit 1
    }
} finally {
    Pop-Location
}

# Deploy to Vercel
Write-Host "`n🚀 Deploying to Vercel ($deployTarget)...`n" -ForegroundColor Cyan

if ($Production) {
    vercel --prod --yes
} else {
    vercel --yes
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deployment successful!`n" -ForegroundColor Green
    
    if ($Production) {
        Write-Host "🌐 Your site is live at: https://advancia.vercel.app" -ForegroundColor Cyan
        Write-Host "📊 View deployment: https://vercel.com/dashboard`n" -ForegroundColor Gray
    } else {
        Write-Host "🌐 Preview URL will be shown above" -ForegroundColor Cyan
        Write-Host "📊 View deployment: https://vercel.com/dashboard`n" -ForegroundColor Gray
    }
    
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Test the deployment in your browser"
    Write-Host "  2. Check API connectivity"
    Write-Host "  3. Monitor logs: vercel logs`n"
} else {
    Write-Host "`n❌ Deployment failed. Check the errors above.`n" -ForegroundColor Red
    exit 1
}
