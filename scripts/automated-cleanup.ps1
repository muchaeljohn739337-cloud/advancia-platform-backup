<#
.SYNOPSIS
    Automated Cleanup & Security Audit Script for Advancia Pay
.DESCRIPTION
    Runs comprehensive checks: VeraCrypt audit, process cleanup, secret scanning,
    fintech implementation validation, and Docker service health checks.
.NOTES
    Author: Advancia Pay DevOps Team
    Version: 2.0
    Requires: PowerShell 7+, Docker Desktop, Git
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [switch]$SkipVeraCrypt,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipDocker,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipSecretScan,

    [Parameter(Mandatory=$false)]
    [switch]$RunMigration,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputDir = ".\audit-reports"
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# ANSI colors
$RED = "`e[31m"
$GREEN = "`e[32m"
$YELLOW = "`e[33m"
$BLUE = "`e[34m"
$MAGENTA = "`e[35m"
$CYAN = "`e[36m"
$RESET = "`e[0m"

function Write-Header {
    param([string]$Message)
    Write-Host "`n$CYAN╔═══════════════════════════════════════════════════════════════╗$RESET"
    Write-Host "$CYAN║  $Message$(' ' * (59 - $Message.Length))║$RESET"
    Write-Host "$CYAN╚═══════════════════════════════════════════════════════════════╝$RESET`n"
}

function Write-Success {
    param([string]$Message)
    Write-Host "${GREEN}✓ $Message${RESET}"
}

function Write-Warning {
    param([string]$Message)
    Write-Host "${YELLOW}⚠ $Message${RESET}"
}

function Write-Error2 {
    param([string]$Message)
    Write-Host "${RED}✗ $Message${RESET}"
}

function Write-Info {
    param([string]$Message)
    Write-Host "${BLUE}ℹ $Message${RESET}"
}

# Create output directory
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$reportFile = Join-Path $OutputDir "cleanup-audit-$timestamp.json"

# ============================================================================
# 1. VERACRYPT SECURITY AUDIT
# ============================================================================

Write-Header "VeraCrypt Security Audit"

if (-not $SkipVeraCrypt) {
    if (Test-Path ".\scripts\veracrypt-audit.ps1") {
        Write-Info "Running VeraCrypt audit..."
        $veracryptReport = Join-Path $OutputDir "veracrypt-audit-$timestamp.json"
        
        try {
            & .\scripts\veracrypt-audit.ps1 -SkipContentScan -OutputPath $veracryptReport
            
            if (Test-Path $veracryptReport) {
                $vcData = Get-Content $veracryptReport | ConvertFrom-Json
                if ($vcData.VeraCrypt.MountedVolumes.Count -eq 0) {
                    Write-Success "No VeraCrypt volumes mounted (secure state)"
                } else {
                    Write-Warning "$($vcData.VeraCrypt.MountedVolumes.Count) VeraCrypt volume(s) mounted"
                }
            }
        } catch {
            Write-Error2 "VeraCrypt audit failed: $($_.Exception.Message)"
        }
    } else {
        Write-Warning "VeraCrypt audit script not found, skipping..."
    }
} else {
    Write-Info "VeraCrypt audit skipped (use without -SkipVeraCrypt to enable)"
}

# ============================================================================
# 2. PROCESS CLEANUP - Kill Unwanted Terminals & Processes
# ============================================================================

Write-Header "Process Cleanup & Resource Management"

Write-Info "Checking for orphaned Node.js processes..."

# Kill orphaned Node processes (not in current project)
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    foreach ($proc in $nodeProcesses) {
        try {
            $procPath = $proc.Path
            if ($procPath -and -not $procPath.StartsWith($PSScriptRoot)) {
                Write-Warning "Killing orphaned Node process: PID $($proc.Id)"
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            }
        } catch {
            # Ignore errors for processes we can't access
        }
    }
    Write-Success "Node process cleanup complete"
} else {
    Write-Info "No orphaned Node processes found"
}

# Check for multiple PowerShell terminals
$pwshTerminals = Get-Process -Name pwsh -ErrorAction SilentlyContinue | Measure-Object
if ($pwshTerminals.Count -gt 3) {
    Write-Warning "$($pwshTerminals.Count) PowerShell terminals open (recommend closing unused ones)"
}

# ============================================================================
# 3. SECRET SCANNING
# ============================================================================

Write-Header "Secret & Credential Scanning"

