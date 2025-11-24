# 🚀 Quick Environment Setup

## TL;DR - Get Started in 5 Minutes

```powershell
# 1. Run automated setup (Windows PowerShell)
.\setup-env.ps1

# OR for Linux/Mac (Bash)
chmod +x setup-env.sh
./setup-env.sh

# 2. Copy the generated secrets to backend\.env

# 3. Edit critical variables in backend\.env:
# - DATABASE_URL (PostgreSQL connection)
# - EMAIL_USER and EMAIL_PASSWORD (Gmail SMTP)
# - STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET

# 4. Edit frontend\.env.local:
# - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# 5. Start services
docker-compose up -d postgres
cd backend && npx prisma migrate dev && pnpm run dev
cd frontend && pnpm run dev
```

## 📁 Environment Files Created

-   `backend/.env` - Backend configuration (database, JWT, payments, wallets)
-   `frontend/.env.local` - Frontend configuration (API URL, Stripe public key)

## 🔑 Critical Secrets to Configure

### Backend Priority 1 (Required to Start)

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/advancia_db
JWT_SECRET=<paste-from-generated-secrets>
JWT_REFRESH_SECRET=<paste-from-generated-secrets>
```

### Backend Priority 2 (Required for Features)

```bash
# Email (Gmail SMTP for OTP)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=<your-gmail-app-password>

# Stripe (Payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Custodial Wallets (CRITICAL!)
WALLET_MASTER_SEED=<24-word-phrase-from-generated-secrets>
WALLET_ENCRYPTION_KEY=<base64-key-from-generated-secrets>

# Admin Wallets (Coinbase/Binance addresses)
ADMIN_BTC_WALLET_ADDRESS=<your-coinbase-btc-address>
ADMIN_ETH_WALLET_ADDRESS=<your-coinbase-eth-address>
ADMIN_USDT_WALLET_ADDRESS=<your-coinbase-usdt-address>
```

### Frontend Priority 1

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 📧 Gmail Setup (5 min)

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification**
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Generate password for "Mail"
5. Copy to `EMAIL_PASSWORD` in backend/.env

## 💳 Stripe Setup (5 min)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to **Test Mode**
3. Get keys from **Developers → API Keys**:
   -   `STRIPE_SECRET_KEY` → backend/.env
   -   `STRIPE_PUBLISHABLE_KEY` → frontend/.env.local
4. Setup webhook:
   -   **Developers → Webhooks → Add endpoint**
   -   URL: `https://your-domain.com/api/payments/webhook`
   -   Events: Select all `payment_intent` and `charge` events
   -   Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

## 🔐 Wallet Security Checklist

-   [ ] Generate new master seed (24 words) using `generate-secrets.js`
-   [ ] Write seed on paper and store in physical vault
-   [ ] Generate new encryption key (32 bytes base64)
-   [ ] Store encryption key in password manager (1Password, KeePass)
-   [ ] Add admin wallet addresses (Coinbase, Binance, etc.)
-   [ ] Never commit .env files to git (.gitignore already configured)
-   [ ] Use different secrets for dev/staging/production
-   [ ] Test wallet generation before production deployment

## 🐳 Database Setup (Local Development)

```powershell
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Run migrations
cd backend
npx prisma migrate dev

# Verify
npx prisma studio
```

## 🧪 Verify Setup

```powershell
# Check backend starts
cd backend
pnpm run dev
# Should see: "🚀 Server running on port 4000"

# Check frontend starts
cd frontend
pnpm run dev
# Should see: "✓ Ready on http://localhost:3000"

# Run tests
cd backend
pnpm test
# Should see: "14 passing"
```

## 📚 Detailed Documentation

-   **ENV_SETUP_GUIDE.md** - Complete environment variable reference
-   **WALLET_DEPLOYMENT_GUIDE.md** - Production deployment checklist
-   **DEV_SETUP_GUIDE.md** - Full development setup guide
-   **backend/.env.example** - All available backend variables
-   **frontend/.env.example** - All available frontend variables

## 🚨 Common Issues

### "Cannot connect to database"

```powershell
# Check Docker is running
docker ps

# Start Postgres
docker-compose up -d postgres

# Verify DATABASE_URL matches container
# Default: postgresql://postgres:postgres@localhost:5432/advancia_db
```

### "Email not sending"

-   Use Gmail **App Password**, not your regular password
-   Enable 2FA on Google account first
-   Check `SMTP_HOST=smtp.gmail.com` and `SMTP_PORT=587`

### "Wallet generation failed"

```powershell
# Verify master seed is 24 words
node -e "const bip39 = require('bip39'); console.log(bip39.validateMnemonic('your seed here'))"

# Verify encryption key is 32 bytes base64
node -e "console.log(Buffer.from('your-key-here', 'base64').length)"
# Should output: 32
```

### "JWT malformed"

-   Ensure `JWT_SECRET` has no spaces or newlines
-   Should be 64+ characters hex string
-   Re-generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

## 🎯 Next Steps After Setup

1. **Create Admin User**

   ```bash
   cd backend
   node scripts/create-admin.js
   ```

2. **Run Tests**

   ```bash
   cd backend
   pnpm test
   ```

3. **Test Wallet Generation**

   ```bash
   node test-wallet.js
   ```

4. **Deploy to Production**
   -   Follow `WALLET_DEPLOYMENT_GUIDE.md`
   -   SSH to droplet: `ssh root@157.245.8.131`

## 💬 Need Help?

-   Check `ENV_SETUP_GUIDE.md` for detailed troubleshooting
-   Review `.env.example` files for all available options
-   Test with `backend/test-wallet.js` script
-   Run unit tests: `cd backend && pnpm test:unit`
