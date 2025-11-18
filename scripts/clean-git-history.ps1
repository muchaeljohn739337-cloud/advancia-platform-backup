#!/usr/bin/env pwsh
# Clean Git History - Remove Exposed Secrets
# ⚠️  WARNING: This rewrites Git history!

param(
    [Parameter(Mandatory=$false)]
    [switch]$Force = $false
)

Write-Host "⚠️  GIT HISTORY CLEANUP - DESTRUCTIVE OPERATION" -ForegroundColor Red
Write-Host "=" * 80
Write-Host ""

if (-not $Force) {
    Write-Host "This script will:" -ForegroundColor Yellow
    Write-Host "  1. Rewrite entire Git history" -ForegroundColor White
    Write-Host "  2. Remove all traces of exposed secrets" -ForegroundColor White
    Write-Host "  3. Force push to remote (destructive)" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  All team members MUST re-clone after this!" -ForegroundColor Red
    Write-Host ""
    
    $confirm = Read-Host "Type 'DELETE-HISTORY' to continue"
    
    if ($confirm -ne "DELETE-HISTORY") {
        Write-Host "❌ Aborted" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🔄 Creating backup..." -ForegroundColor Cyan

# Create backup branch
$backupBranch = "backup-before-history-clean-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
git branch $backupBranch
Write-Host "✅ Backup branch created: $backupBranch" -ForegroundColor Green

Write-Host ""
Write-Host "🗑️  Removing sensitive files from history..." -ForegroundColor Cyan

# Files to completely remove from history
$filesToRemove = @(
    "fix-env.sh",
    "SYSTEMATIC_FIX_GUIDE.md",
    "scripts/setup-docker-registry.ps1"
)

foreach ($file in $filesToRemove) {
    Write-Host "  Removing: $file" -ForegroundColor Yellow
    
    git filter-branch --force --index-filter `
        "git rm --cached --ignore-unmatch $file" `
        --prune-empty --tag-name-filter cat -- --all
}

Write-Host ""
Write-Host "🧹 Cleaning up..." -ForegroundColor Cyan

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

Write-Host "✅ Git history cleaned" -ForegroundColor Green
Write-Host ""

Write-Host "📤 Ready to force push" -ForegroundColor Yellow
Write-Host ""
Write-Host "Run these commands to push:" -ForegroundColor White
Write-Host "  git push origin --force --all" -ForegroundColor Cyan
Write-Host "  git push origin --force --tags" -ForegroundColor Cyan
Write-Host ""
Write-Host "📧 Notify team members to re-clone:" -ForegroundColor Yellow
Write-Host "  git clone https://github.com/muchaeljohn739337-cloud/-modular-saas-platform.git" -ForegroundColor Cyan
Write-Host ""

$pushNow = Read-Host "Force push now? (y/n)"
if ($pushNow -eq 'y') {
    Write-Host ""
    Write-Host "🚀 Force pushing..." -ForegroundColor Cyan
    
    git push origin --force --all
    git push origin --force --tags
    
    Write-Host "✅ Force push complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Git history successfully cleaned!" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Skipped force push. Run manually when ready." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Backup branch available at: $backupBranch" -ForegroundColor Cyan
