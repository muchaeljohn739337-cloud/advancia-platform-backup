#!/usr/bin/env pwsh
# Complete SaaS Deployment Orchestrator
# Handles: Frontend deploy, DB migration, testing, monitoring
# Usage: .\scripts\saas-deploy-orchestrator.ps1 -Environment production

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("staging", "production")]
    [string]$Environment = "production",
    
    [switch]$SkipFrontend = $false,
    [switch]$SkipMigration = $false,
    [switch]$SkipTests = $false,
    [string]$DatabaseUrl = $env:DATABASE_URL,
    [string]$ApiUrl = "https://api.advanciapayledger.com"
)

$ErrorActionPreference = "Stop"

Write-Host "`n🚀 SaaS Deployment Orchestrator`n" -ForegroundColor Cyan
Write-Host "============================================================`n"

Write-Host "📋 Deployment Configuration:" -ForegroundColor Yellow
Write-Host "   Environment: $Environment"
Write-Host "   API URL: $ApiUrl"
Write-Host "   Skip Frontend: $SkipFrontend"
Write-Host "   Skip Migration: $SkipMigration"
Write-Host "   Skip Tests: $SkipTests`n"

# Initialize deployment log
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = "$PSScriptRoot\..\logs\deployment_$timestamp.log"
$logDir = "$PSScriptRoot\..\logs"

if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $logMessage = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [$Level] $Message"
    Add-Content -Path $logFile -Value $logMessage
    Write-Host $Message
}

# ============================================================
# STEP 1: Pre-Deployment Checks
# ============================================================
Write-Host "`n📋 Step 1: Pre-Deployment Checks`n" -ForegroundColor Cyan
Write-Log "Starting pre-deployment checks" "INFO"

# Check if git is clean
$gitStatus = git status --porcelain 2>&1
if ($gitStatus) {
    Write-Host "⚠️  Uncommitted changes detected:" -ForegroundColor Yellow
    Write-Host $gitStatus
    $continue = Read-Host "Continue anyway? (yes/no)"
    if ($continue -ne "yes") {
        Write-Log "Deployment cancelled due to uncommitted changes" "WARN"
        exit 0
    }
}

# Check current branch
$currentBranch = git branch --show-current
Write-Host "✓ Current branch: $currentBranch" -ForegroundColor Green
Write-Log "Deploying from branch: $currentBranch" "INFO"

# Verify environment variables
if (-not $SkipMigration -and -not $DatabaseUrl) {
    Write-Host "❌ DATABASE_URL not set (required for migration)" -ForegroundColor Red
    Write-Log "DATABASE_URL not configured" "ERROR"
    exit 1
}

Write-Host "✅ Pre-deployment checks passed`n" -ForegroundColor Green

# ============================================================
# STEP 2: Deploy Frontend to Vercel
# ============================================================
if (-not $SkipFrontend) {
    Write-Host "`n📦 Step 2: Deploying Frontend to Vercel`n" -ForegroundColor Cyan
    Write-Log "Starting frontend deployment" "INFO"
    
    try {
        & "$PSScriptRoot\deploy-frontend-vercel.ps1"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Frontend deployed successfully`n" -ForegroundColor Green
            Write-Log "Frontend deployment completed" "INFO"
        } else {
            throw "Frontend deployment failed"
        }
    } catch {
        Write-Host "❌ Frontend deployment failed: $($_.Exception.Message)`n" -ForegroundColor Red
        Write-Log "Frontend deployment failed: $($_.Exception.Message)" "ERROR"
        exit 1
    }
} else {
    Write-Host "`nℹ️  Skipping frontend deployment`n" -ForegroundColor Cyan
}

