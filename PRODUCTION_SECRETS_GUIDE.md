# Production Secrets Configuration Guide

**Generated:** December 2024
**Status:** Secrets generated; manual configuration required
**Architecture:** Node.js + Express + TypeScript + Next.js 14 + PostgreSQL
**Deployment:** Render (Backend) + Vercel (Frontend) + Cloudflare (CDN/DNS)

## 🔐 Generated Secrets (CRITICAL - SECURE STORAGE REQUIRED)

### Backend Secrets

```env
# Authentication & Sessions
JWT_SECRET=c0a33019af26f7a012c1ac7605bb51d25bf955befe9bb50edac32481deacd6ac
JWT_REFRESH_SECRET=e5cf479706a1fdab99c699af5034f56990578688a0375dacc607f635e04368b8
SESSION_SECRET=ce31e75d9a48173564580c995e981edd16629485e7324d1e16ff33e6e51c6b5b
OTP_SECRET=b6c98f6af0161062e121b7f782555ac7

# Wallet Security (EXTREMELY CRITICAL - NEVER COMMIT TO GIT)
WALLET_ENCRYPTION_KEY=cb66756a15b4f8804836968554fa7c120bd4de1f5aef21916456391081d0bd6b
WALLET_MASTER_SEED=<GENERATE_24_WORD_BIP39_MNEMONIC>
```

### Frontend Secrets

```env
NEXTAUTH_SECRET=ef59414fa7f7c39a520b57bc0877ae4a68c8a1dae3aba2e48c26922dd7ace7f2
```

## 📝 Manual Setup Required

### 1. Email Services Configuration

**Priority:** CRITICAL | **Time:** 20 minutes

Advancia uses multiple email providers for different purposes:

-   **Gmail SMTP** (Free tier): OTP codes and critical transactional emails
-   **Resend**: HTML email templates and marketing campaigns
-   **SendGrid**: Bulk communications and newsletters

#### Gmail SMTP Setup (Required for OTP Authentication)

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (if not already enabled)
3. Navigate to **Security → 2-Step Verification → App Passwords**
4. Select app: **Mail**, device: **Other (Custom name)** → "Advancia Backend"
5. Copy generated 16-character password:

   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # Remove spaces when adding to env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   ```

**Render Configuration:**

```bash
EMAIL_USER=advancia.notifications@gmail.com
EMAIL_PASSWORD=<16_CHAR_APP_PASSWORD_NO_SPACES>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

#### Resend Setup (Optional, for HTML emails)

1. Go to [Resend](https://resend.com)
2. Create an account and get API key
3. Copy API key:

   ```env
   RESEND_API_KEY=your_resend_api_key
   ```

**Render Configuration:**

```bash
RESEND_API_KEY=<YOUR_RESEND_API_KEY>
```

#### SendGrid Setup (Optional, for bulk emails)

1. Go to [SendGrid](https://sendgrid.com)
2. Create an account and get API key
3. Copy API key:

   ```env
   SENDGRID_API_KEY=your_sendgrid_api_key
   ```

**Render Configuration:**

```bash
SENDGRID_API_KEY=<YOUR_SENDGRID_API_KEY>
```

---

### 2. Stripe Configuration

**Priority:** HIGH | **Time:** 10 minutes

#### Steps

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers → API Keys**
3. Copy **Live Mode** keys:

   ```env
   STRIPE_SECRET_KEY=sk_live_xxxxx  # Backend
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx  # Frontend
   ```

4. Create webhook:
   -   Go to **Developers → Webhooks → Add Endpoint**
   -   URL: `https://api.advancia.com/api/payments/webhook`
   -   Events: `payment_intent.succeeded`, `payment_intent.failed`
   -   Copy webhook signing secret:

     ```env
     STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # Backend
     ```

**Render Configuration:**

```bash
# In Render dashboard for backend service:
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

**Vercel Configuration:**

```bash
# In Vercel dashboard for frontend:
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

---

### 3. BIP39 Wallet Master Seed

