#!/bin/bash

# Advancia Pay Production Deployment Script
# Server: 157.245.8.131
# Date: November 15, 2025

set -e  # Exit on error

echo "=========================================="
echo "Advancia Pay Production Deployment"
echo "=========================================="

# Configuration
DEPLOY_DIR="/var/www/advancia"
ARCHIVE_PATH="/root/advancia-deploy.zip"
DB_NAME="advancia_prod"
DB_USER="advancia_user"
DB_PASS="AdvanciaSecure2025!"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo "Please run as root"
   exit 1
fi

# Step 1: Create deployment directory
echo ""
echo "Step 1: Creating deployment directory..."
mkdir -p $DEPLOY_DIR
cd /root

# Step 2: Extract archive
echo ""
echo "Step 2: Extracting deployment archive..."
if [ ! -f "$ARCHIVE_PATH" ]; then
    echo "Error: Archive not found at $ARCHIVE_PATH"
    exit 1
fi

unzip -o $ARCHIVE_PATH -d $DEPLOY_DIR
echo "✓ Archive extracted successfully"

# Step 3: Setup PostgreSQL database
echo ""
echo "Step 3: Setting up PostgreSQL database..."

# Check if PostgreSQL is running
systemctl start postgresql || true
systemctl enable postgresql || true

# Create database user if not exists
sudo -u postgres psql -tc "SELECT 1 FROM pg_user WHERE usename = '$DB_USER'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"

# Create database if not exists
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

echo "✓ Database configured successfully"

# Step 4: Install backend dependencies
echo ""
echo "Step 4: Installing backend dependencies..."
cd $DEPLOY_DIR/backend

# Check if node_modules exists and is valid
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "Installing fresh dependencies..."
    npm ci --production
else
    echo "Dependencies already installed"
fi

echo "✓ Backend dependencies installed"

# Step 5: Run Prisma migrations
echo ""
echo "Step 5: Running database migrations..."
npx prisma generate
npx prisma migrate deploy

echo "✓ Migrations completed"

# Step 6: Install frontend dependencies and build
echo ""
echo "Step 6: Building frontend..."
cd $DEPLOY_DIR/frontend

if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "Installing frontend dependencies..."
    npm ci --production
else
    echo "Frontend dependencies already installed"
fi

npm run build
echo "✓ Frontend built successfully"

# Step 7: Install and configure PM2
echo ""
echo "Step 7: Configuring PM2 process manager..."

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Stop existing processes
pm2 stop all || true
pm2 delete all || true

# Start backend
cd $DEPLOY_DIR/backend
NODE_ENV=production pm2 start src/index.js --name advancia-backend

# Start frontend
cd $DEPLOY_DIR/frontend
NODE_ENV=production pm2 start npm --name advancia-frontend -- start

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup systemd -u root --hp /root || true

echo "✓ PM2 configured successfully"

# Step 8: Configure Nginx
echo ""
echo "Step 8: Configuring Nginx..."

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    apt-get update
    apt-get install -y nginx
fi

# Create Nginx configuration
cat > /etc/nginx/sites-available/advancia << 'NGINX_EOF'
server {
    listen 80;
    server_name 157.245.8.131;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_EOF

# Enable site
ln -sf /etc/nginx/sites-available/advancia /etc/nginx/sites-enabled/advancia

# Remove default site if exists
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx

echo "✓ Nginx configured successfully"

# Step 9: Verify deployment
echo ""
echo "Step 9: Verifying deployment..."

sleep 5  # Wait for services to start

# Check PM2 processes
echo ""
echo "PM2 Process Status:"
pm2 status

# Check if backend is responding
echo ""
echo "Testing backend health endpoint..."
if curl -f http://localhost:4000/health > /dev/null 2>&1; then
    echo "✓ Backend is responding"
else
    echo "⚠ Backend health check failed"
fi

# Check if frontend is responding
echo ""
echo "Testing frontend..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✓ Frontend is responding"
else
    echo "⚠ Frontend health check failed"
fi

# Final summary
echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "✓ Application deployed to: $DEPLOY_DIR"
echo "✓ Database: $DB_NAME"
echo "✓ PM2 processes running"
echo "✓ Nginx configured"
echo ""
echo "Access your application at:"
echo "  → http://157.245.8.131"
echo "  → API: http://157.245.8.131/api/health"
echo ""
echo "Useful commands:"
echo "  pm2 status        - Check process status"
echo "  pm2 logs          - View application logs"
echo "  pm2 restart all   - Restart all processes"
echo "  nginx -t          - Test Nginx configuration"
echo ""
echo "=========================================="
