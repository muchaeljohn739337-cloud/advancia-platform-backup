#!/usr/bin/env pwsh
# Sensitive Files Scanner and Protector
# Scans repository for potentially sensitive files and ensures proper protection

param(
    [Parameter(Mandatory=$false)]
    [switch]$Fix = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Detailed = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🔍 Sensitive Files Scanner" -ForegroundColor Cyan
Write-Host "=" * 80

# Define sensitive file patterns
$sensitivePatterns = @{
    "Environment Files" = @(
        "*.env",
        ".env.*",
        "*.env.local",
        "*.env.production",
        "*.env.staging"
    )
    "Key Files" = @(
        "*.pem",
        "*.key",
        "*.p12",
        "*.pfx",
        "*.asc"
    )
    "Config Files" = @(
        "*secrets*.json",
        "*credentials*.json",
        "*.keystore"
    )
    "Database Dumps" = @(
        "*.sql",
        "*.dump",
        "*.backup",
        "backup.dump"
    )
    "SSH/GPG Keys" = @(
        "id_rsa*",
        "id_dsa*",
        "id_ed25519*",
        "*.ppk"
    )
}

# Define sensitive patterns to search in files
$contentPatterns = @(
    @{
        Name = "Hardcoded Passwords"
        Pattern = 'password\s*[:=]\s*[''"](?!.*YOUR_|.*CHANGE_|.*EXAMPLE)[^''"]+'
        Severity = "HIGH"
    },
    @{
        Name = "AWS Keys"
        Pattern = 'AKIA[0-9A-Z]{16}'
        Severity = "CRITICAL"
    },
    @{
        Name = "GitHub Tokens"
        Pattern = 'ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82}'
        Severity = "CRITICAL"
    },
    @{
        Name = "Stripe Keys (Live)"
        Pattern = 'sk_live_[a-zA-Z0-9]{24,}'
        Severity = "CRITICAL"
    },
    @{
        Name = "Stripe Keys (Test) - Production"
        Pattern = 'sk_test_[a-zA-Z0-9]{24,}'
        Severity = "MEDIUM"
    },
    @{
        Name = "Private Keys"
        Pattern = '-----BEGIN (RSA|DSA|EC|OPENSSH|PGP) PRIVATE KEY-----'
        Severity = "CRITICAL"
    },
    @{
        Name = "JWT Secrets"
        Pattern = 'JWT_SECRET\s*[:=]\s*[''"](?!.*YOUR_|.*CHANGE_|.*dev_secret)[^''"]+'
        Severity = "HIGH"
    },
    @{
        Name = "Database URLs with Credentials"
        Pattern = 'postgresql://[^:]+:[^@]+@(?!localhost|127\.0\.0\.1|postgres:postgres)'
        Severity = "HIGH"
    },
    @{
        Name = "Generic Secrets"
        Pattern = 'secret[_-]?key\s*[:=]\s*[''"](?!.*YOUR_|.*CHANGE_|.*EXAMPLE|.*test)[^''"]+'
        Severity = "MEDIUM"
    }
)

$issues = @()
$filesScanned = 0

# Function to check if file should be ignored
function Should-Ignore {
    param($path)
    
    $ignorePaths = @(
        "node_modules",
        ".git",
        "dist",
        "build",
        ".next",
        "coverage",
        "SECURITY_AUDIT",
        "SECRET_MANAGEMENT_GUIDE",
        ".example"
    )
    
    foreach ($ignore in $ignorePaths) {
        if ($path -like "*$ignore*") {
            return $true
        }
    }
    return $false
}

# Scan for sensitive file patterns
Write-Host "`n🔎 Scanning for sensitive file patterns..." -ForegroundColor Yellow

foreach ($category in $sensitivePatterns.Keys) {
    Write-Host "`nChecking: $category" -ForegroundColor Cyan
    
    foreach ($pattern in $sensitivePatterns[$category]) {
        $files = Get-ChildItem -Path . -Filter $pattern -Recurse -ErrorAction SilentlyContinue | 
                 Where-Object { -not (Should-Ignore $_.FullName) }
        
        foreach ($file in $files) {
            $relativePath = $file.FullName.Replace($PWD.Path, ".").Replace("\", "/")
            
            # Check if file is tracked by git
            $isTracked = $false
            try {
                $gitCheck = git ls-files --error-unmatch $file.FullName 2>&1
                $isTracked = $LASTEXITCODE -eq 0
            } catch {}
            
            if ($isTracked) {
                $issues += @{
                    Type = "Sensitive File"
                    Category = $category
                    File = $relativePath
                    Severity = "HIGH"
                    Message = "Sensitive file is tracked by git"
                }
                Write-Host "  ❌ TRACKED: $relativePath" -ForegroundColor Red
            } else {
                if ($Detailed) {
                    Write-Host "  ✅ Ignored: $relativePath" -ForegroundColor Green
                }
            }
        }
    }
}

# Scan file contents for sensitive patterns
Write-Host "`n🔍 Scanning file contents for secrets..." -ForegroundColor Yellow

$filesToScan = Get-ChildItem -Path . -Include "*.sh","*.ps1","*.js","*.ts","*.json","*.yml","*.yaml","*.md","*.txt" -Recurse -ErrorAction SilentlyContinue |
               Where-Object { -not (Should-Ignore $_.FullName) }

foreach ($file in $filesToScan) {
    $filesScanned++
    $relativePath = $file.FullName.Replace($PWD.Path, ".").Replace("\", "/")
    
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        
        foreach ($pattern in $contentPatterns) {
            if ($content -match $pattern.Pattern) {
                $matches = [regex]::Matches($content, $pattern.Pattern)
                
                foreach ($match in $matches) {
                    # Skip if it's in a comment explaining the pattern
                    $lineNumber = ($content.Substring(0, $match.Index) -split "`n").Count
                    
                    $issues += @{
                        Type = "Secret in Content"
                        Category = $pattern.Name
                        File = $relativePath
                        Line = $lineNumber
                        Severity = $pattern.Severity
                        Message = "Potential secret found: $($match.Value.Substring(0, [Math]::Min(50, $match.Value.Length)))..."
                    }
                    
                    $color = switch ($pattern.Severity) {
                        "CRITICAL" { "Red" }
                        "HIGH" { "Yellow" }
                        "MEDIUM" { "Cyan" }
                        default { "White" }
                    }
                    
                    Write-Host "  [$($pattern.Severity)] $relativePath:$lineNumber - $($pattern.Name)" -ForegroundColor $color
                }
            }
        }
    } catch {
        # Skip binary or unreadable files
    }
}

# Check .gitignore coverage
Write-Host "`n🔒 Checking .gitignore protection..." -ForegroundColor Yellow

$requiredIgnores = @(
    ".env",
    ".env.local",
    ".env.*.local",
    ".env.production",
    ".env.staging",
    "*.pem",
    "*.key",
    "*.p12",
    "*.pfx",
    "*secrets*.json",
    "*.dump",
    "backup.dump"
)

$gitignorePath = ".gitignore"
if (Test-Path $gitignorePath) {
    $gitignoreContent = Get-Content $gitignorePath -Raw
    
    foreach ($pattern in $requiredIgnores) {
        if ($gitignoreContent -notmatch [regex]::Escape($pattern)) {
            $issues += @{
                Type = "Missing Gitignore"
                Category = "Protection"
                File = ".gitignore"
                Severity = "MEDIUM"
                Message = "Pattern '$pattern' not found in .gitignore"
            }
            Write-Host "  ⚠️  Missing: $pattern" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "  ❌ .gitignore not found!" -ForegroundColor Red
}

# Summary Report
Write-Host "`n" + ("=" * 80) -ForegroundColor Cyan
Write-Host "📊 SCAN SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor Cyan

Write-Host "`nFiles Scanned: $filesScanned" -ForegroundColor White

$critical = ($issues | Where-Object { $_.Severity -eq "CRITICAL" }).Count
$high = ($issues | Where-Object { $_.Severity -eq "HIGH" }).Count
$medium = ($issues | Where-Object { $_.Severity -eq "MEDIUM" }).Count

Write-Host "`nIssues Found:" -ForegroundColor White
Write-Host "  🔴 CRITICAL: $critical" -ForegroundColor Red
Write-Host "  🟡 HIGH: $high" -ForegroundColor Yellow
Write-Host "  🔵 MEDIUM: $medium" -ForegroundColor Cyan
Write-Host "  📝 TOTAL: $($issues.Count)" -ForegroundColor White

if ($issues.Count -gt 0) {
    Write-Host "`n⚠️  ACTION REQUIRED" -ForegroundColor Red
    Write-Host "Review and fix all issues above before committing!" -ForegroundColor Yellow
    
    if ($Fix) {
        Write-Host "`n🔧 Applying automatic fixes..." -ForegroundColor Cyan
        
        # Add missing .gitignore patterns
        if (Test-Path $gitignorePath) {
            $gitignoreContent = Get-Content $gitignorePath -Raw
            $added = $false
            
            foreach ($pattern in $requiredIgnores) {
                if ($gitignoreContent -notmatch [regex]::Escape($pattern)) {
                    Add-Content -Path $gitignorePath -Value $pattern
                    Write-Host "  ✅ Added '$pattern' to .gitignore" -ForegroundColor Green
                    $added = $true
                }
            }
            
            if ($added) {
                Write-Host "`n✅ Updated .gitignore with missing patterns" -ForegroundColor Green
            }
        }
        
        Write-Host "`n⚠️  Manual fixes still required for exposed secrets!" -ForegroundColor Yellow
        Write-Host "Run: git grep -E '(sk_live_|ghp_|AKIA)' to find and remove them" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n✅ No sensitive files or secrets detected!" -ForegroundColor Green
}

Write-Host "`n📚 Recommendations:" -ForegroundColor Cyan
Write-Host "  1. Review SECRET_MANAGEMENT_GUIDE.md" -ForegroundColor White
Write-Host "  2. Use environment variables for secrets" -ForegroundColor White
Write-Host "  3. Never commit .env files" -ForegroundColor White
Write-Host "  4. Rotate any exposed credentials immediately" -ForegroundColor White
Write-Host "  5. Enable GitHub secret scanning" -ForegroundColor White

if ($issues.Count -gt 0) {
    exit 1
}
