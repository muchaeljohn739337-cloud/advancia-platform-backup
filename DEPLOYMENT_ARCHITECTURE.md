# 🚀 Current Deployment Architecture

## 📋 Deployment Overview

**Advancia PayLedger** uses a **split deployment architecture**:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  FRONTEND (Next.js)          BACKEND (Express)     │
│  ═══════════════════         ════════════════      │
│                                                     │
│  Platform: Vercel.com        Platform: Render.com  │
│  Location: Global CDN        Location: Oregon      │
│  Plan: Free (Hobby)          Plan: Free            │
│  Cost: $0/month              Cost: $0/month        │
│                                                     │
│  URL: advanciapayledger.com  URL: api.advancia...  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🌐 Current Configuration

### **Frontend - Vercel**
- **Platform**: Vercel.com
- **Repository**: Connected to GitHub
- **Auto-Deploy**: Yes (on push to `main`)
- **Current URL**: `https://frontend-qyq8901ns-advanciapayledger.vercel.app`
- **Target Domain**: `advanciapayledger.com`
- **Framework**: Next.js 14
- **Build**: Automatic on git push
- **CDN**: Global edge network
- **SSL**: Auto-provisioned (free)

### **Backend - Render**
- **Platform**: Render.com
- **Service**: `advancia-backend-upnrf`
- **Region**: Oregon
- **Current URL**: `https://advancia-backend-upnrf.onrender.com`
- **Target Domain**: `api.advanciapayledger.com`
- **Database**: PostgreSQL on Render (`dpg-d3tqp46uk2gs73dcu2dg-a`)
- **Auto-Deploy**: Yes (configured in `render.yaml`)
- **Health Check**: `/api/health`
- **SSL**: Auto-provisioned (free)

---

## 🔧 Custom Domain Setup

### **Step 1: Frontend Domain on Vercel**

#### A. Add Custom Domain in Vercel Dashboard

```
1. Go to: https://vercel.com/dashboard
2. Select project: advancia-pay-ledger (or your frontend project)
3. Settings → Domains
4. Add Domain: advanciapayledger.com
5. Add Domain: www.advanciapayledger.com
```

#### B. Configure DNS Records

Vercel will show you which records to add. Typically:

**For Root Domain (advanciapayledger.com):**
```
Type: A
Name: @
Value: 76.76.21.21 (Vercel IP)
TTL: 3600
```

**OR (if your DNS supports CNAME flattening):**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: 3600
```

**For WWW:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

#### C. Verify in Vercel

After DNS propagates (5-30 minutes):
- Vercel will show ✅ Domain verified
- SSL certificate auto-issued
- Both `advanciapayledger.com` and `www.advanciapayledger.com` will work

### **Step 2: Backend Domain on Render**

#### A. Add Custom Domain in Render Dashboard

```
1. Go to: https://dashboard.render.com
2. Select: advancia-backend-upnrf
3. Settings → Custom Domain
4. Add: api.advanciapayledger.com
```

#### B. Configure DNS Records

```
Type: CNAME
Name: api
Value: advancia-backend-upnrf.onrender.com
TTL: 3600
```

#### C. Wait for SSL

Render will automatically:
- Verify DNS
- Issue Let's Encrypt SSL certificate (5-15 min)
- Show ✅ SSL certificate issued

### **Step 3: Update CORS Configuration**

Once domains are active, update backend CORS:

**In Render Dashboard:**
```
1. Go to: advancia-backend-upnrf
2. Environment → Edit
3. Update ALLOWED_ORIGINS:
   https://advanciapayledger.com,https://www.advanciapayledger.com
4. Save (triggers redeploy)
```

**In `backend/.env` (local development):**
```env
ALLOWED_ORIGINS=https://advanciapayledger.com,https://www.advanciapayledger.com,http://localhost:3000
```

### **Step 4: Verify Frontend Environment**

**In Vercel Dashboard:**
```
1. Project Settings → Environment Variables
2. Verify NEXT_PUBLIC_API_URL is set to:
   https://api.advanciapayledger.com
3. If not, add it and redeploy
```

---

## ✅ Verification Checklist

After DNS propagates (15-60 minutes):

```bash
# 1. Frontend (Vercel)
curl -I https://advanciapayledger.com
# Expected: 200 OK

# 2. WWW redirect
curl -I https://www.advanciapayledger.com
# Expected: Redirects to non-www

# 3. Backend API (Render)
curl https://api.advanciapayledger.com/api/health
# Expected: {"status":"healthy"}

# 4. CORS test (from frontend)
# Open browser console on https://advanciapayledger.com
# Run: fetch('https://api.advanciapayledger.com/api/health')
# Expected: No CORS errors
```

**Browser Tests:**
1. Visit `https://advanciapayledger.com` → Should load app
2. Login should work (no CORS errors)
3. Admin panel accessible
4. API calls succeed

---

## 🔒 Current Security Status

**Frontend (Vercel):**
- ✅ HTTPS enforced
- ✅ SSL auto-renewed
- ✅ Global CDN (DDoS protection)
- ✅ Automatic firewall
- ✅ Edge caching