# ============================================================
# STEP 3: Apply Database Migration
# ============================================================
if (-not $SkipMigration) {
    Write-Host "`n💾 Step 3: Applying Database Migration`n" -ForegroundColor Cyan
    Write-Log "Starting database migration" "INFO"
    
    try {
        & "$PSScriptRoot\apply-production-migration.ps1" -DatabaseUrl $DatabaseUrl
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database migration completed`n" -ForegroundColor Green
            Write-Log "Database migration completed" "INFO"
        } else {
            throw "Database migration failed"
        }
    } catch {
        Write-Host "❌ Database migration failed: $($_.Exception.Message)`n" -ForegroundColor Red
        Write-Log "Database migration failed: $($_.Exception.Message)" "ERROR"
        
        $rollback = Read-Host "Attempt to rollback? (yes/no)"
        if ($rollback -eq "yes") {
            Write-Host "⚠️  Manual rollback required - restore from backup`n" -ForegroundColor Yellow
        }
        exit 1
    }
} else {
    Write-Host "`nℹ️  Skipping database migration`n" -ForegroundColor Cyan
}

# ============================================================
# STEP 4: Run Integration Tests
# ============================================================
if (-not $SkipTests) {
    Write-Host "`n🧪 Step 4: Running Integration Tests`n" -ForegroundColor Cyan
    Write-Log "Starting integration tests" "INFO"
    
    # Wait for services to be ready
    Write-Host "⏳ Waiting 30 seconds for services to stabilize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    try {
        & "$PSScriptRoot\run-production-tests.ps1" -ApiUrl $ApiUrl -TestType "all"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Integration tests passed`n" -ForegroundColor Green
            Write-Log "Integration tests passed" "INFO"
        } else {
            Write-Host "⚠️  Some tests failed - check logs`n" -ForegroundColor Yellow
            Write-Log "Integration tests failed" "WARN"
        }
    } catch {
        Write-Host "❌ Integration tests error: $($_.Exception.Message)`n" -ForegroundColor Red
        Write-Log "Integration tests error: $($_.Exception.Message)" "ERROR"
    }
} else {
    Write-Host "`nℹ️  Skipping integration tests`n" -ForegroundColor Cyan
}

# ============================================================
# STEP 5: Post-Deployment Verification
# ============================================================
Write-Host "`n✅ Step 5: Post-Deployment Verification`n" -ForegroundColor Cyan
Write-Log "Starting post-deployment verification" "INFO"

# Test API health
Write-Host "🏥 Testing API health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$ApiUrl/health" -Method Get -TimeoutSec 10
    if ($healthResponse.status -eq "ok") {
        Write-Host "✅ API is healthy`n" -ForegroundColor Green
        Write-Log "API health check passed" "INFO"
    }
} catch {
    Write-Host "❌ API health check failed`n" -ForegroundColor Red
    Write-Log "API health check failed" "ERROR"
}

# Check Vercel deployment status
Write-Host "🌐 Vercel deployment:" -ForegroundColor Yellow
Write-Host "   Dashboard: https://vercel.com/dashboard`n"

# ============================================================
# DEPLOYMENT SUMMARY
# ============================================================
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "`n📊 Deployment Summary`n" -ForegroundColor Cyan

$summary = @"
Environment: $Environment
Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Branch: $currentBranch

✅ Deployment Steps Completed:
$(if (-not $SkipFrontend) { "   ✓ Frontend deployed to Vercel" } else { "   ○ Frontend deployment skipped" })
$(if (-not $SkipMigration) { "   ✓ Database migration applied" } else { "   ○ Database migration skipped" })
$(if (-not $SkipTests) { "   ✓ Integration tests executed" } else { "   ○ Integration tests skipped" })
   ✓ Post-deployment verification completed

📋 Next Steps:
1. Monitor Vercel logs: https://vercel.com/dashboard
2. Check backend PM2 logs: pm2 logs
3. Verify Sentry for errors: https://sentry.io
4. Test user flows on production frontend
5. Monitor database performance
6. Check API rate limits and CORS

📝 Deployment Log: $logFile
"@

Write-Host $summary
Write-Log $summary "INFO"

Write-Host "`n🎉 Deployment orchestration completed!`n" -ForegroundColor Green
Write-Log "Deployment orchestration completed successfully" "INFO"

# Open important URLs (optional)
$openDashboards = Read-Host "Open monitoring dashboards? (yes/no)"
if ($openDashboards -eq "yes") {
    Start-Process "https://vercel.com/dashboard"
    Start-Process "https://sentry.io"
}