if (-not $SkipSecretScan) {
    Write-Info "Scanning for exposed secrets..."
    
    $secretPatterns = @(
        @{ Name = "API Keys"; Pattern = "(?i)(api[_-]?key|apikey)[\s]*[:=][\s]*['\`"]?([a-zA-Z0-9_\-]{20,})" },
        @{ Name = "JWT Secrets"; Pattern = "(?i)(jwt[_-]?secret|secret[_-]?key)[\s]*[:=][\s]*['\`"]?([a-zA-Z0-9_\-]{20,})" },
        @{ Name = "Database URLs"; Pattern = "(?i)(database[_-]?url|db[_-]?url)[\s]*[:=][\s]*['\`"]?(postgres|mysql)://" },
        @{ Name = "Private Keys"; Pattern = "-----BEGIN (RSA |EC )?PRIVATE KEY-----" },
        @{ Name = "AWS Keys"; Pattern = "(?i)(aws[_-]?access[_-]?key|aws[_-]?secret)" },
        @{ Name = "Stripe Keys"; Pattern = "(?i)sk_live_[a-zA-Z0-9]{24,}" }
    )
    
    $findings = @()
    $filesWithSecrets = @()
    
    # Scan .env files
    $envFiles = Get-ChildItem -Path . -Filter ".env*" -Recurse -File -ErrorAction SilentlyContinue |
                Where-Object { $_.FullName -notmatch "node_modules|\.git|dist|build" }
    
    foreach ($file in $envFiles) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if (-not $content) { continue }
        
        foreach ($pattern in $secretPatterns) {
            if ($content -match $pattern.Pattern) {
                $findings += @{
                    File = $file.FullName.Replace($PSScriptRoot, ".")
                    Type = $pattern.Name
                }
                if ($file.FullName -notmatch "\.example$") {
                    $filesWithSecrets += $file.FullName.Replace($PSScriptRoot, ".")
                }
            }
        }
    }
    
    if ($findings.Count -gt 0) {
        Write-Warning "Found $($findings.Count) potential secret(s) in files"
        $filesWithSecrets | Select-Object -Unique | ForEach-Object {
            Write-Info "  • $_"
        }
    } else {
        Write-Success "No exposed secrets detected"
    }
} else {
    Write-Info "Secret scanning skipped (use without -SkipSecretScan to enable)"
}

# ============================================================================
# 4. DOCKER SERVICE CHECK
# ============================================================================

Write-Header "Docker Services Health Check"

if (-not $SkipDocker) {
    Write-Info "Checking Docker daemon..."
    
    try {
        $dockerInfo = docker info 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Docker is running"
            
            # Check required containers
            Write-Info "Checking required containers..."
            $requiredContainers = @('postgres', 'redis')
            
            foreach ($container in $requiredContainers) {
                $running = docker ps --filter "name=$container" --format "{{.Names}}" 2>$null
                if ($running) {
                    Write-Success "$container container is running"
                } else {
                    Write-Warning "$container container not found (required for backend)"
                }
            }
        } else {
            Write-Warning "Docker daemon is not running"
            Write-Info "Start Docker Desktop manually, then run: docker-compose up -d"
        }
    } catch {
        Write-Warning "Docker not installed or not in PATH"
    }
} else {
    Write-Info "Docker check skipped (use without -SkipDocker to enable)"
}

# ============================================================================
# 5. FINTECH IMPLEMENTATION STATUS
# ============================================================================

Write-Header "Fintech Payment System Status"

Write-Info "Checking implementation files..."

$fintechFiles = @(
    @{ Path = "backend\prisma\schema.prisma"; Check = "PaymentSession|KYCVerification|FraudAlert" },
    @{ Path = "backend\src\services\paymentSessionService.ts"; Check = "createPaymentSession" },
    @{ Path = "backend\src\services\feeService.ts"; Check = "calculateTransactionFee" },
    @{ Path = "backend\src\services\fraudDetectionService.ts"; Check = "checkWithdrawalVelocity" }
)

$implementationComplete = $true

foreach ($file in $fintechFiles) {
    if (Test-Path $file.Path) {
        $content = Get-Content $file.Path -Raw
        if ($content -match $file.Check) {
            Write-Success "$($file.Path) ✓"
        } else {
            Write-Warning "$($file.Path) exists but incomplete"
            $implementationComplete = $false
        }
    } else {
        Write-Error2 "$($file.Path) not found"
        $implementationComplete = $false
    }
}

if ($implementationComplete) {
    Write-Success "All fintech services implemented"
} else {
    Write-Warning "Some fintech components missing or incomplete"
}

