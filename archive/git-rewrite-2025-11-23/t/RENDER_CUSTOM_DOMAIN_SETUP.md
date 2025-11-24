# 🌐 Custom Domain Setup for Render.com

Complete guide to configure custom domains for Advancia PayLedger on Render.

## 📋 Overview

**Target Domains:**

-   Frontend: `advanciapayledger.com` (main site)
-   Backend API: `api.advanciapayledger.com` (API endpoints)
-   Optional: `www.advanciapayledger.com` (www redirect)

**Current Render Services:**

-   Frontend: `advancia-frontend` (Virginia)
-   Backend: `advancia-backend-upnrf` (Oregon)

---

## Prerequisites

✅ **Domain Name Purchased**

-   Register domain from: Namecheap, GoDaddy, Google Domains, Cloudflare, etc.
-   Cost: ~$10-15/year

✅ **Render Account**

-   Free tier is sufficient
-   Services already deployed

✅ **DNS Access**

-   Access to your domain registrar's DNS management

---

## Step-by-Step Setup

### Part 1: Backend API Domain (api.advanciapayledger.com)

#### 1. Add Custom Domain in Render Dashboard

```
1. Go to: https://dashboard.render.com
2. Click on: advancia-backend-upnrf
3. Navigate to: Settings → Custom Domain
4. Click: Add Custom Domain
5. Enter: api.advanciapayledger.com
6. Click: Save
```

Render will show you DNS records to configure:

**CNAME Record (Recommended):**

```
Type: CNAME
Name: api
Value: advancia-backend-upnrf.onrender.com
TTL: 3600 (or Auto)
```

**OR A Record (if CNAME not supported):**

```
Type: A
Name: api
Value: [IP address shown by Render]
TTL: 3600
```

#### 2. Configure DNS Records

**For Namecheap:**

```
1. Login to Namecheap
2. Dashboard → Domain List → Manage
3. Advanced DNS → Add New Record
   - Type: CNAME Record
   - Host: api
   - Value: advancia-backend-upnrf.onrender.com
   - TTL: Automatic
4. Save Changes
```

**For Cloudflare:**

```
1. Login to Cloudflare
2. Select your domain
3. DNS → Records → Add Record
   - Type: CNAME
   - Name: api
   - Target: advancia-backend-upnrf.onrender.com
   - Proxy status: DNS only (gray cloud) ⚠️ IMPORTANT
   - TTL: Auto
4. Save
```

**For GoDaddy:**

```
1. Login to GoDaddy
2. My Products → DNS
3. Add → CNAME
   - Name: api
   - Value: advancia-backend-upnrf.onrender.com
   - TTL: 1 Hour
4. Save
```

#### 3. Verify DNS Propagation

```bash
# Check DNS from terminal (wait 5-60 minutes)
dig api.advanciapayledger.com

# Or use online tools:
# https://dnschecker.org
# https://www.whatsmydns.net
```

#### 4. Wait for SSL Certificate