**Backend (Render):**
- ✅ HTTPS enforced
- ✅ SSL auto-renewed (Let's Encrypt)
- ✅ Health monitoring
- ✅ Automatic restarts
- ✅ Rate limiting configured in code

---

## 💰 Cost Breakdown

| Service | Provider | Plan | Monthly Cost |
|---------|----------|------|--------------|
| Frontend Hosting | Vercel | Hobby (Free) | **$0** |
| Backend API | Render | Free | **$0** |
| PostgreSQL Database | Render | Free | **$0** |
| SSL Certificates | Auto (Free) | Included | **$0** |
| Domain Name | Namecheap/etc | Annual | **~$1/month** |
| **TOTAL** | | | **~$1/month** |

### **Limits on Free Tier:**

**Vercel Free:**
- 100 GB bandwidth/month
- Unlimited sites
- 100 GB-hours serverless execution
- Good for: 10,000-50,000 page views/month

**Render Free:**
- 750 hours/month
- 512 MB RAM
- Sleeps after 15 min inactivity
- Good for: Development/testing, low traffic

---

## 🚀 Deployment Workflow

### Current Auto-Deploy Setup:

```
┌─────────────────────────────────────────────────┐
│  1. Git Push to 'main' branch                  │
│     ↓                                           │
│  2. GitHub Actions CI runs tests               │
│     ↓                                           │
│  3. Vercel detects push → Rebuilds frontend    │
│     ↓                                           │
│  4. Render detects push → Rebuilds backend     │
│     ↓                                           │
│  5. Both services live in 2-5 minutes          │
└─────────────────────────────────────────────────┘
```

**To Deploy Updates:**
```bash
# Make changes locally
git add .
git commit -m "feat: your changes"
git push origin main

# That's it! Both platforms auto-deploy
```

**Monitor Deployments:**
- Vercel: https://vercel.com/dashboard
- Render: https://dashboard.render.com

---

## 🔄 Migration Options

### Option 1: Keep Split Architecture (Recommended)

**Pros:**
- ✅ FREE hosting
- ✅ Best performance (Vercel CDN for frontend)
- ✅ Automatic scaling
- ✅ Zero maintenance
- ✅ Each service optimized for its purpose

**Cons:**
- ⚠️ Backend sleeps after 15 min (Render free tier)
- ⚠️ Limited to free tier resources

**When to use:** Development, MVP, early-stage (< 1000 users)

### Option 2: All-in-One Docker (VPS)

Use the production Docker setup I built for:
- DigitalOcean Droplet
- AWS EC2
- Linode

**Pros:**
- ✅ Full control
- ✅ No sleep/downtime
- ✅ Dedicated resources
- ✅ Better for high traffic

**Cons:**
- 💰 Costs $6-20/month
- ⚠️ Requires server management
- ⚠️ Manual SSL renewal setup

**When to use:** Production with paying customers, high traffic (> 500 users)

### Option 3: Hybrid (Current + VPS Backend)

Keep Vercel for frontend, move backend to VPS:

**Benefits:**
- Best frontend performance (Vercel CDN)
- No backend sleep (VPS)
- Cost: ~$6-10/month (just backend VPS)

---

## 📝 DNS Configuration Summary

Once you have your domain, your DNS should look like:

```
# Vercel (Frontend)
Type    Name    Value                      TTL
A       @       76.76.21.21               3600
CNAME   www     cname.vercel-dns.com      3600

# Render (Backend API)
CNAME   api     advancia-backend-upnrf.onrender.com  3600

# Email (Optional - if using custom email)
MX      @       mail.advanciapayledger.com  3600
```

---

## 🎯 Next Steps

### Immediate (After Domain Purchase):

1. **Add Domain to Vercel**
   - Dashboard → Domains → Add `advanciapayledger.com`
   
2. **Add API Subdomain to Render**
   - Backend service → Custom Domain → Add `api.advanciapayledger.com`

3. **Configure DNS Records**
   - Point root to Vercel
   - Point `api` to Render

4. **Update CORS**
   - Render environment: `ALLOWED_ORIGINS=https://advanciapayledger.com`

5. **Wait for SSL** (15-30 minutes)
   - Both Vercel and Render auto-issue certificates

### Optional Enhancements:

- **Email**: Set up Resend with custom domain
- **Analytics**: Add Google Analytics
- **Monitoring**: Set up Sentry for error tracking
- **Backups**: Configure database backups on Render

---

## 🆘 Support Resources

**Vercel:**
- Dashboard: https://vercel.com/dashboard
- Docs: https://vercel.com/docs
- Support: https://vercel.com/support

**Render:**
- Dashboard: https://dashboard.render.com
- Docs: https://render.com/docs
- Support: https://render.com/docs/support

**DNS Tools:**
- DNS Checker: https://dnschecker.org
- SSL Test: https://www.ssllabs.com/ssltest

---

## 🎉 Summary

**Current Setup:**
- ✅ Frontend on Vercel (auto-deploy from GitHub)
- ✅ Backend on Render (auto-deploy from GitHub)  
- ✅ PostgreSQL on Render
- ✅ Both platforms FREE tier
- ✅ Auto-scaling and SSL included
- ✅ Total cost: ~$1/month (just domain)

**Custom Domain Setup:**
- Frontend: `advanciapayledger.com` (on Vercel)
- Backend: `api.advanciapayledger.com` (on Render)
- SSL: Automatic on both platforms
- Time: 30-60 minutes total

**This is the RECOMMENDED setup for your current stage - FREE, scalable, and production-ready!**
