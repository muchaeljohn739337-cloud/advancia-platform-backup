# Advancia Backend Deployment Script
# Deploys source code to Digital Ocean droplet and builds there

$ErrorActionPreference = "Stop"

$DROPLET_IP = "157.245.8.131"
$SSH_KEY = "C:\Users\mucha.DESKTOP-H7T9NPM\.ssh\advancia_droplet"

Write-Host "`n🚀 ADVANCIA BACKEND DEPLOYMENT`n" -ForegroundColor Cyan
Write-Host "Droplet: $DROPLET_IP" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor DarkGray

# Step 1: Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Cyan

$deployTemp = "deploy-package"
if (Test-Path $deployTemp) { 
    Remove-Item -Recurse -Force $deployTemp 
}
New-Item -ItemType Directory -Force -Path $deployTemp | Out-Null

# Copy source code and config files
Copy-Item -Path "src" -Destination "$deployTemp/src" -Recurse
Copy-Item -Path "package.json" -Destination "$deployTemp/"
if (Test-Path "package-lock.json") {
    Copy-Item -Path "package-lock.json" -Destination "$deployTemp/"
}
Copy-Item -Path ".env.production" -Destination "$deployTemp/.env"
Copy-Item -Path "prisma" -Destination "$deployTemp/prisma" -Recurse
Copy-Item -Path "tsconfig.json" -Destination "$deployTemp/"

# Create tarball
tar -czf deploy.tar.gz -C $deployTemp .

Write-Host "✅ Package created: deploy.tar.gz`n" -ForegroundColor Green

# Step 2: Upload to droplet
Write-Host "📤 Uploading to droplet..." -ForegroundColor Cyan
scp -i $SSH_KEY -o StrictHostKeyChecking=no deploy.tar.gz root@${DROPLET_IP}:/root/

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Upload failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Upload complete!`n" -ForegroundColor Green

# Step 3: Deploy on droplet
Write-Host "🚀 Deploying on droplet...`n" -ForegroundColor Cyan

$deployScript = @"
set -e

echo "🔧 Setting up application directory..."
mkdir -p /app/advancia-backend
cd /app/advancia-backend

echo "📦 Extracting files..."
tar -xzf /root/deploy.tar.gz

echo "📥 Installing dependencies..."
if [ -f "package-lock.json" ]; then
    npm ci --legacy-peer-deps
else
    npm install --legacy-peer-deps
fi

echo "🔨 Building TypeScript..."
npm run build

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🗄️  Running database migrations..."
npx prisma migrate deploy

echo "📦 Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

echo "🛑 Stopping existing instance..."
pm2 delete advancia-backend 2>/dev/null || true

echo "🚀 Starting application..."
pm2 start dist/index.js --name advancia-backend --node-args="--max-old-space-size=2048" --time

echo "💾 Saving PM2 config..."
pm2 save

echo "🔄 Setting up PM2 startup..."
pm2 startup systemd -u root --hp /root | grep -v "PM2" | bash || true

echo "⚙️  Configuring nginx..."
if [ ! -f /etc/nginx/sites-available/advancia ]; then
    apt-get update -qq && apt-get install -y nginx
    
    cat > /etc/nginx/sites-available/advancia << 'NGINX_EOF'
server {
    listen 80;
    server_name _;
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX_EOF
    
    ln -sf /etc/nginx/sites-available/advancia /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl restart nginx
    
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 22/tcp
    ufw --force enable
fi

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
pm2 status
"@

ssh -i $SSH_KEY -o StrictHostKeyChecking=no root@$DROPLET_IP $deployScript

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✨ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green
    
    Write-Host "🌐 Backend URL: http://$DROPLET_IP" -ForegroundColor Cyan
    Write-Host "🏥 Health Check: http://$DROPLET_IP/api/health`n" -ForegroundColor Cyan
    
    Write-Host "📊 Management Commands:" -ForegroundColor Yellow
    Write-Host "  View logs:    ssh -i $SSH_KEY root@$DROPLET_IP 'pm2 logs advancia-backend'" -ForegroundColor White
    Write-Host "  Restart app:  ssh -i $SSH_KEY root@$DROPLET_IP 'pm2 restart advancia-backend'" -ForegroundColor White
    Write-Host "  App status:   ssh -i $SSH_KEY root@$DROPLET_IP 'pm2 monit'`n" -ForegroundColor White
    
    Write-Host "🧪 Testing health endpoint..." -ForegroundColor Cyan
    Start-Sleep -Seconds 10
    
    try {
        $response = Invoke-WebRequest -Uri "http://$DROPLET_IP/api/health" -UseBasicParsing -TimeoutSec 10
        Write-Host "✅ Backend is healthy! Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Backend starting (check logs in 30 seconds)" -ForegroundColor Yellow
        Write-Host "   ssh -i $SSH_KEY root@$DROPLET_IP 'pm2 logs advancia-backend --lines 50'" -ForegroundColor Yellow
    }
}

# Cleanup
Write-Host "`n🧹 Cleaning up..." -ForegroundColor Cyan
Remove-Item -Recurse -Force $deployTemp
Remove-Item deploy.tar.gz

Write-Host "✅ Done!`n" -ForegroundColor Green
