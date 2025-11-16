<#
.SYNOPSIS
    Deploy Advancia Pay Ledger to Production Server

.DESCRIPTION
    Uploads and deploys the application to the production Ubuntu server

.EXAMPLE
    .\deploy-to-server.ps1
#>

param(
    [string]$ServerIP = "157.245.8.131",
    [string]$ServerUser = "root",
    [string]$ArchivePath = "C:\Users\mucha.DESKTOP-H7T9NPM\advancia-deploy.zip"
)

Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   DEPLOYING TO PRODUCTION SERVER                  ║" -ForegroundColor Cyan
Write-Host "║   Server: $ServerIP                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Check if archive exists
if (-not (Test-Path $ArchivePath)) {
    Write-Host "❌ Archive not found at: $ArchivePath" -ForegroundColor Red
    Write-Host "Creating archive now..." -ForegroundColor Yellow
    
    $ProjectPath = "C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\-modular-saas-platform"
    Compress-Archive -Path "$ProjectPath\*" -DestinationPath $ArchivePath -Force
    Write-Host "✓ Archive created: $ArchivePath" -ForegroundColor Green
}

Write-Host "`n[1/5] Uploading project to server..." -ForegroundColor Cyan
Write-Host "This may take a few minutes depending on your connection...`n" -ForegroundColor Yellow

# Upload using SCP (requires OpenSSH or use WinSCP)
Write-Host "Run this command to upload:" -ForegroundColor Yellow
Write-Host "scp `"$ArchivePath`" ${ServerUser}@${ServerIP}:/root/`n" -ForegroundColor White

Write-Host "`n[2/5] SSH into your server and run these commands:" -ForegroundColor Cyan
Write-Host "ssh ${ServerUser}@${ServerIP}`n" -ForegroundColor White

Write-Host @"

╔════════════════════════════════════════════════════╗
║   COMMANDS TO RUN ON SERVER (in order)            ║
╚════════════════════════════════════════════════════╝

# 1. Extract the archive
cd /root
unzip -o advancia-deploy.zip -d /var/www/advancia
cd /var/www/advancia

# 2. Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install PM2 globally
sudo npm install -g pm2

# 4. Setup PostgreSQL database
sudo -u postgres psql << EOF
CREATE DATABASE advancia_prod;
CREATE USER advancia_user WITH ENCRYPTED PASSWORD 'AdvanciaSecure2025!';
GRANT ALL PRIVILEGES ON DATABASE advancia_prod TO advancia_user;
\q
EOF

# 5. Configure backend environment
cd /var/www/advancia/backend
cp .env.production .env

# Update DATABASE_URL in .env
sed -i 's|DATABASE_URL=.*|DATABASE_URL=postgresql://advancia_user:AdvanciaSecure2025!@localhost:5432/advancia_prod|g' .env

# 6. Install backend dependencies
npm install --production
npx prisma generate
npx prisma migrate deploy

# 7. Install frontend dependencies and build
cd /var/www/advancia/frontend
npm install --production
npm run build

# 8. Start services with PM2
cd /var/www/advancia/backend
pm2 start npm --name "advancia-backend" -- start
pm2 startup systemd
pm2 save

cd /var/www/advancia/frontend
pm2 start npm --name "advancia-frontend" -- start
pm2 save

# 9. Configure Nginx
sudo tee /etc/nginx/sites-available/advancia > /dev/null << 'NGINX_EOF'
server {
    listen 80;
    server_name 157.245.8.131;

    client_max_body_size 50M;

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_cache_bypass `$http_upgrade;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_cache_bypass `$http_upgrade;
    }
}
NGINX_EOF

# Enable site and restart Nginx
sudo ln -sf /etc/nginx/sites-available/advancia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 10. Verify deployment
echo ""
echo "🔍 Checking services..."
pm2 status
echo ""
curl -s http://localhost:4000/health | jq .
echo ""
echo "✅ Deployment complete!"
echo ""
echo "Access your application at: http://157.245.8.131"
echo ""

"@ -ForegroundColor Green

Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   QUICK DEPLOYMENT SCRIPT                         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Save this as deploy.sh on the server and run: bash deploy.sh`n" -ForegroundColor Yellow

Write-Host @"
#!/bin/bash
set -e

echo "🚀 Starting Advancia Pay Ledger Deployment..."

# Extract archive
cd /root
unzip -o advancia-deploy.zip -d /var/www/advancia
cd /var/www/advancia

# Setup database
sudo -u postgres psql -c "CREATE DATABASE advancia_prod;" 2>/dev/null || echo "Database exists"
sudo -u postgres psql -c "CREATE USER advancia_user WITH ENCRYPTED PASSWORD 'AdvanciaSecure2025!';" 2>/dev/null || echo "User exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE advancia_prod TO advancia_user;"

# Backend setup
cd backend
cp .env.production .env
sed -i 's|DATABASE_URL=.*|DATABASE_URL=postgresql://advancia_user:AdvanciaSecure2025!@localhost:5432/advancia_prod|g' .env
npm install --production
npx prisma generate
npx prisma migrate deploy

# Frontend setup
cd ../frontend
npm install --production
npm run build

# Start with PM2
cd ../backend
pm2 delete advancia-backend 2>/dev/null || true
pm2 start npm --name "advancia-backend" -- start

cd ../frontend  
pm2 delete advancia-frontend 2>/dev/null || true
pm2 start npm --name "advancia-frontend" -- start

pm2 save
pm2 startup systemd | tail -1 | bash

# Configure Nginx
cat > /etc/nginx/sites-available/advancia << 'EOF'
server {
    listen 80;
    server_name 157.245.8.131;
    client_max_body_size 50M;

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/advancia /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

echo ""
echo "✅ Deployment complete!"
echo "🌐 Access at: http://157.245.8.131"
pm2 status

"@ | Out-File -FilePath "C:\Users\mucha.DESKTOP-H7T9NPM\deploy.sh" -Encoding UTF8

Write-Host "`n✓ Deployment script saved to: C:\Users\mucha.DESKTOP-H7T9NPM\deploy.sh" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Upload archive: scp `"$ArchivePath`" ${ServerUser}@${ServerIP}:/root/" -ForegroundColor White
Write-Host "2. Upload script: scp `"C:\Users\mucha.DESKTOP-H7T9NPM\deploy.sh`" ${ServerUser}@${ServerIP}:/root/" -ForegroundColor White
Write-Host "3. SSH to server: ssh ${ServerUser}@${ServerIP}" -ForegroundColor White
Write-Host "4. Run deployment: cd /root && bash deploy.sh`n" -ForegroundColor White
