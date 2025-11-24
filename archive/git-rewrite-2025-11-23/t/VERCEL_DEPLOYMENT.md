# Vercel Deployment - Environment Variables

## ✅ Already Configured in Vercel

-   ✅ `GMAIL_EMAIL` = <advanciapayledger@gmail.com>
-   ✅ `GMAIL_APP_PASSWORD` = qmbkdljxrubtzihx
-   ✅ `RESEND_API_KEY` = re_placeholder
-   ✅ `NEXTAUTH_URL` = (currently set, update if needed)
-   ✅ `NEXT_PUBLIC_API_URL` = <https://advancia-backend-upnf.onrender.com> ⚠️ **FIX TYPO** → should be `upnrf` not `upnf`
-   ✅ `NEXTAUTH_SECRET` = G25OYIKThrSmzvBB7tqTVBdV90x9J/bTTyKEUZ2aaqs=

## ⚠️ Missing - Add These to Vercel Dashboard

Go to **Settings → Environment Variables** and add:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SCrKDBRIxWx70ZdsfIT1MSMDyFYa0ke914P8qFm3knW16wmc7a4SLLx21I8dObEaGnx4IQcbTR5ZQoTnqNoZsIZ002l4i6QpB

NEXT_PUBLIC_VAPID_KEY=BLO1Omk_gOvP5kAG55P03sqh0poZ83S-saELgN4GDSTwMcWZ7xCsCIWQpY1vlLiqWSwNcZDLIk-txmLbPYjFww8

NEXT_PUBLIC_ADMIN_KEY=supersecureadminkey123

NEXT_PUBLIC_BOTPRESS_BOT_ID=77ea23f8-6bf2-4647-9d24-bcc0fdc3281d

NEXT_PUBLIC_APP_NAME=Advancia PayLedger

NEXT_PUBLIC_CURRENCY_LIST=USD,EUR,BTC,ETH,USDT,TRUMP,MEDBED

NEXT_PUBLIC_FEATURE_FLAGS=notifications,bonus_tokens,debit_card,crypto_recovery
```

## 🔧 Fix Required

**CRITICAL**: Update `NEXT_PUBLIC_API_URL` - there's a typo:

-   Current: `https://advancia-backend-upnf.onrender.com` ❌
-   Correct: `https://advancia-backend-upnrf.onrender.com` ✅

## Production Domain Setup

Once you have your custom domain:

```
NEXTAUTH_URL=https://advanciapayledger.com
```
