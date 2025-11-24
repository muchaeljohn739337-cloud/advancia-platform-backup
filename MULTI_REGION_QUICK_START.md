# 🌍 Multi-Region Deployment - Quick Start

Get your multi-region deployment running in under 30 minutes.

---

## ⚡ Quick Start (30 Minutes)

### Step 1: Create Regional Droplets (10 min)

**DigitalOcean Setup:**

```bash
# US East (Virginia)
doctl compute droplet create \
  advancia-us-east-blue \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-4gb \
  --region nyc3

doctl compute droplet create \
  advancia-us-east-green \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-4gb \
  --region nyc3

# EU West (Dublin)
doctl compute droplet create \
  advancia-eu-west-blue \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-4gb \
  --region lon1

doctl compute droplet create \
  advancia-eu-west-green \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-4gb \
  --region lon1

# APAC Southeast (Singapore)
doctl compute droplet create \
  advancia-apac-se-blue \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-4gb \
  --region sgp1

doctl compute droplet create \
  advancia-apac-se-green \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-4gb \
  --region sgp1
```

**Get Droplet IPs:**

```bash
doctl compute droplet list --format Name,PublicIPv4
```

---

### Step 2: Configure Regional DNS (5 min)

**Cloudflare DNS Records:**

```bash
# US East
api-us.advancia.com → US East Load Balancer IP
www-us.advancia.com → US East Load Balancer IP

# EU West
api-eu.advancia.com → EU West Load Balancer IP
www-eu.advancia.com → EU West Load Balancer IP

# APAC Southeast
api-apac.advancia.com → APAC Southeast Load Balancer IP
www-apac.advancia.com → APAC Southeast Load Balancer IP

# Global (Geo-routed)
api.advancia.com → Cloudflare Load Balancer (geo-steering)
www.advancia.com → Cloudflare Load Balancer (geo-steering)
```

**Create Records via Cloudflare API:**

```bash
# See MULTI_REGION_SCRIPTS.md for full script
./scripts/cloudflare_global_lb.sh
```

---

### Step 3: Create GitHub Environments (5 min)

**Go to GitHub:**

1. Repository → Settings → Environments
2. Create `production-us-east`
3. Create `production-eu-west`
4. Create `production-apac-se`

**Protection Rules (Per Environment):**

-   ✅ Required reviewers: 2 senior engineers
-   ✅ Wait timer: 5 minutes (production only)
-   ✅ Deployment branches: `main` only

---

### Step 4: Add Regional Secrets (10 min)

**Option A: PowerShell Script (Recommended)**

```powershell
.\scripts\setup_regional_secrets.ps1
```

**Option B: Manual Entry**

For each environment (`production-us-east`, `production-eu-west`, `production-apac-se`):

```
CF_ZONE_ID → Your Cloudflare Zone ID
CF_API_TOKEN → Your Cloudflare API Token
CF_RECORD_ID_API → DNS record ID for api-[region]
CF_RECORD_ID_WWW → DNS record ID for www-[region]
DROPLET_IP_BLUE → Blue droplet IP for region
DROPLET_IP_GREEN → Green droplet IP for region
DROPLET_USER → SSH user (root or deploy)
DROPLET_SSH_KEY → SSH private key for region
DATABASE_URL → PostgreSQL connection string for region
REDIS_URL → Redis connection string for region
LB_IP → Load balancer IP for region
SLACK_WEBHOOK → Region-specific Slack webhook
```

---

## 🚀 Deploy to Multiple Regions

### Sequential Deployment (Safe)

```bash
# GitHub Actions UI
Actions → Multi-Region Progressive Deployment → Run workflow

Inputs:
  - Regions: "all"
  - Strategy: "sequential"
```

**Timeline:**

```
00:00 - Deploy US East → Canary 10%→100%
01:05 - Deploy EU West → Canary 10%→100%
02:00 - Deploy APAC Southeast → Canary 10%→100%
02:55 - All regions live! ✅
```

### Parallel Deployment (Fast)

```bash
# GitHub Actions UI
Actions → Multi-Region Progressive Deployment → Run workflow

Inputs:
  - Regions: "all"
  - Strategy: "parallel"
```

**Timeline:**

```
00:00 - Deploy all regions simultaneously
00:45 - All regions live! ✅ (3x faster)
```

**⚠️ Warning:** Parallel is faster but riskier. Use sequential for major releases.

---

## 🔍 Monitor Multi-Region Deployment

### Real-Time Health Checks

```bash
# Check all regions
./scripts/regional_health_check.sh

# Expected output:
🌍 Multi-Region Health Check
==============================

🔍 Checking us-east (api-us.advancia.com)...
   ✅ Status: Healthy
   📦 Version: 2.1.0
   ⏱️  Latency: 45ms
   ⚠️  Error Rate: 0.02%
   ⏰ Uptime: 15d 8h 23m

🔍 Checking eu-west (api-eu.advancia.com)...
   ✅ Status: Healthy
   📦 Version: 2.1.0
   ⏱️  Latency: 52ms
   ⚠️  Error Rate: 0.03%
   ⏰ Uptime: 15d 8h 23m

🔍 Checking apac-se (api-apac.advancia.com)...
   ✅ Status: Healthy
   📦 Version: 2.1.0
   ⏱️  Latency: 68ms
   ⚠️  Error Rate: 0.04%
   ⏰ Uptime: 15d 8h 23m

==============================
✅ All regions healthy
```

### Grafana Dashboard

