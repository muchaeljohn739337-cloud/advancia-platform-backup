#!/usr/bin/env pwsh
# Apply Wallet Migration to Production - PowerShell Script
# Usage: .\scripts\apply-production-migration.ps1

param(
    [string]$DatabaseUrl = $env:DATABASE_URL,
    [switch]$Backup = $true,
    [switch]$DryRun = $false
)

Write-Host "`n🔧 Wallet System Migration - Production Deployment`n" -ForegroundColor Cyan
Write-Host "============================================================`n"

if (-not $DatabaseUrl) {
    Write-Host "❌ DATABASE_URL environment variable not set" -ForegroundColor Red
    Write-Host "   Set it with: `$env:DATABASE_URL='postgresql://user:pass@host:port/db'`n"
    exit 1
}

# Validate we're not running against localhost/test DB accidentally
if ($DatabaseUrl -match "localhost|127\.0\.0\.1|test") {
    Write-Host "⚠️  WARNING: Database URL contains 'localhost' or 'test'" -ForegroundColor Yellow
    $confirm = Read-Host "Are you sure you want to continue? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "❌ Migration cancelled`n"
        exit 1
    }
}

$migrationFile = "$PSScriptRoot\apply-wallet-migration.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Migration Details:" -ForegroundColor Yellow
Write-Host "   File: $migrationFile"
Write-Host "   Database: $($DatabaseUrl -replace 'postgresql://[^@]+@', 'postgresql://***@')"
Write-Host "   Backup: $Backup"
Write-Host "   Dry Run: $DryRun`n"

# Step 1: Backup database (if enabled)
if ($Backup -and -not $DryRun) {
    Write-Host "💾 Creating database backup..." -ForegroundColor Yellow
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "$PSScriptRoot\..\backups\wallet_migration_backup_$timestamp.sql"
    
    # Create backups directory if it doesn't exist
    $backupDir = "$PSScriptRoot\..\backups"
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    }
    
    # Use pg_dump to backup
    $dbName = if ($DatabaseUrl -match "/([^/?]+)(\?|$)") { $matches[1] } else { "advancia_db" }
    pg_dump $DatabaseUrl > $backupFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backup created: $backupFile`n" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Backup failed, but continuing...`n" -ForegroundColor Yellow
    }
}

# Step 2: Check if migration already applied
Write-Host "🔍 Checking if migration already applied..." -ForegroundColor Yellow
$checkQuery = "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crypto_wallet_keys');"
$tableExists = psql $DatabaseUrl -t -c $checkQuery 2>$null

if ($tableExists -match "t") {
    Write-Host "⚠️  crypto_wallet_keys table already exists" -ForegroundColor Yellow
    $confirm = Read-Host "Do you want to continue anyway? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "❌ Migration cancelled`n"
        exit 0
    }
}

# Step 3: Apply migration
if ($DryRun) {
    Write-Host "`n🔍 DRY RUN MODE - Migration preview:`n" -ForegroundColor Cyan
    Get-Content $migrationFile
    Write-Host "`n✅ Dry run completed. No changes made.`n" -ForegroundColor Green
    exit 0
}

Write-Host "🚀 Applying migration..." -ForegroundColor Yellow
psql $DatabaseUrl -f $migrationFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migration applied successfully!`n" -ForegroundColor Green
    
    # Verify tables created
    Write-Host "✔️  Verifying migration..." -ForegroundColor Yellow
    $verifyQuery = @"
SELECT 
    table_name, 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name IN ('crypto_wallet_keys', 'crypto_wallet_history')
ORDER BY table_name;
"@
    psql $DatabaseUrl -c $verifyQuery
    
    Write-Host "`n✅ Migration verification completed`n" -ForegroundColor Green
} else {
    Write-Host "❌ Migration failed!`n" -ForegroundColor Red
    if ($Backup) {
        Write-Host "⚠️  Restore from backup if needed: $backupFile`n" -ForegroundColor Yellow
    }
    exit 1
}

Write-Host "============================================================"
Write-Host "`n📋 Post-Migration Checklist:"
Write-Host "1. ✅ Run wallet generation test: node backend/test-wallet.js"
Write-Host "2. ✅ Restart backend services: pm2 restart all"
Write-Host "3. ✅ Monitor logs for errors: pm2 logs"
Write-Host "4. ✅ Test wallet API endpoints"
Write-Host "5. ✅ Verify wallet encryption keys in environment`n"