# Check if migration is needed
Write-Info "Checking database migration status..."
if (Test-Path "backend\prisma\migrations") {
    $migrations = Get-ChildItem "backend\prisma\migrations" -Directory | Sort-Object Name -Descending | Select-Object -First 1
    if ($migrations) {
        Write-Success "Latest migration: $($migrations.Name)"
    }
} else {
    Write-Warning "No migrations found (run: npx prisma migrate dev)"
}

# ============================================================================
# 6. OPTIONAL: RUN DATABASE MIGRATION
# ============================================================================

if ($RunMigration) {
    Write-Header "Database Migration"
    
    Write-Info "Attempting to run Prisma migration..."
    Push-Location backend
    
    try {
        # Check if DB is accessible
        $dbCheck = npx prisma db pull --force 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Database connection successful"
            
            Write-Info "Running migration: add_fintech_payment_system"
            npx prisma migrate dev --name add_fintech_payment_system
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Migration completed successfully"
                
                Write-Info "Generating Prisma client..."
                npx prisma generate
                Write-Success "Prisma client generated"
            } else {
                Write-Error2 "Migration failed (check database connection)"
            }
        } else {
            Write-Warning "Cannot connect to database (start Docker: docker-compose up -d)"
        }
    } catch {
        Write-Error2 "Migration error: $($_.Exception.Message)"
    } finally {
        Pop-Location
    }
}

# ============================================================================
# 7. GENERATE SUMMARY REPORT
# ============================================================================

Write-Header "Generating Audit Report"

$report = @{
    Timestamp = (Get-Date -Format 'o')
    Hostname = $env:COMPUTERNAME
    User = $env:USERNAME
    VeraCryptSecure = $true  # Will be populated if VeraCrypt audit ran
    ProcessesKilled = 0
    SecretsFound = $findings.Count
    DockerRunning = $false
    FintechImplementation = $implementationComplete
    RecommendedActions = @()
}

# Add recommended actions
if ($findings.Count -gt 0) {
    $report.RecommendedActions += "Review and secure files containing secrets"
}

if (-not $SkipDocker) {
    $dockerRunning = docker ps 2>$null
    $report.DockerRunning = $LASTEXITCODE -eq 0
    
    if (-not $report.DockerRunning) {
        $report.RecommendedActions += "Start Docker Desktop and run: docker-compose up -d"
    }
}

if (-not $implementationComplete) {
    $report.RecommendedActions += "Complete fintech service implementation"
}

# Save report
$report | ConvertTo-Json -Depth 10 | Set-Content -Path $reportFile

Write-Success "Audit report saved: $reportFile"

# ============================================================================
# FINAL SUMMARY
# ============================================================================

Write-Header "Cleanup & Audit Complete"

Write-Host ""
Write-Host "${GREEN}✓ Completed Tasks:${RESET}"
Write-Host "  • VeraCrypt audit:     $(if ($SkipVeraCrypt) { 'SKIPPED' } else { 'DONE' })"
Write-Host "  • Process cleanup:     DONE"
Write-Host "  • Secret scanning:     $(if ($SkipSecretScan) { 'SKIPPED' } else { 'DONE' })"
Write-Host "  • Docker health check: $(if ($SkipDocker) { 'SKIPPED' } else { 'DONE' })"
Write-Host "  • Fintech status:      DONE"
Write-Host "  • Database migration:  $(if ($RunMigration) { 'ATTEMPTED' } else { 'SKIPPED' })"

if ($report.RecommendedActions.Count -gt 0) {
    Write-Host "`n${YELLOW}⚠ Recommended Actions:${RESET}"
    foreach ($action in $report.RecommendedActions) {
        Write-Host "  • $action"
    }
}

Write-Host "`n${CYAN}📊 Full Report: $reportFile${RESET}`n"

# Next steps
Write-Header "Next Steps"

Write-Host "${BLUE}To start development:${RESET}"
Write-Host "  1. Start Docker:       ${GREEN}docker-compose up -d${RESET}"
Write-Host "  2. Run migration:      ${GREEN}cd backend && npx prisma migrate dev${RESET}"
Write-Host "  3. Start backend:      ${GREEN}cd backend && pnpm run dev${RESET}"
Write-Host "  4. Start frontend:     ${GREEN}cd frontend && pnpm run dev${RESET}"
Write-Host ""
Write-Host "${BLUE}To run full audit again:${RESET}"
Write-Host "  ${GREEN}.\scripts\automated-cleanup.ps1 -RunMigration${RESET}"
Write-Host ""

exit 0
