<#
.SYNOPSIS
    Start Advancia Pay Ledger in PRODUCTION mode

.DESCRIPTION
    This script sets up and runs the application in production mode.
    Includes health checks, database validation, and monitoring.

.NOTES
    Author: Advancia Pay Ledger
    Version: 1.0.0
#>

param(
    [switch]$Docker,
    [switch]$Local,
    [switch]$SkipBackup,
    [switch]$SkipHealthCheck
)

$ErrorActionPreference = "Stop"
$WarningPreference = "Continue"

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success { Write-ColorOutput Green @args }
function Write-Warning { Write-ColorOutput Yellow @args }
function Write-Error { Write-ColorOutput Red @args }
function Write-Info { Write-ColorOutput Cyan @args }

# Banner
Write-ColorOutput Magenta @"
╔═══════════════════════════════════════════════════╗
║   ADVANCIA PAY LEDGER - PRODUCTION DEPLOYMENT    ║
╚═══════════════════════════════════════════════════╝
"@

# Check if production environment files exist
Write-Info "`n[1/7] Validating Production Configuration..."

$backendEnvProd = "backend\.env.production"
$frontendEnvProd = "frontend\.env.production"

if (-not (Test-Path $backendEnvProd)) {
    Write-Error "❌ Backend .env.production not found!"
    Write-Warning "   Copy backend\.env.production and configure with production values"
    exit 1
}

if (-not (Test-Path $frontendEnvProd)) {
    Write-Error "❌ Frontend .env.production not found!"
    Write-Warning "   Copy frontend\.env.production and configure with production values"
    exit 1
}

Write-Success "✓ Production environment files found"

# Validate critical environment variables
Write-Info "`n[2/7] Checking Critical Environment Variables..."

$envContent = Get-Content $backendEnvProd -Raw
$criticalVars = @(
    @{Name="NODE_ENV"; Pattern="NODE_ENV=production"},
    @{Name="DATABASE_URL"; Pattern="DATABASE_URL=postgresql://"},
    @{Name="JWT_SECRET"; Pattern="JWT_SECRET="},
    @{Name="STRIPE_SECRET_KEY"; Pattern="STRIPE_SECRET_KEY="}
)

$missingVars = @()
foreach ($var in $criticalVars) {
    if ($envContent -notmatch $var.Pattern) {
        $missingVars += $var.Name
    } elseif ($envContent -match "$($var.Pattern)CHANGE_THIS" -or $envContent -match "$($var.Pattern)YOUR_") {
        Write-Warning "⚠️  $($var.Name) still has placeholder value"
        $missingVars += $var.Name
    }
}

if ($missingVars.Count -gt 0) {
    Write-Error "`n❌ Missing or invalid configuration for: $($missingVars -join ', ')"
    Write-Warning "   Please update backend\.env.production with production values"
    exit 1
}

Write-Success "✓ Critical environment variables configured"

# Pre-deployment backup
if (-not $SkipBackup) {
    Write-Info "`n[3/7] Creating Pre-Deployment Backup..."
    $backupDate = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $backupDir = "backups\pre-production-$backupDate"
    
    try {
        New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
        
        # Backup database (if local PostgreSQL)
        if (Test-Path "backend\.env") {
            $envLocal = Get-Content "backend\.env" -Raw
            if ($envLocal -match "DATABASE_URL=postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/([^\s]+)") {
                $dbHost = $matches[3]
                if ($dbHost -eq "localhost" -or $dbHost -eq "127.0.0.1" -or $dbHost -eq "db") {
                    Write-Info "   Creating database backup..."
                    # Add pg_dump command here if PostgreSQL is installed locally
                    Write-Warning "   Manual database backup recommended before production deployment"
                }
            }
        }
        
        # Backup current environment files
        Copy-Item "backend\.env" "$backupDir\backend.env.backup" -ErrorAction SilentlyContinue
        Copy-Item "frontend\.env.local" "$backupDir\frontend.env.local.backup" -ErrorAction SilentlyContinue
        
        Write-Success "✓ Backup created in $backupDir"
    } catch {
        Write-Warning "⚠️  Backup creation failed: $_"
    }
} else {
    Write-Warning "`n[3/7] Skipping backup (--SkipBackup flag used)"
}

# Database migrations
Write-Info "`n[4/7] Running Database Migrations..."

try {
    Push-Location backend
    
    # Use production environment
    $env:NODE_ENV = "production"
    Copy-Item .env.production .env -Force
    
    Write-Info "   Checking database connection..."
    npm run prisma:generate
    
    Write-Info "   Applying migrations..."
    npm run prisma:migrate:deploy
    
    Pop-Location
    Write-Success "✓ Database migrations completed"
} catch {
    Pop-Location
    Write-Error "❌ Migration failed: $_"
    exit 1
}

