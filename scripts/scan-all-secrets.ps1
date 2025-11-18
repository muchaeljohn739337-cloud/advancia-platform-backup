#!/usr/bin/env pwsh
# Comprehensive Secret Scanner
# Scans entire repository for exposed secrets

Write-Host "🔍 Comprehensive Secret Scanner" -ForegroundColor Cyan
Write-Host "=" * 80
Write-Host ""

$issuesFound = 0
$criticalCount = 0
$highCount = 0
$mediumCount = 0

# Define patterns
$patterns = @{
    "CRITICAL - AWS Keys" = @{
        Pattern = "AKIA[0-9A-Z]{16}"
        Files = "*"
    }
    "CRITICAL - GitHub PAT" = @{
        Pattern = "ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}"
        Files = "*"
    }
    "CRITICAL - Stripe Live Keys" = @{
        Pattern = "sk_live_[a-zA-Z0-9]{24,}"
        Files = "*"
    }
    "CRITICAL - Private Keys" = @{
        Pattern = "-----BEGIN.*PRIVATE KEY-----"
        Files = "*"
    }
    "HIGH - Stripe Test Keys" = @{
        Pattern = "sk_test_[a-zA-Z0-9]{24,}|pk_test_[a-zA-Z0-9]{24,}"
        Files = "*"
    }
    "HIGH - Database URLs" = @{
        Pattern = "(postgres|mysql)://[^:]+:[^@]+@(?!localhost|127\.0\.0\.1|postgres:postgres)"
        Files = "*"
    }
    "HIGH - JWT/Session Secrets" = @{
        Pattern = "(JWT_SECRET|SESSION_SECRET)\s*[:=]\s*['""][^'""]{40,}['""]"
        Files = "*.sh,*.ps1,*.md,*.ts,*.js"
    }
    "MEDIUM - Hardcoded Passwords" = @{
        Pattern = "password\s*[:=]\s*['""][^YOUR_][^'""]{8,}['""]"
        Files = "*.sh,*.ps1"
    }
}

Write-Host "Scanning repository..." -ForegroundColor Yellow
Write-Host ""

foreach ($category in $patterns.Keys) {
    $pattern = $patterns[$category]
    
    Write-Host "[$category]" -ForegroundColor Cyan
    
    try {
        $results = git grep -niE $pattern.Pattern -- `
            ':!SECURITY_AUDIT*.md' `
            ':!SECRET_MANAGEMENT_GUIDE.md' `
            ':!SENSITIVE_FILES_PROTECTION.md' `
            ':!node_modules' `
            ':!.git' `
            ':!dist' `
            ':!build' `
            ':!NEW_SECRETS_*.txt' 2>$null
        
        if ($results) {
            $issuesFound++
            
            if ($category -like "CRITICAL*") {
                $criticalCount++
                Write-Host "  🔴 FOUND:" -ForegroundColor Red
            } elseif ($category -like "HIGH*") {
                $highCount++
                Write-Host "  🟡 FOUND:" -ForegroundColor Yellow
            } else {
                $mediumCount++
                Write-Host "  🔵 FOUND:" -ForegroundColor Cyan
            }
            
            $results | ForEach-Object {
                Write-Host "    $_" -ForegroundColor Gray
            }
        } else {
            Write-Host "  ✅ None found" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ✅ None found" -ForegroundColor Green
    }
    
    Write-Host ""
}

# Check for sensitive files
Write-Host "[Sensitive File Patterns]" -ForegroundColor Cyan

$sensitiveFiles = @(
    "*.env",
    "*.pem",
    "*.key",
    "*.p12",
    "*.pfx",
    "*secrets*.json",
    "*.dump"
)

foreach ($filePattern in $sensitiveFiles) {
    try {
        $tracked = git ls-files $filePattern 2>$null | Where-Object { $_ -notlike "*.example" }
        
        if ($tracked) {
            Write-Host "  🔴 TRACKED: $filePattern" -ForegroundColor Red
            $tracked | ForEach-Object {
                Write-Host "    $_" -ForegroundColor Gray
            }
            $issuesFound++
            $criticalCount++
        }
    } catch {}
}

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "📊 SCAN SUMMARY" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

Write-Host "Issues Found:" -ForegroundColor White
Write-Host "  🔴 CRITICAL: $criticalCount" -ForegroundColor Red
Write-Host "  🟡 HIGH: $highCount" -ForegroundColor Yellow
Write-Host "  🔵 MEDIUM: $mediumCount" -ForegroundColor Cyan
Write-Host "  📝 TOTAL: $issuesFound" -ForegroundColor White
Write-Host ""

if ($issuesFound -gt 0) {
    Write-Host "⚠️  ACTION REQUIRED" -ForegroundColor Red
    Write-Host "Review and remove all secrets found above!" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ No secrets detected!" -ForegroundColor Green
    exit 0
}
