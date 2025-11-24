# NOWPayments Integration Guide

## 🚀 Overview

NOWPayments has been integrated as an alternative crypto payment provider alongside Cryptomus. This gives your users:

-   **200+ cryptocurrencies** (vs Cryptomus ~50)
-   **Lower fees** (0.5% vs ~1%)
-   **Mass payouts** for user withdrawals
-   **Non-custodial option** for better security
-   **Better API documentation** and support

## 📋 Features Implemented

### Backend (`backend/src/routes/nowpayments.ts`)

All endpoints use **silent mode logging** - development logs to console, production ready for analytics integration.

#### Available Endpoints

1. **GET /api/nowpayments/currencies**
   -   Fetch all available cryptocurrencies
   -   Requires authentication
   -   Response: `{ success: true, currencies: [...] }`

2. **GET /api/nowpayments/min-amount/:currency**
   -   Get minimum payment amount for a currency
   -   Example: `/api/nowpayments/min-amount/btc`
   -   Response: `{ success: true, minAmount: "0.001", currency: "BTC" }`

3. **POST /api/nowpayments/create-payment**
   -   Create a new crypto payment invoice
   -   Body:

     ```json
     {
       "amount": 100,
       "currency": "btc",
       "orderId": "ORDER-123",
       "description": "Crypto withdrawal"
     }
     ```

   -   Response: Payment details with pay address, amount, invoice URL

4. **GET /api/nowpayments/payment/:paymentId**
   -   Get payment status
   -   Returns current status, amounts paid, timestamps

5. **POST /api/nowpayments/ipn**
   -   Webhook endpoint for Instant Payment Notifications
   -   Verifies HMAC-SHA512 signature
   -   Auto-updates payment status in database
   -   **Public endpoint** (no auth) - secured by signature verification

6. **GET /api/nowpayments/my-payments**
   -   List user's payment history
   -   Requires authentication
   -   Returns last 50 payments

### Database Schema Updates

Added `paymentProvider` field to `CryptoPayments` model:

```prisma
model CryptoPayments {
  id               String    @id
  user_id          String
  invoice_id       String
  amount           Float
  currency         String
  status           String    @default("pending")
  payment_url      String?
  order_id         String?
  description      String?
  paid_at          DateTime?
  created_at       DateTime?
  updated_at       DateTime?
  paymentProvider  String?   @default("cryptomus") // 'cryptomus' | 'nowpayments'

  @@index([user_id])
  @@index([status])
  @@index([paymentProvider])
}
```

### Frontend Updates

Updated `EnhancedFormExample.tsx` with payment provider selector:

-   **Radio card selection** between NOWPayments and Cryptomus
-   **Visual comparison** showing fees and coin counts
-   **Animated selection** with scale effects
-   **Recommended badge** on NOWPayments (lower fees)
-   **DaisyUI styling** matching existing form design

## 🔧 Setup Instructions

### 1. Get NOWPayments API Keys

**Sandbox (Testing):**

1. Go to <https://account.sandbox.nowpayments.io/>
2. Sign up for free sandbox account
3. Navigate to Settings → API Keys
4. Copy your **API Key** and **IPN Secret**

**Production:**

1. Go to <https://nowpayments.io/>
2. Complete KYC verification
3. Navigate to Dashboard → Settings → API
4. Generate API keys
5. Set up IPN (Instant Payment Notifications)

### 2. Configure Environment Variables

Add to `backend/.env`:

```env
# NOWPayments Configuration
NOWPAYMENTS_API_KEY=your_api_key_here
NOWPAYMENTS_IPN_SECRET=your_ipn_secret_here

# Your backend URL (for webhooks)
BACKEND_URL=http://localhost:4000

# Your frontend URL (for redirects)
FRONTEND_URL=http://localhost:3000
```

**Production values:**

```env
NOWPAYMENTS_API_KEY=prod_key_from_dashboard
NOWPAYMENTS_IPN_SECRET=prod_ipn_secret
BACKEND_URL=https://api.advanciapayledger.com
FRONTEND_URL=https://advanciapayledger.com
```

