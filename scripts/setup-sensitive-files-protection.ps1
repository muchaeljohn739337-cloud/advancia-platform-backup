#!/usr/bin/env pwsh
# Setup Sensitive Files Protection
# Quick installer for security scanning tools

param(
    [Parameter(Mandatory=$false)]
    [switch]$InstallHook = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$RunScan = $false
)

Write-Host "🔒 Sensitive Files Protection Setup" -ForegroundColor Cyan
Write-Host "=" * 80

# Check if git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not a git repository" -ForegroundColor Red
    Write-Host "Run this script from the root of your git repository" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n📋 Setup Options:" -ForegroundColor Yellow
Write-Host "  1. Install pre-commit hook (recommended)" -ForegroundColor White
Write-Host "  2. Run initial security scan" -ForegroundColor White
Write-Host "  3. Verify .gitignore configuration" -ForegroundColor White
Write-Host ""

$choice = $null
if (-not $InstallHook -and -not $RunScan) {
    $choice = Read-Host "Select option (1-3, or 'all' for everything)"
}

# Function to install pre-commit hook
function Install-PreCommitHook {
    Write-Host "`n🔧 Installing pre-commit hook..." -ForegroundColor Cyan
    
    $hookPath = ".git\hooks\pre-commit"
    $sourcePath = "scripts\pre-commit.sh"
    
    if (-not (Test-Path $sourcePath)) {
        Write-Host "❌ Error: $sourcePath not found" -ForegroundColor Red
        return $false
    }
    
    # Create hooks directory if it doesn't exist
    $hooksDir = ".git\hooks"
    if (-not (Test-Path $hooksDir)) {
        New-Item -ItemType Directory -Path $hooksDir -Force | Out-Null
    }
    
    # Copy the hook
    Copy-Item $sourcePath $hookPath -Force
    
    # On Unix systems, make it executable
    if ($IsLinux -or $IsMacOS) {
        chmod +x $hookPath
    }
    
    Write-Host "✅ Pre-commit hook installed successfully!" -ForegroundColor Green
    Write-Host "   Location: $hookPath" -ForegroundColor Gray
    return $true
}

# Function to run security scan
function Run-SecurityScan {
    Write-Host "`n🔍 Running security scan..." -ForegroundColor Cyan
    
    if (Test-Path "scripts\scan-sensitive-files.ps1") {
        & ".\scripts\scan-sensitive-files.ps1" -Detailed
    } elseif (Test-Path "scripts/scan-sensitive-files.sh") {
        bash scripts/scan-sensitive-files.sh --detailed
    } else {
        Write-Host "❌ Error: Scanner script not found" -ForegroundColor Red
        return $false
    }
    
    return $true
}

# Function to verify .gitignore
function Verify-Gitignore {
    Write-Host "`n🔒 Verifying .gitignore configuration..." -ForegroundColor Cyan
    
    if (-not (Test-Path ".gitignore")) {
        Write-Host "❌ Error: .gitignore not found" -ForegroundColor Red
        return $false
    }
    
    $requiredPatterns = @(
        ".env",
        ".env.local",
        ".env.*.local",
        "*.pem",
        "*.key",
        "*.dump"
    )
    
    $gitignoreContent = Get-Content ".gitignore" -Raw
    $missing = @()
    
    foreach ($pattern in $requiredPatterns) {
        if ($gitignoreContent -notmatch [regex]::Escape($pattern)) {
            $missing += $pattern
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Host "⚠️  Missing patterns in .gitignore:" -ForegroundColor Yellow
        foreach ($pattern in $missing) {
            Write-Host "    - $pattern" -ForegroundColor Yellow
        }
        
        $fix = Read-Host "`nAdd missing patterns to .gitignore? (y/n)"
        if ($fix -eq 'y') {
            foreach ($pattern in $missing) {
                Add-Content -Path ".gitignore" -Value $pattern
                Write-Host "  ✅ Added: $pattern" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "✅ All required patterns present in .gitignore" -ForegroundColor Green
    }
    
    return $true
}

# Execute based on user choice
$success = $true

switch ($choice) {
    '1' {
        $success = Install-PreCommitHook
    }
    '2' {
        $success = Run-SecurityScan
    }
    '3' {
        $success = Verify-Gitignore
    }
    'all' {
        $success = Install-PreCommitHook
        $success = $success -and (Verify-Gitignore)
        $success = $success -and (Run-SecurityScan)
    }
    default {
        if ($InstallHook) {
            $success = Install-PreCommitHook
        }
        if ($RunScan) {
            $success = $success -and (Run-SecurityScan)
        }
        if (-not $InstallHook -and -not $RunScan) {
            Write-Host "Invalid choice. Run with -InstallHook or -RunScan" -ForegroundColor Red
            $success = $false
        }
    }
}

# Final summary
Write-Host "`n" + ("=" * 80) -ForegroundColor Cyan
if ($success) {
    Write-Host "✅ Setup Complete!" -ForegroundColor Green
    
    Write-Host "`n📚 Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Review: SENSITIVE_FILES_PROTECTION.md" -ForegroundColor White
    Write-Host "  2. Test pre-commit hook with a test commit" -ForegroundColor White
    Write-Host "  3. Configure CODEOWNERS (.github/CODEOWNERS)" -ForegroundColor White
    Write-Host "  4. Enable GitHub secret scanning in repo settings" -ForegroundColor White
    
    Write-Host "`n🔍 Test the hook:" -ForegroundColor Cyan
    Write-Host '  echo "sk_live_test123" > test.txt' -ForegroundColor Gray
    Write-Host '  git add test.txt' -ForegroundColor Gray
    Write-Host '  git commit -m "test"  # Should be blocked!' -ForegroundColor Gray
    Write-Host '  rm test.txt' -ForegroundColor Gray
} else {
    Write-Host "⚠️  Setup encountered errors" -ForegroundColor Yellow
    Write-Host "Please review the output above" -ForegroundColor Yellow
}

Write-Host ""
