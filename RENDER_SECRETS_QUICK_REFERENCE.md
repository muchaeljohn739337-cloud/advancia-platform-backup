# 🎯 RENDER ENVIRONMENT VARIABLES - READY TO PASTE

**Generated**: November 21, 2025  
**Status**: ✅ All Core Secrets Generated

---

## ✅ COPY THESE 7 VALUES NOW (Core Auth & Security)

### 1. JWT_SECRET

```
>Q2mYL24HFVR$!Y00mY^J<=sK4Rc2YceU2v%7cl,C=z|:&)R>G,u6Z*19W4-[70,
```

### 2. SESSION_SECRET

```
29fIHi#UKpOW04K#@au8,^I96f)0tksnhf-oaE3TqOz]oFSH5-Dgv$=HpLp1YH?W
```

### 3. JWT_SECRET_ENCRYPTED

```
{M*xo>i;=}5tv^=q_9+xi!X.3P&lRbp@nA}S(uz9AFtj17yCrwBsp^@XD*;NlU.i
```

### 4. JWT_ENCRYPTION_KEY

```
fea5dbaa4d1801cab8593923e42cb97e3b436ee30ac3c5d211b1fddf306348f2
```

### 5. JWT_ENCRYPTION_IV

```
hgFrH0Ro2wfqOWXmQvtQ1Q==
```

### 6. VAPID_PUBLIC_KEY

```
BLlPxsf0wmOuUE1jmEckN5NUpPmXsxpVivC12nZxdAUFX34T-5RqPq5z8Vj3ZDM7TJqQ-YqJ1gIGVWY8KMqkG3Y
```

### 7. VAPID_PRIVATE_KEY

```
Aoza9d-LSPv-XAXbf_2kH8sWSFqWGBQKPklMKVwDK1I
```

---

## 🔑 EXTERNAL KEYS NEEDED (8 Values)

### Stripe Keys (3 values)

📍 Go to: <https://dashboard.stripe.com/test/apikeys>

**8. STRIPE_SECRET_KEY**

-   Click "Reveal test key"
-   Format: `sk_test_...`

**9. STRIPE_PUBLISHABLE_KEY**

-   Already visible
-   Format: `pk_test_...`

**10. STRIPE_WEBHOOK_SECRET**

-   Go to: <https://dashboard.stripe.com/test/webhooks>
-   Add endpoint: `https://advancia-backend.onrender.com/api/payments/webhook`
-   Select events: `payment_intent.*` and `charge.*`
-   Copy signing secret: `whsec_...`

---

### Cryptomus Keys (2 values)

📍 Go to: <https://cryptomus.com/dashboard>

**11. CRYPTOMUS_API_KEY**

-   Dashboard → API Keys → Copy

**12. CRYPTOMUS_MERCHANT_ID**

-   Dashboard → Merchant Settings → Copy ID

⚠️ **Optional**: Skip if not using crypto payments initially

---

### Sentry (1 value)

📍 Go to: <https://sentry.io>

**13. SENTRY_DSN**

-   Create project → Settings → Client Keys (DSN)
-   Format: `https://...@sentry.io/...`

⚠️ **Optional**: Can leave empty or skip for now

---

### Gmail SMTP (2 values)

📍 Go to: <https://myaccount.google.com/apppasswords>

**14. EMAIL_USER**

-   Your Gmail address (e.g., `your-email@gmail.com`)

**15. EMAIL_PASSWORD**

-   Create app password: "Advancia Backend"
-   Copy 16-character password (e.g., `abcd efgh ijkl mnop`)
-   ⚠️ Use App Password, NOT your regular Gmail password

---

## 🚀 DEPLOYMENT STRATEGY

### Option A: Quick Deploy (Minimum Required)

**Deploy NOW with just 9 values** (skip optional services):

✅ Required:

1. JWT_SECRET
2. SESSION_SECRET
3. JWT_SECRET_ENCRYPTED
4. JWT_ENCRYPTION_KEY
5. JWT_ENCRYPTION_IV
6. VAPID_PUBLIC_KEY
7. VAPID_PRIVATE_KEY
8. EMAIL_USER
9. EMAIL_PASSWORD

❌ Skip for now:

-   Stripe (add later when ready for payments)
-   Cryptomus (add later for crypto)
-   Sentry (add later for monitoring)

**Result**: Backend will deploy and work for basic features

---

### Option B: Full Deploy (All Features)

**Deploy with all 15 values** for complete functionality:

✅ All 7 generated secrets
✅ All 8 external keys (Stripe, Cryptomus, Sentry, Gmail)

**Result**: All features work immediately

---

## 📝 RENDER DASHBOARD STEPS

