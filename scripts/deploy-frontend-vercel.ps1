# Deploy Frontend to Vercel - PowerShell Script
# Usage: .\scripts\deploy-frontend-vercel.ps1

Write-Host "`n🚀 Deploying Frontend to Vercel`n" -ForegroundColor Cyan
Write-Host "============================================================`n"

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "⚠️  Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Vercel CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Vercel CLI installed`n" -ForegroundColor Green
}

# Navigate to frontend directory
Set-Location "$PSScriptRoot\..\frontend"

# Build frontend
Write-Host "📦 Building frontend..." -ForegroundColor Yellow
pnpm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend built successfully`n" -ForegroundColor Green

# Deploy to Vercel
Write-Host "🌐 Deploying to Vercel..." -ForegroundColor Yellow
Write-Host "   (You may need to login or select your project)`n"

# Deploy with production flag
vercel --prod

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Vercel deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Deployment completed!`n" -ForegroundColor Green
Write-Host "============================================================"
Write-Host "`n📋 Next Steps:"
Write-Host "1. Check deployment URL in Vercel dashboard"
Write-Host "2. Verify environment variables are set:"
Write-Host "   - NEXT_PUBLIC_API_URL"
Write-Host "   - NEXTAUTH_URL"
Write-Host "   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
Write-Host "3. Test frontend API calls to backend"
Write-Host "4. Monitor Vercel deployment logs for errors"
Write-Host "`n🔗 Vercel Dashboard: https://vercel.com/dashboard`n"
