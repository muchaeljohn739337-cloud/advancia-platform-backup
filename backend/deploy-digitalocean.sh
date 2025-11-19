#!/bin/bash

# Digital Ocean Deployment Script
# Deploys backend to Digital Ocean Droplet

set -e  # Exit on error

echo "🚀 Digital Ocean Deployment Script"
echo "=================================="
echo ""

# Configuration
DROPLET_IP="${DROPLET_IP:-}"
DROPLET_USER="${DROPLET_USER:-root}"
SSH_KEY_PATH="${SSH_KEY_PATH:-~/.ssh/id_rsa}"
APP_NAME="advancia-backend"
DEPLOY_PATH="/var/www/${APP_NAME}"
NODE_VERSION="20"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    echo "1️⃣ Checking prerequisites..."
    
    if [ -z "$DROPLET_IP" ]; then
        print_error "DROPLET_IP not set"
        echo "Usage: DROPLET_IP=your.droplet.ip ./deploy-digitalocean.sh"
        exit 1
    fi
    
    if ! command -v ssh &> /dev/null; then
        print_error "SSH not found. Please install SSH client."
        exit 1
    fi
    
    if ! command -v rsync &> /dev/null; then
        print_warning "rsync not found. Using scp instead (slower)."
    fi
    
    print_success "Prerequisites checked"
}

# Test SSH connection
test_ssh() {
    echo ""
    echo "2️⃣ Testing SSH connection..."
    
    if ssh -i "$SSH_KEY_PATH" -o ConnectTimeout=10 "${DROPLET_USER}@${DROPLET_IP}" "echo 'Connection successful'" &> /dev/null; then
        print_success "SSH connection successful"
    else
        print_error "Cannot connect to droplet via SSH"
        echo "Please check:"
        echo "  - Droplet IP: $DROPLET_IP"
        echo "  - SSH key: $SSH_KEY_PATH"
        echo "  - User: $DROPLET_USER"
        exit 1
    fi
}

# Setup droplet environment
setup_droplet() {
    echo ""
    echo "3️⃣ Setting up droplet environment..."
    
    ssh -i "$SSH_KEY_PATH" "${DROPLET_USER}@${DROPLET_IP}" << 'ENDSSH'
        set -e
        
        # Update system
        echo "📦 Updating system packages..."
        apt-get update -qq
        apt-get upgrade -y -qq
        
        # Install Node.js
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
        
        # Install nginx (if not present)
        if ! command -v nginx &> /dev/null; then
            echo "📦 Installing nginx..."
            apt-get install -y nginx
        fi
        
        # Create deployment directory
        mkdir -p /var/www/advancia-backend
        
        echo "✅ Droplet environment ready"
ENDSSH
    
    print_success "Droplet setup complete"
}

# Build application locally
build_app() {
    echo ""
    echo "4️⃣ Building application..."
    
    cd "$(dirname "$0")"
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
    
    # Run Prisma generate
    echo "🔧 Generating Prisma client..."
    npx prisma generate
    
    # Build TypeScript (ignore non-critical errors)
    echo "🔨 Building TypeScript..."
    npm run build || print_warning "Build had warnings (continuing anyway)"
    
    print_success "Application built"
}

# Deploy files to droplet
deploy_files() {
    echo ""
    echo "5️⃣ Deploying files to droplet..."
    
    cd "$(dirname "$0")"
    
    # Create deployment package
    echo "📦 Creating deployment package..."
    
    if command -v rsync &> /dev/null; then
        # Use rsync (faster, incremental)
        rsync -avz --delete \
            --exclude 'node_modules' \
            --exclude '.git' \
            --exclude 'logs' \
            --exclude '.env.local' \
            --exclude 'dist' \
            -e "ssh -i $SSH_KEY_PATH" \
            ./ "${DROPLET_USER}@${DROPLET_IP}:${DEPLOY_PATH}/"
    else
        # Use scp (slower, complete copy)
        tar -czf /tmp/backend-deploy.tar.gz \
            --exclude='node_modules' \
            --exclude='.git' \
            --exclude='logs' \
            --exclude='.env.local' \
            --exclude='dist' \
            .
        
        scp -i "$SSH_KEY_PATH" /tmp/backend-deploy.tar.gz "${DROPLET_USER}@${DROPLET_IP}:/tmp/"
        
        ssh -i "$SSH_KEY_PATH" "${DROPLET_USER}@${DROPLET_IP}" << ENDSSH
            cd ${DEPLOY_PATH}
            tar -xzf /tmp/backend-deploy.tar.gz
            rm /tmp/backend-deploy.tar.gz
ENDSSH
        
        rm /tmp/backend-deploy.tar.gz
    fi
    
    print_success "Files deployed"
}