1. **Paste Generated Secrets** (7 values above)
   -   JWT_SECRET → Paste: `>Q2mYL24HFVR$!Y00mY^J<=sK4Rc2YceU2v%7cl,C=z|:&)R>G,u6Z*19W4-[70,`
   -   SESSION_SECRET → Paste: `29fIHi#UKpOW04K#@au8,^I96f)0tksnhf-oaE3TqOz]oFSH5-Dgv$=HpLp1YH?W`
   -   JWT_SECRET_ENCRYPTED → Paste: `{M*xo>i;=}5tv^=q_9+xi!X.3P&lRbp@nA}S(uz9AFtj17yCrwBsp^@XD*;NlU.i`
   -   JWT_ENCRYPTION_KEY → Paste: `fea5dbaa4d1801cab8593923e42cb97e3b436ee30ac3c5d211b1fddf306348f2`
   -   JWT_ENCRYPTION_IV → Paste: `hgFrH0Ro2wfqOWXmQvtQ1Q==`
   -   VAPID_PUBLIC_KEY → Paste: `BLlPxsf0wmOuUE1jmEckN5NUpPmXsxpVivC12nZxdAUFX34T-5RqPq5z8Vj3ZDM7TJqQ-YqJ1gIGVWY8KMqkG3Y`
   -   VAPID_PRIVATE_KEY → Paste: `Aoza9d-LSPv-XAXbf_2kH8sWSFqWGBQKPklMKVwDK1I`

2. **Add Email Keys** (2 values)
   -   EMAIL_USER → Your Gmail
   -   EMAIL_PASSWORD → Gmail App Password

3. **Add External Keys** (Optional, 6 values)
   -   STRIPE_SECRET_KEY
   -   STRIPE_PUBLISHABLE_KEY
   -   STRIPE_WEBHOOK_SECRET
   -   CRYPTOMUS_API_KEY
   -   CRYPTOMUS_MERCHANT_ID
   -   SENTRY_DSN

4. **Click "Deploy Blueprint"**

5. **Monitor Logs**
   -   Dashboard → advancia-backend → Logs
   -   Wait 3-5 minutes
   -   Look for: `Server running on port 4000`

6. **Test Backend**

   ```bash
   curl https://advancia-backend.onrender.com/api/health
   ```

---

## ⏭️ AFTER BACKEND IS LIVE

### Update Vercel Frontend

Go to: <https://vercel.com/dashboard> → Your Project → Settings → Environment Variables

Add for **Production, Preview, Development**:

```bash
NEXT_PUBLIC_API_URL=https://advancia-backend.onrender.com
NEXT_PUBLIC_WS_URL=wss://advancia-backend.onrender.com
NEXT_PUBLIC_VAPID_KEY=BLlPxsf0wmOuUE1jmEckN5NUpPmXsxpVivC12nZxdAUFX34T-5RqPq5z8Vj3ZDM7TJqQ-YqJ1gIGVWY8KMqkG3Y
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[your pk_test_ key]
```

Plus 5 more variables (see DEPLOYMENT_IMPLEMENTATION_GUIDE.md)

---

## ✅ SUCCESS CHECKLIST

-   [ ] Paste 7 generated secrets to Render
-   [ ] Add Gmail email credentials (2 values)
-   [ ] Add Stripe keys (3 values) OR skip for now
-   [ ] Add Cryptomus keys (2 values) OR skip for now
-   [ ] Add Sentry DSN (1 value) OR skip for now
-   [ ] Click "Deploy Blueprint"
-   [ ] Wait 3-5 minutes for deployment
-   [ ] Check logs for "Server running"
-   [ ] Test: `curl https://advancia-backend.onrender.com/api/health`
-   [ ] Update Vercel environment variables
-   [ ] Test full stack integration

---

## 🆘 TROUBLESHOOTING

### "Build Failed" in Render Logs

-   Check if all required variables are set
-   Verify DATABASE_URL is configured
-   Check for Prisma migration errors

### "Cannot connect to database"

-   DATABASE_URL should be auto-configured by Render
-   Verify PostgreSQL service is running
-   Check Render Dashboard → Databases

### "Missing JWT_SECRET" error

-   Ensure all JWT-related variables are set
-   No extra spaces in values
-   Values must be exactly as generated

---

## 📞 NEED HELP?

1. **Check Logs**: Render Dashboard → advancia-backend → Logs
2. **Verify Variables**: Render Dashboard → Environment tab
3. **Test Health Endpoint**: `curl https://advancia-backend.onrender.com/api/health`
4. **Review Documentation**: `DEPLOYMENT_IMPLEMENTATION_GUIDE.md`

---

**Files Created**:

-   ✅ `.env.render.generated` - Full reference with all values
-   ✅ `scripts/generate-secrets.ps1` - Script to regenerate secrets
-   ✅ `RENDER_SECRETS_QUICK_REFERENCE.md` - This file

**Status**: ✅ Ready to deploy!
