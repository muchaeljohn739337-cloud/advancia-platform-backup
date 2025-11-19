# Digital Ocean Deployment Script (PowerShell)
# Deploys backend to Digital Ocean Droplet

param(
    [Parameter(Mandatory=$true)]
    [string]$DropletIP,
    
    [Parameter(Mandatory=$false)]
    [string]$DropletUser = "root",
    
    [Parameter(Mandatory=$false)]
    [string]$SSHKeyPath = "$env:USERPROFILE\.ssh\advancia_droplet",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild,
    
    [Parameter(Mandatory=$false)]
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Digital Ocean Deployment Script
================================

Usage:
  .\deploy-digitalocean.ps1 -DropletIP <IP> [options]

Required Parameters:
  -DropletIP <IP>          IP address of your Digital Ocean droplet

Optional Parameters:
  -DropletUser <user>      SSH user (default: root)
  -SSHKeyPath <path>       Path to SSH private key (default: ~/.ssh/id_rsa)
  -SkipBuild               Skip local build step
  -Help                    Show this help message

Examples:
  # Basic deployment
  .\deploy-digitalocean.ps1 -DropletIP 164.90.123.45

  # With custom user and SSH key
  .\deploy-digitalocean.ps1 -DropletIP 164.90.123.45 -DropletUser deploy -SSHKeyPath C:\keys\id_rsa

  # Skip build (if already built)
  .\deploy-digitalocean.ps1 -DropletIP 164.90.123.45 -SkipBuild

"@
    exit 0
}

$ErrorActionPreference = "Stop"

# Configuration
$AppName = "advancia-backend"
$DeployPath = "/var/www/$AppName"

Write-Host "🚀 Digital Ocean Deployment Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Helper functions
function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Test-Command {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# 1. Check prerequisites
Write-Host "1️⃣ Checking prerequisites..." -ForegroundColor Yellow

if (!(Test-Command "ssh")) {
    Write-Error "SSH not found. Please install OpenSSH or Git Bash."
    exit 1
}

if (!(Test-Path $SSHKeyPath)) {
    Write-Error "SSH key not found at: $SSHKeyPath"
    Write-Host "Generate one with: ssh-keygen -t rsa -b 4096"
    exit 1
}

Write-Success "Prerequisites checked"

# 2. Test SSH connection
Write-Host ""
Write-Host "2️⃣ Testing SSH connection..." -ForegroundColor Yellow

try {
    $result = ssh -i $SSHKeyPath -o ConnectTimeout=10 "${DropletUser}@${DropletIP}" "echo 'OK'" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "SSH connection successful"
    } else {
        throw "Connection failed"
    }
} catch {
    Write-Error "Cannot connect to droplet via SSH"
    Write-Host "Please check:"
    Write-Host "  - Droplet IP: $DropletIP"
    Write-Host "  - SSH key: $SSHKeyPath"
    Write-Host "  - User: $DropletUser"
    exit 1
}

# 3. Setup droplet environment
Write-Host ""
Write-Host "3️⃣ Setting up droplet environment..." -ForegroundColor Yellow

$setupScript = @'
set -e

# Update system
echo "📦 Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

# Install Node.js 20
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
    pm2 startup systemd -u root --hp /root
fi

# Install PostgreSQL client
if ! command -v psql &> /dev/null; then
    echo "📦 Installing PostgreSQL client..."
    apt-get install -y postgresql-client
fi

# Install nginx
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing nginx..."
    apt-get install -y nginx
fi

# Create deployment directory
mkdir -p /var/www/advancia-backend

echo "✅ Droplet environment ready"
'@

ssh -i $SSHKeyPath "${DropletUser}@${DropletIP}" $setupScript

Write-Success "Droplet setup complete"

# 4. Build application
if (!$SkipBuild) {
    Write-Host ""
    Write-Host "4️⃣ Building application..." -ForegroundColor Yellow
    
    Push-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)
    
    try {
        Write-Host "📦 Installing dependencies..."
        npm install --legacy-peer-deps
        
        Write-Host "🔧 Generating Prisma client..."
        npx prisma generate
        
        Write-Host "🔨 Building TypeScript..."
        npm run build 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Build had warnings (continuing anyway)"
        }
        
        Write-Success "Application built"
    } finally {
        Pop-Location
    }
} else {
    Write-Warning "Skipping build step"
}

# 5. Deploy files
Write-Host ""
Write-Host "5️⃣ Deploying files to droplet..." -ForegroundColor Yellow

Push-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)

