# Custodial Wallet Deployment Guide

## 🔐 Environment Setup

### Required Environment Variables

Add these to `.env` on the droplet:

```bash
# Custodial Wallet Master Seed (24-word BIP39 mnemonic)
# ⚠️ CRITICAL: Store this in a secure vault! Loss means loss of all user funds!
WALLET_MASTER_SEED="prevent kitten crumble suggest unaware solution cook prepare mercy wheel myself biology find pulp enter flame nuclear print father thunder festival sick gasp among"

# Wallet Encryption Key (32-byte AES key in base64)
# ⚠️ CRITICAL: Store this separately from the master seed!
WALLET_ENCRYPTION_KEY="r1YYNdBItolkTOK9nhAVNsbeWTZdVsbRHGp9YII2o/Y="

# Admin Wallet Addresses (for external wallet withdrawals)
ADMIN_BTC_WALLET_ADDRESS="your-coinbase-btc-address"
ADMIN_ETH_WALLET_ADDRESS="your-coinbase-eth-address"
ADMIN_USDT_WALLET_ADDRESS="your-coinbase-usdt-address"
```

## 📦 Database Migration

### Apply Wallet Migrations on Droplet

```bash
# SSH to droplet
ssh root@157.245.8.131

# Navigate to project
cd /var/www/advancia-pay

# Pull latest code
git pull origin preview

# Install dependencies
cd backend
pnpm install

# Apply migrations
npx prisma migrate deploy

# Verify tables created
psql -U postgres -d advancia_pay -c "\dt crypto_wallet*"
# Should show: crypto_wallet_keys, crypto_wallet_history
```

Expected output:

```
                    List of relations
 Schema |          Name           | Type  |  Owner
--------+-------------------------+-------+----------
 public | crypto_wallet_history   | table | postgres
 public | crypto_wallet_keys      | table | postgres
 public | crypto_wallets          | table | postgres
```

## 🧪 Testing on Production

### 1. Test Wallet Generation

```bash
# Register a test user
curl -X POST https://api.advancia.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "wallettest1",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User"
  }'

# Response should include:
# - user.id
# - token

# Save the token
TOKEN="<token_from_response>"
```

### 2. Verify Wallets Created

```bash
# Get user wallets
curl -X GET https://api.advancia.com/api/wallets \
  -H "Authorization: Bearer $TOKEN"

# Expected: 3 wallets (BTC, ETH, USDT) with unique addresses
```

### 3. Test Wallet Rotation

```bash
# Rotate BTC wallet
curl -X POST https://api.advancia.com/api/wallets/rotate/BTC \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Testing rotation"}'

# Verify new address generated
curl -X GET https://api.advancia.com/api/wallets \
  -H "Authorization: Bearer $TOKEN"

# Check rotation history
curl -X GET https://api.advancia.com/api/wallets/history/BTC \
  -H "Authorization: Bearer $TOKEN"
```

## 🔒 Security Checklist

- [ ] Master seed stored in secure vault (1Password, KeePass, etc.)
- [ ] Encryption key stored separately from master seed
- [ ] `.env` file permissions set to 600 on droplet
- [ ] Backup of master seed in physically separate location
- [ ] Admin wallet addresses configured for withdrawals
- [ ] Test wallet generation on production
- [ ] Test wallet rotation on production
- [ ] Verify encrypted private keys in database
- [ ] Monitor logs for any wallet generation errors

## 📊 Monitoring

### Check Wallet System Health

```bash
# On droplet, check logs
pm2 logs advancia-backend --lines 100 | grep -i wallet

# Check database for wallets
psql -U postgres -d advancia_pay -c "
  SELECT
    cw.currency,
    COUNT(*) as wallet_count,
    COUNT(cwk.wallet_id) as keys_count
  FROM crypto_wallets cw
  LEFT JOIN crypto_wallet_keys cwk ON cw.id = cwk.wallet_id
  GROUP BY cw.currency;
"
```

### Expected Output:

```
 currency | wallet_count | keys_count
----------+--------------+------------
 BTC      |          150 |        150
 ETH      |          150 |        150
 USDT     |          150 |        150
```

## 🚨 Emergency Recovery

If master seed is lost:

1. **IMMEDIATE**: Freeze all withdrawals
2. Generate new master seed
3. Create migration script to transfer funds to new addresses
4. Update environment variables
5. Re-initialize all user wallets
6. Transfer balances from old to new addresses

## 📝 Deployment Commands

```bash
# Complete deployment script
ssh root@157.245.8.131 << 'EOF'
  cd /var/www/advancia-pay
  git pull origin preview
  cd backend

  # Backup current .env
  cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

  # Add wallet environment variables (edit manually or use script)
  nano .env

  # Install and build
  pnpm install
  pnpm run build

  # Apply migrations
  npx prisma migrate deploy

  # Restart application
  pm2 restart advancia-backend

  # Verify
  pm2 logs advancia-backend --lines 50
EOF
```

## ✅ Post-Deployment Verification

1. Check server logs for wallet initialization
2. Register test user and verify 3 wallets created
3. Test wallet rotation
4. Verify rotation history tracking
5. Check database encryption (private keys should be encrypted strings)
6. Test withdrawal flow with admin wallets

## 🔗 Related Files

- Backend Service: `backend/src/services/custodialWalletService.ts`
- API Routes: `backend/src/routes/wallets.ts`
- Migration: `backend/prisma/migrations/20251118092211_add_withdrawal_wallet_fields/`
- Test Script: `backend/test-wallet.js`

## 📞 Support

If issues arise:

1. Check PM2 logs: `pm2 logs advancia-backend`
2. Check Postgres logs: `docker logs advancia-postgres`
3. Verify environment variables: `printenv | grep WALLET`
4. Test database connection: `psql -U postgres -d advancia_pay -c "SELECT 1;"`