### 3. Run Database Migration

```bash
cd backend
npx prisma migrate dev --name add_payment_provider
npx prisma generate
```

### 4. Restart Backend Server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### 5. Test the Integration

**Frontend Test:**

1. Go to <http://localhost:3000/demo/tools>
2. Scroll to "Crypto Withdrawal Form"
3. Select **NOWPayments** provider
4. Fill in form and submit
5. Check browser console for API response

**Backend Test:**

```bash
# Test with curl
curl -X GET http://localhost:4000/api/nowpayments/currencies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔐 Security Features

### 1. Silent Mode Logging

All operations use silent mode logging:

-   **Development:** Logs to console with `[NOWPayments]` prefix
-   **Production:** No console spam, ready for analytics integration (Sentry, DataDog)

```typescript
function logDev(message: string, data?: any) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[NOWPayments] ${message}`, data || "");
  }
  // TODO: Add production analytics integration here
}
```

### 2. IPN Signature Verification

All webhook requests are verified using HMAC-SHA512:

```typescript
function verifyIPNSignature(payload: string, signature: string): boolean {
  const hmac = crypto.createHmac("sha512", NOWPAYMENTS_IPN_SECRET);
  hmac.update(payload);
  const expectedSignature = hmac.digest("hex");
  return expectedSignature === signature;
}
```

### 3. Authentication

All user-facing endpoints require JWT authentication via `authenticateToken` middleware.

## 📊 Payment Flow

### User Initiates Withdrawal

1. **Frontend:** User selects NOWPayments, fills form
2. **POST /api/nowpayments/create-payment**
3. **Backend:** Creates payment with NOWPayments API
4. **Backend:** Saves to `CryptoPayments` table with `paymentProvider: 'nowpayments'`
5. **Response:** Returns payment address, amount, invoice URL
6. **Frontend:** Displays payment details to user

### User Pays

1. User sends crypto to provided address
2. NOWPayments detects payment
3. **POST /api/nowpayments/ipn** (webhook)
4. **Backend:** Verifies signature
5. **Backend:** Updates payment status in database
6. **Backend:** Credits user account (if `status: 'finished'`)
7. **Frontend:** User sees updated balance

## 🧪 Testing Workflow

### 1. Sandbox Testing

**Test Payment:**

```bash
# Get available currencies
GET /api/nowpayments/currencies

# Create test payment
POST /api/nowpayments/create-payment
{
  "amount": 10,
  "currency": "btctest",
  "orderId": "TEST-001"
}

# Simulate payment in sandbox dashboard
# Check payment status
GET /api/nowpayments/payment/{payment_id}
```

### 2. Webhook Testing (Local Development)

Use **ngrok** to expose your local backend:

```bash
# Install ngrok
npm install -g ngrok

# Expose backend
ngrok http 4000

# Copy the https URL (e.g., https://abc123.ngrok.io)
# Set in NOWPayments dashboard:
# IPN URL: https://abc123.ngrok.io/api/nowpayments/ipn
```

### 3. End-to-End Test

1. Create payment via frontend form
2. Send test crypto to provided address
3. Monitor logs for IPN webhook
4. Verify database update
5. Check user balance credited

## 📈 Monitoring & Analytics

### Development Logs

All operations log to console with `[NOWPayments]` prefix:

```
[NOWPayments] Creating payment { amount: 10, currency: 'btc', userId: '...' }
[NOWPayments] Payment created successfully { paymentId: 123, payAddress: '...' }
[NOWPayments] IPN received { signature: 'abc123...' }
[NOWPayments] Payment updated in database { payment_id: 123, payment_status: 'finished' }
```

### Production Analytics

Replace the `// TODO` comment in `logDev()` with your analytics service:

**Sentry Example:**

