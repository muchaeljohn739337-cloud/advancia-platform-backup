# Vercel Environment Variables - Complete List

Add these to **Vercel Dashboard → Settings → Environment Variables**:

## Required Environment Variables

```bash
# Stripe Payment
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SCrKDBRIxWx70ZdsfIT1MSMDyFYa0ke914P8qFm3knW16wmc7a4SLLx21I8dObEaGnx4IQcbTR5ZQoTnqNoZsIZ002l4i6QpB

# Web Push Notifications
NEXT_PUBLIC_VAPID_KEY=BLO1Omk_gOvP5kAG55P03sqh0poZ83S-saELgN4GDSTwMcWZ7xCsCIWQpY1vlLiqWSwNcZDLIk-txmLbPYjFww8

# Admin Access
NEXT_PUBLIC_ADMIN_KEY=supersecureadminkey123

# Botpress Chatbot
NEXT_PUBLIC_BOTPRESS_BOT_ID=77ea23f8-6bf2-4647-9d24-bcc0fdc3281d

# App Configuration
NEXT_PUBLIC_APP_NAME=Advancia PayLedger

# Supported Currencies
NEXT_PUBLIC_CURRENCY_LIST=USD,EUR,BTC,ETH,USDT,TRUMP,MEDBED

# Feature Flags
NEXT_PUBLIC_FEATURE_FLAGS=notifications,bonus_tokens,debit_card,crypto_recovery

# NextAuth
NEXTAUTH_SECRET=G25OYIKThrSmzvBB7tqTVBdV90x9J/bTTyKEUZ2aaqs=
NEXTAUTH_URL=https://advanciapayledger.com

# Backend API
NEXT_PUBLIC_API_URL=https://advancia-backend-upnrf.onrender.com

# Email (already configured)
GMAIL_EMAIL=advanciapayledger@gmail.com
GMAIL_APP_PASSWORD=qmbkdljxrubtzihx
RESEND_API_KEY=re_placeholder
```

## ✅ Status

All environment variables are ready for Vercel deployment!

## 🚀 Deployment Steps

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable above
5. Apply to: **Production, Preview, Development** (all environments)
6. Click **Redeploy** to apply changes

