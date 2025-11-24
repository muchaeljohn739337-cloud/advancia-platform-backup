# Cloudflare Setup for advanciapayledger.com

## 🚀 Quick Setup Guide

### Step 1: Add Domain to Cloudflare (In Progress)

You're currently at the domain addition screen. Here's what to do:

1. ✅ **Domain entered**: `advanciapayledger.com`
2. **Next**: Click "Quick scan for DNS records" (RECOMMENDED)
   -   This will automatically import existing DNS records
   -   Saves time and reduces errors

**AI Crawler Settings Recommendation**:

-   ✅ **Select**: "Block AI training bots"
-   ✅ **Option**: "Block on all pages"
-   **Reason**: Protects your content from being used for AI training without permission

### Step 2: Review Imported DNS Records

After the scan completes, Cloudflare will show discovered DNS records. You'll need to:

1. **Verify/Add these critical records**:

```
Type: A
Name: @
Content: [Your backend server IP or CNAME target]
Proxy: ON (Orange cloud)
TTL: Auto

Type: CNAME
Name: api
Content: advancia-backend.onrender.com (or your backend URL)
Proxy: ON (Orange cloud)
TTL: Auto

Type: CNAME
Name: www
Content: advanciapayledger.com
Proxy: ON (Orange cloud)
TTL: Auto

Type: CNAME
Name: admin
Content: advancia-frontend.vercel.app (or your frontend URL)
Proxy: ON (Orange cloud)
TTL: Auto
```

2. **Remove any duplicate or incorrect records**
3. Click "Continue"

### Step 3: Update Nameservers

Cloudflare will provide you with 2 nameservers like:

```
ns1.cloudflare.com
ns2.cloudflare.com
```

**Action Required**:

1. Go to your domain registrar (where you bought advanciapayledger.com)
2. Find the "DNS" or "Nameservers" section
3. Replace existing nameservers with Cloudflare's nameservers
4. Save changes

**Propagation Time**: 24-48 hours (often faster, 2-4 hours)

### Step 4: Configure SSL/TLS (Do This After Nameservers Update)

Once nameservers are active:

1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to: **Full (strict)**
3. Enable **Always Use HTTPS**
4. Go to **SSL/TLS** → **Edge Certificates**
   -   ✅ Enable "Always Use HTTPS"
   -   ✅ Enable "Automatic HTTPS Rewrites"
   -   ✅ Enable "Certificate Transparency Monitoring"

### Step 5: Configure Page Rules

Go to **Rules** → **Page Rules** → Create these 3 rules:

**Rule 1: Bypass Cache for API**

```
URL: api.advanciapayledger.com/api/*
Settings: Cache Level = Bypass
```

**Rule 2: Cache Static Assets**

```
URL: *.advanciapayledger.com/*.{js,css,jpg,png,gif,svg,ico,woff,woff2}
Settings:
  - Cache Level = Cache Everything
  - Edge Cache TTL = 1 month
```

**Rule 3: Cache HTML Pages**

```
URL: advanciapayledger.com/*
Settings:
  - Cache Level = Cache Everything
  - Edge Cache TTL = 30 minutes
```

### Step 6: Configure Firewall Rules (Security)

Go to **Security** → **WAF** → **Custom rules** → Create these rules:

**Rule 1: Block SQL Injection & XSS**

```
Name: Block SQL Injection and XSS
Expression:
  (http.request.uri.path contains "union" and http.request.uri.path contains "select") or
  (http.request.uri.path contains "<script") or
  (http.request.uri.path contains "javascript:")
Action: Block
```

**Rule 2: Rate Limit Auth Endpoints**

```
Name: Rate limit authentication
Expression:
  http.request.uri.path contains "/api/auth"
Action: Rate limit (10 requests per minute per IP)
```

**Rule 3: Protect Admin Routes**

```
Name: Extra protection for admin
Expression:
  http.request.uri.path contains "/api/admin"
Action: Challenge (CAPTCHA)
```

### Step 7: Enable Performance Features

Go to **Speed** → **Optimization**:

-   ✅ Auto Minify: JavaScript, CSS, HTML
-   ✅ Brotli Compression
-   ✅ Early Hints
-   ❌ Rocket Loader: OFF (conflicts with Next.js)

### Step 8: Configure Email Routing (Optional but Recommended)