**Global Overview:**

-   Traffic distribution by region
-   Regional latency comparison
-   Error rates per region
-   Active deployments status

**Access:** `https://grafana.advancia.com/d/multi-region-overview`

---

## 🚨 Regional Rollback

### Automatic Rollback

**Triggers:**

-   Error rate > regional threshold
-   Latency > acceptable range
-   Health checks fail (2+ consecutive)
-   CPU/Memory critical

**Action:**

```bash
# Automatically executed by GitHub Actions
- Detect failure in region
- Revert DNS to Blue environment
- Keep other regions on Green
- Send alerts to team
- Generate incident report
```

### Manual Rollback

**Rollback Single Region:**

```bash
# GitHub Actions UI
Actions → Regional Emergency Rollback → Run workflow

Inputs:
  - Region: "eu-west"
  - Target: "blue"
```

**Rollback All Regions:**

```bash
# GitHub Actions UI
Actions → Regional Emergency Rollback → Run workflow

Inputs:
  - Region: "all"
  - Target: "blue"
```

**⏱️ Rollback Time:** < 2 minutes per region

---

## 📊 Multi-Region Deployment Strategies

### Strategy 1: Sequential (Recommended)

**Use When:**

-   Major version releases
-   Breaking changes
-   Database migrations
-   First time deploying

**Pros:**

-   Safest approach
-   Regional isolation
-   Easy to stop mid-deployment
-   Clear error attribution

**Cons:**

-   Slower (3+ hours for all regions)
-   Staggered user experience

---

### Strategy 2: Parallel

**Use When:**

-   Minor bug fixes
-   Configuration updates
-   Hotfixes
-   Non-breaking changes

**Pros:**

-   Fastest (45 minutes)
-   Consistent user experience
-   Less operational overhead

**Cons:**

-   Higher risk
-   Harder to debug failures
-   No regional isolation

---

### Strategy 3: Primary-Only

**Use When:**

-   Testing new features
-   Regional compliance requirements
-   Gradual geographic expansion
-   Cost optimization

**Pros:**

-   Minimal risk
-   Lower costs
-   Easy validation

**Cons:**

-   Limited global reach
-   Users in other regions experience latency

---

## 🌐 Regional Failover

### Automatic Failover

**Scenario: US East Goes Down**

```
1. Cloudflare health check detects US East failure
2. Traffic reroutes to US West (backup)
3. US West scales up automatically
4. Slack alert sent to team
5. US East investigated and repaired
6. Traffic gradually shifted back
7. US West scales down
```

**Recovery Time:** < 2 minutes

### Manual Failover

**Trigger Regional Failover:**

```bash
# Reroute US traffic to EU (emergency)
curl -X PATCH \
  "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/load_balancers/$LB_ID" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "region_pools": {
      "WNAM": ["eu-west-pool"],
      "ENAM": ["eu-west-pool"]
    }
  }'
```

---

## 💰 Cost Optimization

### Regional Scaling

**Auto-Scale by Traffic:**

```yaml
us-east:
  peak_hours: 9am-11pm EST
  min_instances: 2
  max_instances: 10

eu-west:
  peak_hours: 8am-10pm GMT
  min_instances: 2
  max_instances: 8

apac-se:
  peak_hours: 7am-9pm SGT
  min_instances: 1
  max_instances: 6
```

**Estimated Monthly Cost:**

```
US East:  $160 (2x $2.50/day droplets + $80 LB)
EU West:  $160 (2x $2.50/day droplets + $80 LB)
APAC SE:  $160 (2x $2.50/day droplets + $80 LB)
Cloudflare: $200 (Load Balancing Enterprise)
Total:     $680/month
```

**Savings:**

-   Scale down overnight: -30% cost
-   Use spot instances: -40% cost
-   Regional database replication: +$50/month

---

## ✅ Verification Checklist

### Infrastructure

-   [ ] 6 droplets created (2 per region)
-   [ ] Regional load balancers deployed
-   [ ] Regional databases configured
-   [ ] Regional Redis caches setup
-   [ ] SSH keys distributed

### DNS

-   [ ] Regional DNS records created
-   [ ] Cloudflare Load Balancer configured
-   [ ] Geo-steering rules active
-   [ ] Health checks passing
-   [ ] Failover tested

### GitHub

-   [ ] 3 regional environments created
-   [ ] 36 regional secrets added (12 per environment)
-   [ ] Multi-region workflow tested
-   [ ] Approval gates configured
-   [ ] Rollback procedures tested

### Monitoring

-   [ ] Regional health checks active
-   [ ] Grafana dashboards deployed
-   [ ] Slack notifications configured
-   [ ] Alert thresholds tuned
-   [ ] Runbooks documented

---

## 🎯 Next Steps

1. **Test Sequential Deployment**
   -   Deploy to US East first
   -   Validate canary rollout
   -   Proceed to EU West
   -   Complete APAC Southeast

2. **Set Up Monitoring**
   -   Configure Grafana dashboards
   -   Set alert thresholds per region
   -   Test Slack notifications

3. **Document Runbooks**
   -   Regional incident response
   -   Failover procedures
   -   Cost optimization strategies

4. **Train Team**
   -   Multi-region deployment process
   -   Regional rollback procedures
   -   Global traffic management

---

**Last Updated:** November 15, 2025  
**Status:** Ready for multi-region deployment! 🌍✅

See `MULTI_REGION_DEPLOYMENT_GUIDE.md` for detailed architecture and strategies.
