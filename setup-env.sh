#!/bin/bash

# Advancia Pay - Environment Setup Script (Bash)
# Run: ./setup-env.sh

echo -e "\n🚀 Advancia Pay - Environment Setup\n"
echo "============================================================"

# Backend setup
echo -e "\n📦 Backend Environment Setup"

if [ -f "backend/.env" ]; then
    echo "⚠️  backend/.env already exists!"
    read -p "Overwrite? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp backend/.env.example backend/.env
        echo "✅ Created backend/.env from template"
    else
        echo "Skipping backend setup..."
    fi
else
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env from template"
fi

# Frontend setup
echo -e "\n🎨 Frontend Environment Setup"

if [ -f "frontend/.env.local" ]; then
    echo "⚠️  frontend/.env.local already exists!"
    read -p "Overwrite? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp frontend/.env.example frontend/.env.local
        echo "✅ Created frontend/.env.local from template"
    else
        echo "Skipping frontend setup..."
    fi
else
    cp frontend/.env.example frontend/.env.local
    echo "✅ Created frontend/.env.local from template"
fi

# Generate secrets
echo -e "\n🔐 Generating Secrets..."
echo "(This will display secrets - copy them to your .env files)"
echo

cd backend
node generate-secrets.js
cd ..

# Summary
echo
echo "============================================================"
echo -e "\n📋 Summary"
echo "✅ Environment files created"
echo "✅ Secrets generated (see above)"

echo -e "\n⚠️  Important Next Steps:"
echo "1. Edit backend/.env with the generated secrets"
echo "2. Edit frontend/.env.local with API URL and Stripe key"
echo "3. Setup PostgreSQL database (docker-compose up -d postgres)"
echo "4. Run migrations (cd backend && npx prisma migrate dev)"
echo "5. Start backend (cd backend && pnpm run dev)"
echo "6. Start frontend (cd frontend && pnpm run dev)"

echo -e "\n🔒 Security Reminders:"
echo "- Store WALLET_MASTER_SEED in a secure vault"
echo "- Never commit .env files to git"
echo "- Use different secrets for dev/staging/production"
echo "- Enable Gmail App Passwords for EMAIL_PASSWORD"

echo -e "\n📚 Documentation:"
echo "- ENV_SETUP_GUIDE.md - Detailed environment setup"
echo "- WALLET_DEPLOYMENT_GUIDE.md - Wallet deployment checklist"
echo "- DEV_SETUP_GUIDE.md - Complete development setup"
echo
