#!/bin/bash
set -e

echo "=========================================="
echo "Advancia Pay - Simple Deployment"
echo "=========================================="

# Install unzip if missing
echo "Step 1: Installing dependencies..."
apt-get update -qq && apt-get install -y unzip

# Extract archive
echo "Step 2: Extracting archive..."
mkdir -p /var/www/advancia
unzip -o /root/advancia-deploy.zip -d /var/www/advancia

# Backend setup
echo "Step 3: Setting up backend..."
cd /var/www/advancia/backend
npm ci --production
npx prisma generate
npx prisma migrate deploy || echo "⚠ Migration skipped - will use existing schema"

# Frontend setup
echo "Step 4: Setting up frontend..."
cd /var/www/advancia/frontend
npm ci --production
npm run build

# Install PM2 globally
echo "Step 5: Installing PM2..."
npm install -g pm2

# Start services
echo "Step 6: Starting services..."
pm2 delete all || true

cd /var/www/advancia/backend
NODE_ENV=production pm2 start src/index.js --name advancia-backend

cd /var/www/advancia/frontend
NODE_ENV=production pm2 start npm --name advancia-frontend -- start

pm2 save

# Show status
echo ""
echo "=========================================="
echo "✓ Deployment Complete!"
echo "=========================================="
pm2 status

echo ""
echo "Access your app at: http://157.245.8.131"
echo "Backend API: http://157.245.8.131:4000/health"
echo ""
echo "Useful commands:"
echo "  pm2 logs           - View logs"
echo "  pm2 restart all    - Restart services"
echo "  pm2 monit          - Monitor processes"