Render automatically provisions SSL certificate (Let's Encrypt):

-   Usually takes: 5-15 minutes after DNS propagates
-   Status shown in Render dashboard
-   Will show: ✅ SSL certificate issued

#### 5. Test Backend API

```bash
# Test health endpoint
curl https://api.advanciapayledger.com/api/health

# Should return:
{"status":"healthy"}
```

---

### Part 2: Frontend Domain (advanciapayledger.com)

#### 1. Add Custom Domain in Render Dashboard

```
1. Go to: https://dashboard.render.com
2. Click on: advancia-frontend
3. Navigate to: Settings → Custom Domain
4. Click: Add Custom Domain
5. Enter: advanciapayledger.com
6. Click: Save
```

#### 2. Configure DNS Records

**Root Domain (advanciapayledger.com):**

Most registrars require A records for root domains:

```
Type: A
Name: @ (or leave blank for root)
Value: [IP shown by Render - e.g., 216.24.57.1]
TTL: 3600
```

**If your registrar supports ALIAS/ANAME:**

```
Type: ALIAS or ANAME
Name: @
Value: advancia-frontend.onrender.com
TTL: 3600
```

#### 3. Add WWW Subdomain (Optional but Recommended)

```
Type: CNAME
Name: www
Value: advanciapayledger.com
TTL: 3600
```

Also add `www.advanciapayledger.com` in Render:

```
1. Same service (advancia-frontend)
2. Settings → Custom Domain
3. Add: www.advanciapayledger.com
4. Render will handle www → non-www redirect
```

#### 4. Complete DNS Configuration Example

**Your DNS records should look like this:**

```
# Root domain (frontend)
Type    Name    Value                               TTL
A       @       216.24.57.1                        3600

# WWW redirect
CNAME   www     advanciapayledger.com              3600

# API subdomain
CNAME   api     advancia-backend-upnrf.onrender.com 3600
```

#### 5. Wait for DNS Propagation

```bash
# Check root domain
dig advanciapayledger.com

# Check www
dig www.advanciapayledger.com

# Check API
dig api.advanciapayledger.com
```

**Propagation time:** 5 minutes to 48 hours (usually 15-30 minutes)

#### 6. Wait for SSL Certificates

Render will automatically:

-   Issue SSL for `advanciapayledger.com`
-   Issue SSL for `www.advanciapayledger.com`
-   Issue SSL for `api.advanciapayledger.com`

**Check status in Render Dashboard:**

-   ✅ All should show "SSL certificate issued"

---

### Part 3: Update Environment Variables

Once domains are active, update these in **Render Dashboard**:

#### Backend Environment Variables

```
1. Go to advancia-backend-upnrf
2. Environment → Edit
3. Update:
   - FRONTEND_URL = https://advanciapayledger.com
   - ALLOWED_ORIGINS = https://advanciapayledger.com,https://www.advanciapayledger.com
4. Save Changes (triggers redeploy)
```

#### Frontend Environment Variables

Already configured in `render.yaml`:

```yaml
NEXT_PUBLIC_API_URL: https://api.advanciapayledger.com
NEXTAUTH_URL: https://advanciapayledger.com
```

No changes needed if these are already set!

---

### Part 4: Verification Checklist

Test all endpoints after DNS propagates:

```bash
# 1. Frontend (root)
curl -I https://advanciapayledger.com
# Should return: 200 OK

# 2. Frontend (www - should redirect)
curl -I https://www.advanciapayledger.com
# Should return: 301 or 308 redirect to non-www

# 3. Backend API health
curl https://api.advanciapayledger.com/api/health
# Should return: {"status":"healthy"}

# 4. Backend API test endpoint
curl https://api.advanciapayledger.com/api/auth/me \
  -H "x-api-key: dev-api-key-123"
# Should return: auth error (expected - means API works)

# 5. SSL certificate check
curl -vI https://advanciapayledger.com 2>&1 | grep -i "SSL certificate"
# Should show: Valid Let's Encrypt certificate
```

**Browser Tests:**

1. Visit `https://advanciapayledger.com` - Should load frontend
2. Visit `https://www.advanciapayledger.com` - Should redirect to non-www
3. Visit `https://api.advanciapayledger.com/api/health` - Should show `{"status":"healthy"}`
4. Check browser security icon - Should show 🔒 (valid SSL)

---

## Common Issues & Solutions

### Issue 1: "Domain not found" or DNS errors

**Cause:** DNS not propagated yet

**Solution:**

```bash
# Check DNS propagation status
dig advanciapayledger.com +short

# If empty, wait 15-30 minutes
# Check with online tool: https://dnschecker.org
```

### Issue 2: "SSL certificate not issued"

**Cause:** DNS must be fully propagated before SSL

**Solution:**

1. Verify DNS is correct and propagated
2. Wait 10-15 minutes for Render to issue certificate
3. If stuck > 1 hour, remove and re-add domain in Render

### Issue 3: CORS errors in browser console

**Cause:** Backend doesn't allow frontend domain

**Solution:**

```
1. Go to backend service in Render
2. Environment → ALLOWED_ORIGINS
3. Add: https://advanciapayledger.com
4. Save (triggers redeploy)
```

### Issue 4: API calls fail with 404

**Cause:** Frontend pointing to old API URL

**Solution:**

```
1. Go to frontend service
2. Environment → NEXT_PUBLIC_API_URL
3. Set to: https://api.advanciapayledger.com
4. Save (triggers redeploy)
```

### Issue 5: "Too many redirects" error

**Cause:** Cloudflare proxy enabled with Render SSL

**Solution:**

```
1. Go to Cloudflare DNS
2. Click orange cloud to make it gray (DNS only)
3. Disable Cloudflare proxy for Render domains
```

---

## Cloudflare-Specific Setup (If Using Cloudflare)

⚠️ **IMPORTANT:** Render doesn't work with Cloudflare proxy enabled

### Correct Cloudflare Configuration

```
1. Cloudflare Dashboard → DNS → Records
2. Add records with GRAY CLOUD (DNS only):

   Type    Name    Target                              Proxy
   A       @       216.24.57.1                        ⚪ DNS only
   CNAME   www     advanciapayledger.com              ⚪ DNS only
   CNAME   api     advancia-backend-upnrf.onrender.com ⚪ DNS only
```

**SSL/TLS Mode:**

```
1. SSL/TLS → Overview
2. Select: Full (not Flexible, not Full Strict)
```

---

## Cost Breakdown

**FREE Tier (Current):**

-   ✅ Custom domains: FREE
-   ✅ SSL certificates: FREE (Let's Encrypt)
-   ✅ 750 hours/month free compute
-   ⚠️ Services sleep after 15 min inactivity

**Paid Plans (Optional):**

-   **Starter ($7/month per service)**: No sleep, better performance
-   **Standard ($25/month per service)**: Auto-scaling, priority support

---

## DNS Provider Quick Links

-   **Namecheap DNS:** <https://ap.www.namecheap.com/domains/list>
-   **GoDaddy DNS:** <https://dcc.godaddy.com/manage/dns>
-   **Cloudflare DNS:** <https://dash.cloudflare.com>
-   **Google Domains:** <https://domains.google.com/registrar>
-   **Name.com DNS:** <https://www.name.com/account/domain>

---

## Final Production Setup

After custom domains are working:

### 1. Update Stripe Webhook

```
1. Go to: https://dashboard.stripe.com/webhooks
2. Click on your webhook
3. Update endpoint URL to:
   https://api.advanciapayledger.com/api/webhooks/stripe
4. Save
```

### 2. Update Resend Email Domain (Optional)

```
1. Go to: https://resend.com/domains
2. Add: advanciapayledger.com
3. Configure DNS records for email sending
4. Verify domain
```

### 3. Update OAuth Callback URLs

If using social login:

```
- Google: https://console.cloud.google.com/apis/credentials
- Update redirect URIs to: https://advanciapayledger.com/api/auth/callback/google

- GitHub: https://github.com/settings/developers
- Update callback URL to: https://advanciapayledger.com/api/auth/callback/github
```

### 4. Update CORS Origins in Backend

Ensure backend `.env` has:

```env
ALLOWED_ORIGINS=https://advanciapayledger.com,https://www.advanciapayledger.com
FRONTEND_URL=https://advanciapayledger.com
```

---

## Monitoring & Maintenance

### Check Domain Status

```bash
# SSL certificate expiry
echo | openssl s_client -servername advanciapayledger.com -connect advanciapayledger.com:443 2>/dev/null | openssl x509 -noout -dates

# DNS health
dig advanciapayledger.com +short
dig api.advanciapayledger.com +short

# Service uptime
curl -I https://advanciapayledger.com
curl https://api.advanciapayledger.com/api/health
```

### Render Dashboard Monitoring

```
1. https://dashboard.render.com
2. Check both services for:
   - ✅ Healthy status
   - ✅ SSL certificate valid
   - ✅ Custom domains active
   - ✅ Recent deployments successful
```

---

## Quick Reference

**Your Custom Domain Setup:**

```
Main Site:     https://advanciapayledger.com
WWW Redirect:  https://www.advanciapayledger.com → advanciapayledger.com
API:           https://api.advanciapayledger.com
Health Check:  https://api.advanciapayledger.com/api/health
Admin Panel:   https://advanciapayledger.com/admin
```

**Timeline:**

```
DNS Configuration:        5-10 minutes
DNS Propagation:         15-60 minutes (up to 48 hours)
SSL Certificate Issue:    5-15 minutes after DNS
Total Time:              30 minutes - 2 hours
```

---

## Support

-   **Render Docs:** <https://render.com/docs/custom-domains>
-   **Render Support:** <https://render.com/docs/support>
-   **DNS Checker:** <https://dnschecker.org>
-   **SSL Checker:** <https://www.ssllabs.com/ssltest/>

---

**🎉 Custom Domain Setup Complete!**

Your Advancia PayLedger platform will be accessible at your custom domain with FREE SSL certificates and automatic renewal.
