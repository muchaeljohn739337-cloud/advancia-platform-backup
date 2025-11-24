# 🔧 Fix Vercel Frontend - Step-by-Step Guide

**Date**: November 21, 2025  
**Status**: ⚠️ **Action Required - Critical Fixes Needed**

---

## 🚨 **Critical Issues to Fix**

### 1. **API URL Typo** ❌ FIXED

-   ~~**Previous Wrong URLs**~~: `advancia-backend-upnf` and `advancia-backend-upnrf`
-   **Correct**: `https://advancia-backend.onrender.com`
-   **Impact**: Frontend must use this exact URL (from render.yaml line 3)

### 2. **Missing Environment Variables** (7 variables)

Without these, the following features won't work:

-   ❌ Stripe payments
-   ❌ Push notifications
-   ❌ Admin panel
-   ❌ Chatbot
-   ❌ Currency support
-   ❌ Feature flags

---

## 📋 **Step-by-Step Fix Instructions**

### **Option 1: Via Vercel Dashboard (Recommended - 10 minutes)**

#### Step 1: Access Vercel Dashboard

1. Go to <https://vercel.com/dashboard>
2. Sign in with your account
3. Find and click on your project (likely named `modular-saas-platform-frontend` or similar)

#### Step 2: Navigate to Environment Variables

1. Click on **Settings** tab (top navigation)
2. Click on **Environment Variables** in the left sidebar

#### Step 3: Fix the API URL Typo

1. Find `NEXT_PUBLIC_API_URL` in the list
2. Click the **⋯** (three dots) menu → **Edit**
3. Change the value from:

   ```
   https://advancia-backend.onrender.com
   ```

   to:

   ```
   https://advancia-backend.onrender.com
   ```

4. Select environments: **Production**, **Preview**, **Development** (check all)
5. Click **Save**

#### Step 4: Add Missing Environment Variables

For each variable below, click **Add New** and enter:

**Variable 1:**

```
Name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: pk_test_51SCrKDBRIxWx70ZdsfIT1MSMDyFYa0ke914P8qFm3knW16wmc7a4SLLx21I8dObEaGnx4IQcbTR5ZQoTnqNoZsIZ002l4i6QpB
Environments: Production, Preview, Development ✓✓✓
```

**Variable 2:**

```
Name: NEXT_PUBLIC_VAPID_KEY
Value: BLO1Omk_gOvP5kAG55P03sqh0poZ83S-saELgN4GDSTwMcWZ7xCsCIWQpY1vlLiqWSwNcZDLIk-txmLbPYjFww8
Environments: Production, Preview, Development ✓✓✓
```

**Variable 3:**

```
Name: NEXT_PUBLIC_ADMIN_KEY
Value: supersecureadminkey123
Environments: Production, Preview, Development ✓✓✓
```

**Variable 4:**

```
Name: NEXT_PUBLIC_BOTPRESS_BOT_ID
Value: 77ea23f8-6bf2-4647-9d24-bcc0fdc3281d
Environments: Production, Preview, Development ✓✓✓
```

**Variable 5:**

```
Name: NEXT_PUBLIC_APP_NAME
Value: Advancia PayLedger
Environments: Production, Preview, Development ✓✓✓
```

**Variable 6:**

```
Name: NEXT_PUBLIC_CURRENCY_LIST
Value: USD,EUR,BTC,ETH,USDT,TRUMP,MEDBED
Environments: Production, Preview, Development ✓✓✓
```

**Variable 7:**

```
Name: NEXT_PUBLIC_FEATURE_FLAGS
Value: notifications,bonus_tokens,debit_card,crypto_recovery
Environments: Production, Preview, Development ✓✓✓
```

#### Step 5: Redeploy Frontend

1. Go to **Deployments** tab
2. Find the latest deployment (top of the list)
3. Click the **⋯** (three dots) menu → **Redeploy**
4. Confirm: **Redeploy**
5. Wait 2-3 minutes for deployment to complete

#### Step 6: Verify Deployment

Once deployed, check:

1. Visit your frontend URL (e.g., <https://your-frontend.vercel.app>)
2. Open browser Developer Tools (F12)
3. Check Console tab for errors
4. Try to register/login to test backend connection

---

### **Option 2: Via Vercel CLI (Advanced - 5 minutes)**

If you have Vercel CLI installed:

```powershell
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
cd frontend
vercel link

# Fix API URL (remove old, add new)
vercel env rm NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_API_URL production
# When prompted, enter: https://advancia-backend.onrender.com

# Add missing variables
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
# When prompted, paste: pk_test_51SCrKDBRIxWx70ZdsfIT1MSMDyFYa0ke914P8qFm3knW16wmc7a4SLLx21I8dObEaGnx4IQcbTR5ZQoTnqNoZsIZ002l4i6QpB

vercel env add NEXT_PUBLIC_VAPID_KEY production
# When prompted, paste: BLO1Omk_gOvP5kAG55P03sqh0poZ83S-saELgN4GDSTwMcWZ7xCsCIWQpY1vlLiqWSwNcZDLIk-txmLbPYjFww8

vercel env add NEXT_PUBLIC_ADMIN_KEY production
# When prompted, paste: supersecureadminkey123

vercel env add NEXT_PUBLIC_BOTPRESS_BOT_ID production
# When prompted, paste: 77ea23f8-6bf2-4647-9d24-bcc0fdc3281d

vercel env add NEXT_PUBLIC_APP_NAME production
# When prompted, paste: Advancia PayLedger

vercel env add NEXT_PUBLIC_CURRENCY_LIST production
# When prompted, paste: USD,EUR,BTC,ETH,USDT,TRUMP,MEDBED

vercel env add NEXT_PUBLIC_FEATURE_FLAGS production
# When prompted, paste: notifications,bonus_tokens,debit_card,crypto_recovery

# Redeploy
vercel --prod
```

---

## ✅ **Verification Checklist**

After redeployment, verify these work:

-   [ ] Frontend loads without console errors
-   [ ] API calls reach backend (check Network tab in DevTools)
-   [ ] Stripe payment form appears (if applicable)
-   [ ] Push notification prompt works
-   [ ] Admin panel accessible
-   [ ] Chatbot widget loads
-   [ ] Currency selector shows all currencies
-   [ ] Feature flags are active

---

## 🔍 **How to Test Backend Connection**

### Test 1: Check Environment Variables

1. Open your frontend URL
2. Open DevTools (F12) → Console
3. Type: `console.log(process.env.NEXT_PUBLIC_API_URL)`
4. Should show: `https://advancia-backend.onrender.com`

### Test 2: Test API Call

1. Open DevTools (F12) → Network tab
2. Try to login or register
3. Look for API calls to `advancia-backend.onrender.com`
4. Check response status (should not be 404)

### Test 3: Health Check (Manual)

```powershell
# Test backend directly
curl https://advancia-backend.onrender.com/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-11-21T..."}
```

---

## 🚨 **Common Issues & Solutions**

### Issue: "Environment variables not updating after redeploy"

**Solution**:

1. Clear Vercel build cache: Settings → Clear Build Cache
2. Redeploy with **Force Redeploy** option
3. Wait 5 minutes, hard refresh browser (Ctrl+Shift+R)

### Issue: "Frontend still shows old API URL"

**Solution**:

1. Check if variable is set for **Production** environment
2. Verify you redeployed **production** (not preview)
3. Check browser cache - clear and reload

### Issue: "CORS errors after fixing API URL"

**Solution**:

1. Backend needs to allow your Vercel frontend URL
2. Update backend `ALLOWED_ORIGINS` environment variable
3. Include your Vercel URL in the list

### Issue: "Features still not working after adding env vars"

**Solution**:

1. Ensure you selected **all environments** when adding
2. Do a **full redeploy** (not just rebuild)
3. Check browser console for specific error messages

---

## 📊 **Complete Environment Variables List**

After fixes, your Vercel project should have:

| Variable                           | Value                                   | Status         |
| ---------------------------------- | --------------------------------------- | -------------- |
| NEXT_PUBLIC_API_URL                | `https://advancia-backend.onrender.com` | ✅ Fixed       |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | pk_test_51SC...                         | ➕ Added       |
| NEXT_PUBLIC_VAPID_KEY              | BLO1Omk...                              | ➕ Added       |
| NEXT_PUBLIC_ADMIN_KEY              | supersecure...                          | ➕ Added       |
| NEXT_PUBLIC_BOTPRESS_BOT_ID        | 77ea23f8...                             | ➕ Added       |
| NEXT_PUBLIC_APP_NAME               | Advancia PayLedger                      | ➕ Added       |
| NEXT_PUBLIC_CURRENCY_LIST          | USD,EUR,BTC...                          | ➕ Added       |
| NEXT_PUBLIC_FEATURE_FLAGS          | notifications...                        | ➕ Added       |
| NEXTAUTH_URL                       | <https://advanciapayledger.com>           | ✅ Already set |
| NEXTAUTH_SECRET                    | G25OYIKT...                             | ✅ Already set |
| GMAIL_EMAIL                        | <advanciapayledger@gmail.com>             | ✅ Already set |
| GMAIL_APP_PASSWORD                 | qmbkdljx...                             | ✅ Already set |
| RESEND_API_KEY                     | re_placeholder                          | ✅ Already set |

---

## 🎯 **After Fixing - Next Steps**

Once Vercel frontend is fixed:

1. **Test full user flow**:
   -   Register new account
   -   Login with credentials
   -   Try a payment (if applicable)
   -   Test notifications

2. **Update Backend CORS** (if needed):
   -   Go to Render → advancia-backend → Environment
   -   Update `ALLOWED_ORIGINS` to include your Vercel URL
   -   Redeploy backend

3. **Custom Domain Setup** (optional):
   -   Add `advanciapayledger.com` to Vercel
   -   Update `NEXTAUTH_URL` to use custom domain
   -   Update backend `ALLOWED_ORIGINS`

---

## 📞 **Need Help?**

**If frontend still doesn't work after fixes:**

1. Share browser console errors (F12 → Console)
2. Share network errors (F12 → Network → failed requests)
3. Confirm environment variables are saved in Vercel
4. Verify backend is actually running (test health endpoint)

---

**Estimated Time**: 10 minutes (manual) or 5 minutes (CLI)  
**Difficulty**: Easy  
**Impact**: Critical - Frontend won't work without these fixes