Go to **Email** → **Email Routing**:

1. Click "Enable Email Routing"
2. Add your destination email (your personal email)
3. Verify the destination email
4. Create custom addresses:
   -   `support@advanciapayledger.com` → your-email
   -   `admin@advanciapayledger.com` → your-email
   -   `noreply@advanciapayledger.com` → your-email

## 📝 Environment Variables to Update

After Cloudflare is active, update these in your project:

**Backend (.env)**:

```bash
# Update API URL to use Cloudflare domain
FRONTEND_URL=https://advanciapayledger.com
BACKEND_URL=https://api.advanciapayledger.com

# Add to CORS origins
ALLOWED_ORIGINS=https://advanciapayledger.com,https://www.advanciapayledger.com,https://admin.advanciapayledger.com
```

**Frontend (.env.local)**:

```bash
NEXT_PUBLIC_API_URL=https://api.advanciapayledger.com
```

**Render/Vercel (Production)**:

-   Update the same environment variables in your hosting platform
-   Ensure custom domains are configured:
    -   Backend: `api.advanciapayledger.com`
    -   Frontend: `advanciapayledger.com`, `www.advanciapayledger.com`

## ✅ Verification Checklist

After setup completes (24-48 hours):

-   [ ] Visit `https://advanciapayledger.com` - should load frontend
-   [ ] Visit `https://www.advanciapayledger.com` - should work
-   [ ] Visit `https://api.advanciapayledger.com/health` - should return backend health
-   [ ] Visit `http://advanciapayledger.com` - should redirect to HTTPS
-   [ ] Test API endpoint: `https://api.advanciapayledger.com/api/auth/login`
-   [ ] Check SSL: <https://www.ssllabs.com/ssltest/analyze.html?d=advanciapayledger.com>
-   [ ] Check DNS propagation: <https://dnschecker.org/#A/advanciapayledger.com>
-   [ ] Send test email to `support@advanciapayledger.com`
-   [ ] Check Cloudflare Analytics for traffic

## 🔧 Troubleshooting

### DNS Not Propagating

```powershell
# Clear DNS cache (Windows)
ipconfig /flushdns

# Check current nameservers
nslookup -type=NS advanciapayledger.com

# Check DNS propagation globally
# Visit: https://dnschecker.org
```

### SSL Certificate Errors

-   Wait 15 minutes after nameservers are active
-   Check SSL mode is set to "Full (strict)"
-   Verify your backend/frontend have valid SSL certificates
-   Check Cloudflare SSL/TLS settings

### 521 Error (Web Server Down)

-   Verify backend is running and accessible
-   Check backend URL is correct in DNS
-   Ensure backend accepts connections from Cloudflare IPs

### CORS Errors

-   Add Cloudflare domain to backend CORS whitelist
-   Update `ALLOWED_ORIGINS` in backend .env
-   Restart backend after environment changes

## 📊 Cloudflare API Credentials

To use automation scripts, you'll need:

1. **API Token**:
   -   Go to: <https://dash.cloudflare.com/profile/api-tokens>
   -   Create Token → "Edit zone DNS" template
   -   Copy token and save as `CLOUDFLARE_API_TOKEN`

2. **Zone ID**:
   -   Go to Cloudflare dashboard
   -   Select `advanciapayledger.com`
   -   Find "Zone ID" in the right sidebar
   -   Copy and save as `CLOUDFLARE_ZONE_ID`

3. **Add to GitHub Secrets**:

   ```
   Repository Settings → Secrets → Actions
   - CLOUDFLARE_API_TOKEN
   - CLOUDFLARE_ZONE_ID
   ```

## 🎯 Next Steps

1. ✅ Complete Cloudflare domain addition (in progress)
2. ⏳ Wait for nameserver propagation (2-48 hours)
3. 🔒 Configure SSL/TLS settings
4. 🛡️ Set up firewall rules
5. ⚡ Enable performance features
6. 📧 Configure email routing
7. 🔄 Update environment variables
8. ✅ Run verification tests

---

**Current Status**: Adding domain to Cloudflare ✅  
**Domain**: advanciapayledger.com  
**Setup Time**: ~30 minutes (+ DNS propagation time)

For detailed automation and advanced setup, see: `CLOUDFLARE_SETUP_GUIDE.md`
