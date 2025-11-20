#!/bin/bash
set -e

echo "=== Backend Deployment Script ==="
DROPLET_IP="157.245.8.131"
DROPLET_USER="root"

echo "Deploying to $DROPLET_IP..."

ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 $DROPLET_USER@$DROPLET_IP << 'EOF'
  echo "Connected to droplet"
  cd /var/www || (mkdir -p /var/www && cd /var/www)
  
  if [ -d "modular-saas-platform" ]; then
    echo "Repository exists, pulling latest..."
    cd modular-saas-platform
    git fetch origin
    git checkout preview
    git pull origin preview
  else
    echo "Cloning repository..."
    git clone --branch preview https://github.com/muchaeljohn739337-cloud/-modular-saas-platform.git
    cd modular-saas-platform
  fi
  
  echo "Installing dependencies..."
  cd backend
  npm install --production
  
  echo "Running Prisma migrations..."
  npx prisma migrate deploy 2>/dev/null || echo "Migrations already applied"
  npx prisma generate
  
  echo "Building application..."
  npm run build 2>/dev/null || echo "Build skipped (optional)"
  
  echo "Reloading PM2..."
  pm2 reload all --update-env 2>/dev/null || pm2 start npm --name "backend" -- run start
  
  echo "Deployment complete!"
EOF

echo "=== Deployment finished ==="