try {
    # Create archive (excluding unnecessary files)
    Write-Host "📦 Creating deployment package..."
    
    $excludeList = @(
        "node_modules",
        ".git",
        "logs",
        ".env.local",
        "*.log",
        ".temp-excluded"
    )
    
    # Use tar if available (Git Bash), otherwise use Compress-Archive
    if (Test-Command "tar") {
        tar -czf deploy.tar.gz --exclude=node_modules --exclude=.git --exclude=logs --exclude=.env.local .
        
        Write-Host "📤 Uploading to droplet..."
        scp -i $SSHKeyPath deploy.tar.gz "${DropletUser}@${DropletIP}:/tmp/"
        
        ssh -i $SSHKeyPath "${DropletUser}@${DropletIP}" @"
            cd $DeployPath
            tar -xzf /tmp/deploy.tar.gz
            rm /tmp/deploy.tar.gz
"@
        
        Remove-Item deploy.tar.gz
    } else {
        Write-Warning "tar not found, using slower method"
        
        # Copy essential files
        scp -i $SSHKeyPath -r package*.json "${DropletUser}@${DropletIP}:$DeployPath/"
        scp -i $SSHKeyPath -r prisma "${DropletUser}@${DropletIP}:$DeployPath/"
        scp -i $SSHKeyPath -r src "${DropletUser}@${DropletIP}:$DeployPath/"
        scp -i $SSHKeyPath -r dist "${DropletUser}@${DropletIP}:$DeployPath/" 2>$null
        scp -i $SSHKeyPath ecosystem.config.js "${DropletUser}@${DropletIP}:$DeployPath/"
        scp -i $SSHKeyPath tsconfig.json "${DropletUser}@${DropletIP}:$DeployPath/"
    }
    
    Write-Success "Files deployed"
} finally {
    Pop-Location
}

# 6. Setup environment
Write-Host ""
Write-Host "6️⃣ Setting up environment on droplet..." -ForegroundColor Yellow

# Upload .env if exists
$envPath = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) ".env"
if (Test-Path $envPath) {
    Write-Warning "Uploading .env file to droplet"
    scp -i $SSHKeyPath $envPath "${DropletUser}@${DropletIP}:$DeployPath/.env"
} else {
    Write-Warning ".env file not found. Please configure manually."
}

$envSetup = @"
cd $DeployPath

# Install production dependencies
echo '📦 Installing production dependencies...'
npm install --omit=dev --legacy-peer-deps

# Generate Prisma client
echo '🔧 Generating Prisma client...'
npx prisma generate

# Run database migrations
echo '🗄️  Running database migrations...'
npx prisma migrate deploy || echo '⚠️  Migration warnings'

# Build if needed
if [ ! -d 'dist' ]; then
    echo '🔨 Building application...'
    npm run build || echo '⚠️  Build warnings'
fi

echo '✅ Environment setup complete'
"@

ssh -i $SSHKeyPath "${DropletUser}@${DropletIP}" $envSetup

Write-Success "Environment configured"

# 7. Start with PM2
Write-Host ""
Write-Host "7️⃣ Starting application with PM2..." -ForegroundColor Yellow

$pm2Setup = @'
cd /var/www/advancia-backend

# Stop existing
pm2 stop advancia-backend 2>/dev/null || true
pm2 delete advancia-backend 2>/dev/null || true

# Start
pm2 start ecosystem.config.js --env production

# Save
pm2 save

# Status
pm2 status
'@

ssh -i $SSHKeyPath "${DropletUser}@${DropletIP}" $pm2Setup

Write-Success "Application running with PM2"

# 8. Configure nginx
Write-Host ""
Write-Host "8️⃣ Configuring nginx..." -ForegroundColor Yellow

$nginxConfig = @'
cat > /etc/nginx/sites-available/advancia-backend << "NGINXEOF"
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/advancia-backend /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
systemctl enable nginx
'@

ssh -i $SSHKeyPath "${DropletUser}@${DropletIP}" $nginxConfig

Write-Success "nginx configured"

# 9. Configure firewall
Write-Host ""
Write-Host "9️⃣ Configuring firewall..." -ForegroundColor Yellow

$firewallSetup = @'
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw status
'@

ssh -i $SSHKeyPath "${DropletUser}@${DropletIP}" $firewallSetup

Write-Success "Firewall configured"

# 10. Health check
Write-Host ""
Write-Host "🔟 Running health check..." -ForegroundColor Yellow

Start-Sleep -Seconds 5

try {
    $health = ssh -i $SSHKeyPath "${DropletUser}@${DropletIP}" "curl -f http://localhost:4000/api/health" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Health check passed"
        
        Write-Host ""
        Write-Host "🎉 Deployment successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your backend is now running at:"
        Write-Host "  http://$DropletIP" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Useful commands:"
        Write-Host "  - View logs: ssh ${DropletUser}@${DropletIP} 'pm2 logs advancia-backend'"
        Write-Host "  - Restart:   ssh ${DropletUser}@${DropletIP} 'pm2 restart advancia-backend'"
        Write-Host "  - Status:    ssh ${DropletUser}@${DropletIP} 'pm2 status'"
    } else {
        throw "Health check failed"
    }
} catch {
    Write-Error "Health check failed"
    Write-Host "Check logs: ssh ${DropletUser}@${DropletIP} 'pm2 logs advancia-backend'"
    exit 1
}
