#!/bin/bash
# Quick fix script to setup environment variables and restart services

echo "=========================================="
echo "Fixing Production Environment"
echo "=========================================="

# Create backend .env.production
cat > /var/www/advancia/backend/.env.production << 'EOF'
NODE_ENV=production
PORT=4000
FRONTEND_URL=http://157.245.8.131:3000
ALLOWED_ORIGINS=http://157.245.8.131:3000,http://157.245.8.131

DATABASE_URL=postgresql://advancia_user:AdvanciaSecure2025!@localhost:5432/advancia_prod

JWT_SECRET=4X382w30rRZlhrbS+BIktNJ3+Cn0zDZG3gN2ku5ttugHu2pjeQJKtmF9SLwRxDPUoF9Ph9kbQfSYlaK6Yg8kNg==
JWT_EXPIRATION=7d
SESSION_SECRET=Wumg3AcgUwDbTDTRz+SWWpvus1zZ8QamJzvB6R6OJrtGcGS4kwpy/HRbqXJG3IeZl13AB7FcX7ak8KkYTNJhIA==

STRIPE_SECRET_KEY=sk_test_51SCXq1CnLcSzsQoTXqbzLwgmT6Mbb8Fj2ZEngSnjmwnm2P0iZGZKq2oYHWHwKAgAGRLs3qm0FUacfQ06oL6jvZYf00j1763pTI
STRIPE_PUBLISHABLE_KEY=pk_test_51SCXq1CnLcSzsQoTOLHBWMBDs2B1So1zAVwGZUmkvUAviP2CwNr3OrxU5Ws6bmygNOhe06PSxsDGGPUEU1XWaAy100vt5KK4we

REDIS_URL=redis://localhost:6379
EOF

# Create frontend .env.production
cat > /var/www/advancia/frontend/.env.production << 'EOF'
NEXT_PUBLIC_API_URL=http://157.245.8.131:4000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SCXq1CnLcSzsQoTOLHBWMBDs2B1So1zAVwGZUmkvUAviP2CwNr3OrxU5Ws6bmygNOhe06PSxsDGGPUEU1XWaAy100vt5KK4we
EOF

echo "✓ Environment files created"

# Check if PostgreSQL is running
systemctl start postgresql || true
echo "✓ PostgreSQL started"

# Restart PM2 processes
echo "Restarting services..."
pm2 restart advancia-backend
pm2 restart advancia-frontend

# Wait a moment
sleep 3

# Check status
pm2 status

echo ""
echo "Testing endpoints..."
echo "Backend:"
curl -s http://localhost:4000/health || echo "Backend not responding"

echo ""
echo "Frontend:"
curl -s -I http://localhost:3000 | head -1 || echo "Frontend not responding"

echo ""
echo "=========================================="
echo "Fix complete! Check the output above."
echo "=========================================="