**Priority:** CRITICAL | **Time:** 15 minutes

#### Setup Steps

1. Go to [Ian Coleman BIP39 Tool](https://iancoleman.io/bip39/) (offline recommended)
2. Select **24 words** entropy
3. Generate mnemonic phrase
4. **WRITE DOWN ON PAPER** and store in secure location (safe, vault)
5. Copy to environment:

   ```env
   WALLET_MASTER_SEED=word1 word2 word3 ... word24
   ```

#### Security Best Practices

-   ⚠️ **NEVER** commit to git
-   ⚠️ **NEVER** share via email/Slack
-   ✅ Store in password manager (1Password, LastPass)
-   ✅ Keep offline backup in physical safe
-   ✅ Test derivation with small amounts first

**Render Configuration:**

```bash
WALLET_MASTER_SEED=<24_WORD_MNEMONIC>
WALLET_ENCRYPTION_KEY=cb66756a15b4f8804836968554fa7c120bd4de1f5aef21916456391081d0bd6b
```

---

### 4. Crypto Admin Wallets

**Priority:** HIGH | **Time:** 30 minutes

#### Bitcoin Admin Wallet

**Recommended:** Hardware wallet (Ledger, Trezor)

1. Generate new wallet with hardware device
2. Backup seed phrase securely (hardware wallets provide this)
3. Get receiving address:

   ```env
   BTC_ADMIN_WALLET_ADDRESS=bc1qxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

#### Ethereum Admin Wallet

1. Use hardware wallet or MetaMask (dedicated account)
2. Export address (NOT private key):

   ```env
   ETH_ADMIN_WALLET_ADDRESS=0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

#### CRITICAL: Admin Wallet Private Keys

**NEVER store private keys in environment variables.**
Use hardware wallets for signing transactions; only store public addresses.

**Render Configuration:**

```bash
BTC_ADMIN_WALLET_ADDRESS=<HARDWARE_WALLET_BTC_ADDRESS>
ETH_ADMIN_WALLET_ADDRESS=<HARDWARE_WALLET_ETH_ADDRESS>
```

---

### 5. Sentry Error Tracking

**Priority:** MEDIUM | **Time:** 5 minutes

#### Configuration Steps

1. Go to [Sentry.io](https://sentry.io)
2. Create new project → **Node.js** (backend) and **Next.js** (frontend)
3. Copy DSN from **Settings → Client Keys (DSN)**:

   ```env
   SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/123456
   ```

**Render Configuration (Backend):**

```bash
SENTRY_DSN=https://41dbdb2c446534ac933de22ca5c2778c@o4510400768573440.ingest.us.sentry.io/4510400800096256
```

**Vercel Configuration (Frontend):**

```bash
NEXT_PUBLIC_SENTRY_DSN=<YOUR_FRONTEND_SENTRY_DSN>
```

---

### 6. AWS S3 (Database Backups)

**Priority:** MEDIUM | **Time:** 10 minutes

#### Setup Instructions

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Create new IAM user: **advancia-backups**
3. Attach policy: **AmazonS3FullAccess** (or custom S3 bucket policy)
4. Create access key:

   ```env
   AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXXX
   AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   AWS_REGION=us-east-1
   S3_BACKUPS_BUCKET=advancia-db-backups
   ```

5. Create S3 bucket: `advancia-db-backups` with versioning enabled

**Render Configuration:**

```bash
AWS_ACCESS_KEY_ID=<IAM_USER_ACCESS_KEY>
AWS_SECRET_ACCESS_KEY=<IAM_USER_SECRET>
AWS_REGION=us-east-1
S3_BACKUPS_BUCKET=advancia-db-backups
```

---

### 7. Cryptomus (Crypto Payments)

**Priority:** HIGH | **Time:** 10 minutes

#### Integration Steps

1. Go to [Cryptomus Dashboard](https://app.cryptomus.com)
2. Create an account and complete merchant setup
3. Navigate to **API Settings** → Create API key
4. Copy API key and Merchant ID:

   ```env
   CRYPTOMUS_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   CRYPTOMUS_MERCHANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

5. Set up webhook URL in Cryptomus dashboard:
   -   URL: `https://api.advancia.com/api/cryptomus/webhook`
   -   Enable events: `payment.success`, `payment.failed`, `payment.pending`
   -   Copy webhook secret (if provided):

   ```env
   CRYPTOMUS_WEBHOOK_SECRET=your_webhook_secret
   ```

**Render Configuration:**

```bash
CRYPTOMUS_API_KEY=<YOUR_API_KEY>
CRYPTOMUS_MERCHANT_ID=<YOUR_MERCHANT_ID>
CRYPTOMUS_WEBHOOK_SECRET=<YOUR_WEBHOOK_SECRET>
```

---

### 8. Web Push Notifications (VAPID Keys)

**Priority:** LOW | **Time:** 2 minutes

#### Generate VAPID Keys

```bash
cd backend
node generate-vapid.js
```

Output:

```env
VAPID_PUBLIC_KEY=BH1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Render Configuration:**

```bash
VAPID_PUBLIC_KEY=<GENERATED_PUBLIC_KEY>
VAPID_PRIVATE_KEY=<GENERATED_PRIVATE_KEY>
```

**Vercel Configuration:**

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<GENERATED_PUBLIC_KEY>
```

---

## 🚀 Deployment Checklist

### Backend (Render)

1. Navigate to Render dashboard → Select backend service
2. Go to **Environment** tab
3. Add all secrets listed above
4. Click **Save Changes**
5. Render will auto-deploy with new secrets

### Frontend (Vercel)

1. Navigate to Vercel dashboard → Select frontend project
2. Go to **Settings → Environment Variables**
3. Add frontend-specific secrets (`NEXT_PUBLIC_*`, `NEXTAUTH_SECRET`)
4. Click **Save**
5. Redeploy via Vercel dashboard or push to `main` branch

---

## 🔒 Security Best Practices

### Storage

-   ✅ Store in 1Password/LastPass team vault
-   ✅ Limit access to 2-3 senior engineers only
-   ✅ Enable 2FA on all third-party services
-   ✅ Rotate secrets every 90 days (except wallet seeds)

### Monitoring

-   ✅ Enable Sentry alerts for auth failures
-   ✅ Set up AWS CloudWatch for S3 access logs
-   ✅ Monitor Stripe webhook delivery failures
-   ✅ Monitor Cryptomus webhook delivery and payment status
-   ✅ Weekly audit of environment variable access logs

### Incident Response

If secrets are compromised:

1. **Immediately rotate** affected secrets
2. Revoke old API keys/tokens
3. Update Render/Vercel environment variables
4. Force re-deploy all services
5. Notify users if user data potentially exposed
6. Document incident in security log

---

## 📋 Verification

After configuring all secrets, run:

```bash
# Backend verification
cd backend
npx ts-node scripts/verify-env.ts

# Full production readiness check
cd ..
pwsh -File scripts/verify-production.ps1
```

Expected output:

```text
✅ All required environment variables present
✅ Database connection successful
✅ Stripe API key valid
✅ Cryptomus API key valid
✅ Email SMTP connection successful
✅ AWS S3 bucket accessible
✅ Sentry DSN valid

PRODUCTION READINESS: 100%
```

---

## 🔗 Quick Links

-   [Stripe Dashboard](https://dashboard.stripe.com)
-   [Cryptomus Dashboard](https://app.cryptomus.com)
-   [Render Dashboard](https://dashboard.render.com)
-   [Vercel Dashboard](https://vercel.com/dashboard)
-   [Sentry Dashboard](https://sentry.io)
-   [AWS Console](https://console.aws.amazon.com)
-   [Resend Dashboard](https://resend.com/dashboard)
-   [SendGrid Dashboard](https://app.sendgrid.com)

---

**Last Updated:** December 2024
**Next Review:** March 2025 (90 days)
