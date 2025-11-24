# Render Environment Variables - Critical Fixes

**Service**: advancia-backend (srv-d4froq8gjchc73djvp00)
**Date**: November 20, 2025

## 🚨 IMMEDIATE ACTION REQUIRED

### Step 1: Delete Invalid Variables

Go to Render Dashboard → Environment → Delete these:

1. ❌ `SENTRY_DSN` = `3040155bb82e661cf67afc469c94b5cc` (invalid)
2. ❌ `VAPID_PUBLIC_KEY` = `3156d55b58b3c102690c2fad5feaf870` (invalid)
3. ❌ `VAPID_PRIVATE_KEY` = `2ee5739dd2db4ea32f65e15c17953831` (invalid)

### Step 2: Add Proper VAPID Keys

```bash
VAPID_PUBLIC_KEY=BJmfJtNJI4OHutTbB3smUURJltgZCysjoOo3fQcmaUmOIJS_n1K0cjDjp_9yZlas0TxyOj37otHkXnNs0_vx-Wo

VAPID_PRIVATE_KEY=5B0_yOZoG3xH7L6kSCDQi5a1uUN_Oy9KvUXyj51fW4s
```

### Step 3: Fix Stripe Webhook Secret

#### Current (INVALID)

```
STRIPE_WEBHOOK_SECRET=f097258e80bb8dc2e625c5858297ab9a
```

#### How to Get Proper Secret

1. Go to: <https://dashboard.stripe.com/test/webhooks>
2. Click "+ Add endpoint"
3. Endpoint URL: `https://api.advanciapayledger.com/api/payments/webhook`
4. Select events:
   -   ✅ payment_intent.succeeded
   -   ✅ payment_intent.payment_failed
   -   ✅ payment_intent.canceled
5. Click "Add endpoint"
6. Click "Reveal" to see webhook signing secret (starts with `whsec_...`)
7. Copy the full secret (looks like: `whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

#### Add to Render

```bash
STRIPE_WEBHOOK_SECRET=whsec_[YOUR_ACTUAL_SECRET_HERE]
```

### Step 4: Optional - Add Sentry (Later)

If you want error monitoring, create a Sentry project and add:

```bash
SENTRY_DSN=https://[hash]@o[org-id].ingest.sentry.io/[project-id]
```

---

## ✅ Quick Checklist

-   [ ] Delete 3 invalid variables (SENTRY_DSN, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
-   [ ] Add new VAPID_PUBLIC_KEY (from above)
-   [ ] Add new VAPID_PRIVATE_KEY (from above)
-   [ ] Create Stripe webhook endpoint at <https://dashboard.stripe.com/test/webhooks>
-   [ ] Copy proper STRIPE*WEBHOOK_SECRET (starts with `whsec*`)
-   [ ] Update STRIPE_WEBHOOK_SECRET in Render
-   [ ] Wait for Render auto-redeploy (or manually trigger)
-   [ ] Test: `curl https://api.advanciapayledger.com/api/health`
-   [ ] Expected: `{"status":"healthy","timestamp":"..."}`

---

## 🔍 Why This Matters

**502 Bad Gateway** = Backend crashed on startup because:

-   Invalid VAPID keys caused `webpush.setVapidDetails()` to throw error
-   Invalid STRIPE_WEBHOOK_SECRET prevents webhook verification
-   Invalid SENTRY_DSN format (optional, but was malformed)

**After Fix**: Backend will start successfully and handle:

-   ✅ Stripe payment webhooks
-   ✅ Web push notifications
-   ✅ Real-time Socket.IO events
-   ✅ Cryptomus crypto payments

---

## 📋 All Environment Variables (Reference)

Keep these as-is (already correct):

```bash
DATABASE_URL=postgresql://db_adnan_postrl_user:Gd1XFfDxFVsM5MltemAhFE3zPNcRh5hg@dpg-d4f112trnu6s73doipjg-a.oregon-postgres.render.com/db_adnan_postrl
FRONTEND_URL=https://advanciapayledger.com
PORT=4000
NODE_ENV=production
JWT_SECRET=6a4ba74a9d1f16e3... (your full key)
JWT_EXPIRATION=7d
SESSION_SECRET=5f15fb63c9a52edc... (your full key)
STRIPE_SECRET_KEY=sk_test_51SCrKDBRIxWx70Zd... (your full key)
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CRYPTOMUS_API_KEY=f8a3fe0ed5eaac626fffe5e9fb2edffd
CRYPTOMUS_MERCHANT_ID=4788ab04437119a36ef870b57a15a490
ALLOWED_ORIGINS=https://advanciapayledger.com,https://www.advanciapayledger.com
```