```typescript
function logDev(message: string, data?: any) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[NOWPayments] ${message}`, data || "");
  } else {
    Sentry.addBreadcrumb({
      category: "nowpayments",
      message,
      data,
      level: "info",
    });
  }
}
```

**DataDog Example:**

```typescript
import { Logger } from "@datadog/browser-logs";

function logDev(message: string, data?: any) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[NOWPayments] ${message}`, data || "");
  } else {
    Logger.info(`[NOWPayments] ${message}`, data);
  }
}
```

## 🎯 Comparison: NOWPayments vs Cryptomus

| Feature                | NOWPayments    | Cryptomus |
| ---------------------- | -------------- | --------- |
| **Cryptocurrencies**   | 200+           | ~50       |
| **Transaction Fee**    | 0.5%           | ~1%       |
| **Mass Payouts**       | ✅ Yes         | ❌ No     |
| **Non-Custodial**      | ✅ Yes         | ❌ No     |
| **API Quality**        | ⭐⭐⭐⭐⭐     | ⭐⭐⭐⭐  |
| **Webhooks/IPN**       | ✅ HMAC-SHA512 | ✅ MD5    |
| **Integration Status** | ✅ Complete    | ⚠️ Legacy |
| **Recommended**        | ✅ Yes         | 🔄 Backup |

## 🔄 Migration Strategy

### Option 1: Dual Provider (Recommended)

Keep both providers active:

-   Users choose preferred provider
-   Lower fees with NOWPayments
-   Cryptomus as backup/alternative
-   **No disruption** to existing users

### Option 2: Full Migration

Switch entirely to NOWPayments:

-   Better fees and features
-   Requires migrating existing users
-   **Risk:** Disruption to active transactions

**Recommendation:** Use Option 1 (dual provider) for flexibility and redundancy.

## 🛠️ Troubleshooting

### Issue: "NOWPayments is not configured"

**Solution:** Check environment variables:

```bash
echo $NOWPAYMENTS_API_KEY
echo $NOWPAYMENTS_IPN_SECRET
```

### Issue: IPN webhook not firing

**Solutions:**

1. Verify IPN URL in NOWPayments dashboard
2. Check firewall allows incoming POST requests
3. Use ngrok for local testing
4. Verify signature verification is working

### Issue: Payment stuck in "waiting" status

**Solutions:**

1. Check payment address is correct
2. Verify user sent correct amount
3. Check blockchain confirmations
4. Contact NOWPayments support with payment_id

### Issue: Database migration fails

**Solution:**

```bash
cd backend
npx prisma migrate reset
npx prisma migrate dev
npx prisma generate
```

## 📚 Additional Resources

-   **NOWPayments Docs:** <https://documenter.getpostman.com/view/7907941/S1a32n38>
-   **API Reference:** <https://documenter.getpostman.com/view/7907941/S1a32n38>
-   **Sandbox Dashboard:** <https://account.sandbox.nowpayments.io/>
-   **Production Dashboard:** <https://nowpayments.io/dashboard>
-   **Support:** <support@nowpayments.io>

## 🎉 What's Next?

1. **Test in sandbox** environment
2. **Get production API keys** and complete KYC
3. **Set up monitoring** (Sentry/DataDog)
4. **Configure webhooks** with production URLs
5. **Launch** to production!

## 📝 Quick Reference

### Test the Integration

```bash
# 1. Start backend
cd backend && npm run dev

# 2. Start frontend
cd frontend && npm run dev

# 3. Open demo page
open http://localhost:3000/demo/tools

# 4. Select NOWPayments provider
# 5. Fill form and submit
# 6. Check console for logs
```

### Production Checklist

-   [ ] Production API keys configured
-   [ ] IPN webhook URL set in dashboard
-   [ ] HTTPS enabled for webhook endpoint
-   [ ] Signature verification working
-   [ ] Database migration complete
-   [ ] Frontend tested with real payments
-   [ ] Monitoring/analytics integrated
-   [ ] User documentation updated

---

**Integration Complete!** 🎉

NOWPayments is now fully integrated with silent mode logging, dual provider support, and production-ready webhook handling.