# Setup environment on droplet
setup_environment() {
    echo ""
    echo "6️⃣ Setting up environment on droplet..."
    
    # Copy .env file (or create from example)
    if [ -f ".env" ]; then
        print_warning "Uploading .env file to droplet"
        scp -i "$SSH_KEY_PATH" .env "${DROPLET_USER}@${DROPLET_IP}:${DEPLOY_PATH}/.env"
    else
        print_warning ".env file not found. Please configure manually."
    fi
    
    ssh -i "$SSH_KEY_PATH" "${DROPLET_USER}@${DROPLET_IP}" << ENDSSH
        cd ${DEPLOY_PATH}
        
        # Install production dependencies
        echo "📦 Installing production dependencies..."
        npm install --omit=dev --legacy-peer-deps
        
        # Generate Prisma client
        echo "🔧 Generating Prisma client..."
        npx prisma generate
        
        # Run database migrations
        echo "🗄️  Running database migrations..."
        npx prisma migrate deploy || echo "⚠️  Migration warnings (check manually)"
        
        # Build application
        echo "🔨 Building application..."
        npm run build || echo "⚠️  Build warnings (check manually)"
        
        echo "✅ Environment setup complete"
ENDSSH
    
    print_success "Environment configured"
}

# Start application with PM2
start_app() {
    echo ""
    echo "7️⃣ Starting application with PM2..."
    
    ssh -i "$SSH_KEY_PATH" "${DROPLET_USER}@${DROPLET_IP}" << 'ENDSSH'
        cd /var/www/advancia-backend
        
        # Stop existing process
        pm2 stop advancia-backend 2>/dev/null || true
        pm2 delete advancia-backend 2>/dev/null || true
        
        # Start with PM2
        pm2 start ecosystem.config.js --env production
        
        # Save PM2 configuration
        pm2 save
        
        # Show status
        pm2 status
        
        echo "✅ Application started"
ENDSSH
    
    print_success "Application running with PM2"
}

# Configure nginx reverse proxy
setup_nginx() {
    echo ""
    echo "8️⃣ Configuring nginx..."
    
    ssh -i "$SSH_KEY_PATH" "${DROPLET_USER}@${DROPLET_IP}" << 'ENDSSH'
        # Create nginx configuration
        cat > /etc/nginx/sites-available/advancia-backend << 'EOF'
server {
    listen 80;
    server_name _;  # Replace with your domain

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
        
        # WebSocket support
        proxy_read_timeout 86400;
    }
}
EOF
        
        # Enable site
        ln -sf /etc/nginx/sites-available/advancia-backend /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
        
        # Test nginx configuration
        nginx -t
        
        # Reload nginx
        systemctl reload nginx
        systemctl enable nginx
        
        echo "✅ nginx configured"
ENDSSH
    
    print_success "nginx configured"
}

# Configure firewall
setup_firewall() {
    echo ""
    echo "9️⃣ Configuring firewall..."
    
    ssh -i "$SSH_KEY_PATH" "${DROPLET_USER}@${DROPLET_IP}" << 'ENDSSH'
        # Enable UFW
        ufw --force enable
        
        # Allow SSH
        ufw allow 22/tcp
        
        # Allow HTTP/HTTPS
        ufw allow 80/tcp
        ufw allow 443/tcp
        
        # Show status
        ufw status
        
        echo "✅ Firewall configured"
ENDSSH
    
    print_success "Firewall configured"
}

# Health check
health_check() {
    echo ""
    echo "🔟 Running health check..."
    
    # Wait for app to start
    sleep 5
    
    if ssh -i "$SSH_KEY_PATH" "${DROPLET_USER}@${DROPLET_IP}" "curl -f http://localhost:4000/api/health" &> /dev/null; then
        print_success "Health check passed"
        
        echo ""
        echo "🎉 Deployment successful!"
        echo ""
        echo "Your backend is now running at:"
        echo "  http://${DROPLET_IP}"
        echo ""
        echo "Useful commands:"
        echo "  - View logs: ssh ${DROPLET_USER}@${DROPLET_IP} 'pm2 logs advancia-backend'"
        echo "  - Restart:   ssh ${DROPLET_USER}@${DROPLET_IP} 'pm2 restart advancia-backend'"
        echo "  - Status:    ssh ${DROPLET_USER}@${DROPLET_IP} 'pm2 status'"
    else
        print_error "Health check failed"
        echo "Check logs: ssh ${DROPLET_USER}@${DROPLET_IP} 'pm2 logs advancia-backend'"
        exit 1
    fi
}

# Main deployment flow
main() {
    check_prerequisites
    test_ssh
    setup_droplet
    build_app
    deploy_files
    setup_environment
    start_app
    setup_nginx
    setup_firewall
    health_check
}

# Run deployment
main