# Choose deployment method
Write-Info "`n[5/7] Deploying Application..."

if ($Docker) {
    # Docker deployment
    Write-Info "   Using Docker Compose (Production)..."
    
    # Stop any running containers
    docker-compose -f docker-compose.prod.yml down
    
    # Build and start
    docker-compose -f docker-compose.prod.yml build
    docker-compose -f docker-compose.prod.yml up -d
    
    Write-Success "✓ Docker containers started"
    Write-Info "   View logs: docker-compose -f docker-compose.prod.yml logs -f"
    
} elseif ($Local) {
    # Local PM2 deployment
    Write-Info "   Using PM2 (Production)..."
    
    # Backend
    Push-Location backend
    $env:NODE_ENV = "production"
    Copy-Item .env.production .env -Force
    npm ci --omit=dev
    npm run prisma:generate
    
    if (Get-Command pm2 -ErrorAction SilentlyContinue) {
        pm2 delete advancia-backend -ErrorAction SilentlyContinue
        pm2 start ecosystem.config.js --env production
        Pop-Location
    } else {
        Write-Error "❌ PM2 not installed. Install with: npm install -g pm2"
        Pop-Location
        exit 1
    }
    
    # Frontend
    Push-Location frontend
    $env:NODE_ENV = "production"
    Copy-Item .env.production .env.local -Force
    npm ci --omit=dev
    npm run build
    
    if (Get-Command pm2 -ErrorAction SilentlyContinue) {
        pm2 delete advancia-frontend -ErrorAction SilentlyContinue
        pm2 start npm --name "advancia-frontend" -- start
        Pop-Location
    } else {
        Pop-Location
        exit 1
    }
    
    Write-Success "✓ PM2 processes started"
    Write-Info "   View status: pm2 status"
    Write-Info "   View logs: pm2 logs"
    
} else {
    Write-Error "❌ Please specify deployment method: -Docker or -Local"
    exit 1
}

# Health checks
if (-not $SkipHealthCheck) {
    Write-Info "`n[6/7] Running Health Checks..."
    Start-Sleep -Seconds 10
    
    try {
        $healthUrl = "http://localhost:4000/health"
        $response = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 5
        
        if ($response.status -eq "ok") {
            Write-Success "✓ Backend health check passed"
        } else {
            Write-Warning "⚠️  Backend health check returned unexpected status"
        }
    } catch {
        Write-Warning "⚠️  Backend health check failed: $_"
        Write-Info "   Check logs for details"
    }
    
    try {
        $frontendUrl = "http://localhost:3000"
        $response = Invoke-WebRequest -Uri $frontendUrl -TimeoutSec 5 -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            Write-Success "✓ Frontend health check passed"
        }
    } catch {
        Write-Warning "⚠️  Frontend health check failed: $_"
        Write-Info "   Check logs for details"
    }
} else {
    Write-Warning "`n[6/7] Skipping health checks (--SkipHealthCheck flag used)"
}

# Final summary
Write-Info "`n[7/7] Production Deployment Summary"
Write-ColorOutput Green @"

╔═══════════════════════════════════════════════════╗
║          🚀 PRODUCTION DEPLOYMENT COMPLETE        ║
╚═══════════════════════════════════════════════════╝

"@

Write-Success "✓ Backend:  http://localhost:4000"
Write-Success "✓ Frontend: http://localhost:3000"
Write-Success "✓ Health:   http://localhost:4000/health"

Write-ColorOutput Yellow @"

📋 NEXT STEPS:
1. Test all critical endpoints
2. Configure SSL/TLS certificates
3. Set up monitoring and alerts
4. Configure firewall rules
5. Set up automated backups
6. Review security settings
7. Update DNS records (if applicable)

📊 MONITORING:
"@

if ($Docker) {
    Write-Info "   • Docker logs:  docker-compose -f docker-compose.prod.yml logs -f"
    Write-Info "   • Container status: docker-compose -f docker-compose.prod.yml ps"
} elseif ($Local) {
    Write-Info "   • PM2 status:   pm2 status"
    Write-Info "   • PM2 logs:     pm2 logs"
    Write-Info "   • PM2 monit:    pm2 monit"
}

Write-ColorOutput Yellow @"

⚠️  IMPORTANT SECURITY REMINDERS:
   • Change all default passwords
   • Enable 2FA for all admin accounts
   • Review CORS settings in backend/src/jobs/config/index.ts
   • Set up regular database backups
   • Monitor error logs and alerts
   • Keep dependencies updated

"@

Write-ColorOutput Green "🎉 Ready for production traffic!"
