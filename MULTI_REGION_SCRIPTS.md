# 🌍 Multi-Region Deployment Scripts

Helper scripts for managing multi-region deployments.

---

## 📁 Script Files

### 1. `canary_rollout.sh` - Progressive Traffic Shifting

**Location:** `scripts/canary_rollout.sh`

```bash
#!/bin/bash

# Progressive canary rollout for multi-region deployments
# Usage: ./canary_rollout.sh --region us-east --green-ip 134.122.1.100 --blue-ip 134.122.1.50

set -euo pipefail

# Parse arguments
REGION=""
GREEN_IP=""
BLUE_IP=""
LB_IP=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --region)
      REGION="$2"
      shift 2
      ;;
    --green-ip)
      GREEN_IP="$2"
      shift 2
      ;;
    --blue-ip)
      BLUE_IP="$2"
      shift 2
      ;;
    --lb-ip)
      LB_IP="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate inputs
if [[ -z "$REGION" || -z "$GREEN_IP" || -z "$BLUE_IP" ]]; then
  echo "❌ Missing required arguments"
  echo "Usage: $0 --region REGION --green-ip IP --blue-ip IP --lb-ip IP"
  exit 1
fi

echo "🎯 Starting canary rollout for $REGION"
echo "   Green: $GREEN_IP"
echo "   Blue: $BLUE_IP"

# Health check function
health_check() {
  local ip=$1
  local response
  response=$(curl -s -o /dev/null -w "%{http_code}" "http://$ip:4000/health" || echo "000")
  
  if [[ "$response" == "200" ]]; then
    return 0
  else
    return 1
  fi
}

# Error rate check
check_error_rate() {
  local ip=$1
  local threshold=$2
  local error_rate
  
  error_rate=$(curl -s "http://$ip:4000/metrics" | grep 'error_rate' | awk '{print $2}' || echo "999")
  
  if (( $(echo "$error_rate < $threshold" | bc -l) )); then
    echo "   ✅ Error rate: $error_rate% (threshold: $threshold%)"
    return 0
  else
    echo "   ❌ Error rate: $error_rate% (threshold: $threshold%)"
    return 1
  fi
}

# Update NGINX weights
update_nginx_weights() {
  local green_weight=$1
  local blue_weight=$2
  
  ssh -o StrictHostKeyChecking=no "$DROPLET_USER@$LB_IP" << EOF
    cat > /etc/nginx/conf.d/upstream-$REGION.conf << 'NGINX'
upstream backend-$REGION {
    server $GREEN_IP:4000 weight=$green_weight;
    server $BLUE_IP:4000 weight=$blue_weight;
    keepalive 32;
}
NGINX
    nginx -t && systemctl reload nginx
EOF
}

# Pre-deployment health check
echo "🏥 Pre-deployment health check..."
if ! health_check "$GREEN_IP"; then
  echo "❌ Green environment is not healthy"
  exit 1
fi
echo "✅ Green environment is healthy"

# Stage 1: 10% traffic
echo ""
echo "📊 Stage 1: Routing 10% to Green"
update_nginx_weights 1 9
sleep 60
if ! check_error_rate "$GREEN_IP" 1.0; then
  echo "❌ Stage 1 failed - rolling back"
  update_nginx_weights 0 10
  exit 1
fi
sleep 240  # Monitor for 4 more minutes

# Stage 2: 25% traffic
echo ""
echo "📊 Stage 2: Routing 25% to Green"
update_nginx_weights 25 75
sleep 60
if ! check_error_rate "$GREEN_IP" 0.8; then
  echo "❌ Stage 2 failed - rolling back"
  update_nginx_weights 0 10
  exit 1
fi
sleep 240

# Stage 3: 50% traffic
echo ""
echo "📊 Stage 3: Routing 50% to Green"
update_nginx_weights 50 50
sleep 60
if ! check_error_rate "$GREEN_IP" 0.5; then
  echo "❌ Stage 3 failed - rolling back"
  update_nginx_weights 0 10
  exit 1
fi
sleep 540  # Monitor for 9 more minutes

# Stage 4: 75% traffic
echo ""
echo "📊 Stage 4: Routing 75% to Green"
update_nginx_weights 75 25
sleep 60
if ! check_error_rate "$GREEN_IP" 0.3; then
  echo "❌ Stage 4 failed - rolling back"
  update_nginx_weights 0 10
  exit 1
fi
sleep 540

# Stage 5: 100% traffic
echo ""
echo "📊 Stage 5: Routing 100% to Green"
update_nginx_weights 100 0
sleep 60
if ! check_error_rate "$GREEN_IP" 0.2; then
  echo "❌ Stage 5 failed - rolling back"
  update_nginx_weights 0 10
  exit 1
fi

echo ""
echo "✅ Canary rollout complete for $REGION!"
echo "   All traffic now on Green environment"
```

---

### 2. `regional_health_check.sh` - Multi-Region Health Monitoring

**Location:** `scripts/regional_health_check.sh`

```bash
#!/bin/bash

# Multi-region health check script
# Usage: ./regional_health_check.sh

set -euo pipefail

# Regional endpoints
declare -A REGIONS=(
  ["us-east"]="api-us.advancia.com"
  ["eu-west"]="api-eu.advancia.com"
  ["apac-se"]="api-apac.advancia.com"
)

echo "🌍 Multi-Region Health Check"
echo "=============================="
echo ""

OVERALL_HEALTHY=true

for region in "${!REGIONS[@]}"; do
  endpoint="${REGIONS[$region]}"
  
  echo "🔍 Checking $region ($endpoint)..."
  
  # Health check
  http_code=$(curl -s -o /dev/null -w "%{http_code}" "https://$endpoint/health" || echo "000")
  
  if [[ "$http_code" == "200" ]]; then
    # Get detailed metrics
    response=$(curl -s "https://$endpoint/health/regional")
    
    version=$(echo "$response" | jq -r '.version')
    latency=$(echo "$response" | jq -r '.latency')
    error_rate=$(echo "$response" | jq -r '.error_rate')
    uptime=$(echo "$response" | jq -r '.uptime')
    
    echo "   ✅ Status: Healthy"
    echo "   📦 Version: $version"
    echo "   ⏱️  Latency: ${latency}ms"
    echo "   ⚠️  Error Rate: ${error_rate}%"
    echo "   ⏰ Uptime: $uptime"
  else
    echo "   ❌ Status: Unhealthy (HTTP $http_code)"
    OVERALL_HEALTHY=false
  fi
  
  echo ""
done

echo "=============================="
if [[ "$OVERALL_HEALTHY" == true ]]; then
  echo "✅ All regions healthy"
  exit 0
else
  echo "❌ Some regions unhealthy"
  exit 1
fi
```

---

### 3. `setup_regional_secrets.ps1` - Regional Secret Configuration

**Location:** `scripts/setup_regional_secrets.ps1`

```powershell
# PowerShell script to set up regional GitHub secrets
# Usage: .\setup_regional_secrets.ps1

$ErrorActionPreference = "Stop"

Write-Host "🔐 Multi-Region Secret Setup" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# GitHub CLI check
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI not found. Install from https://cli.github.com/" -ForegroundColor Red
    exit 1
}

# Repository info
$REPO_OWNER = Read-Host "Enter repository owner (e.g., muchaeljohn739337-cloud)"
$REPO_NAME = Read-Host "Enter repository name (e.g., -modular-saas-platform)"

# Regions to configure
$REGIONS = @("us-east", "eu-west", "apac-se")

foreach ($REGION in $REGIONS) {
    Write-Host ""
    Write-Host "🌍 Configuring $REGION region..." -ForegroundColor Yellow
    
    $ENV_NAME = "production-$REGION"
    
    # Cloudflare secrets
    Write-Host "   📝 Cloudflare configuration..."
    $CF_ZONE_ID = Read-Host "     CF_ZONE_ID for $REGION"
    $CF_API_TOKEN = Read-Host "     CF_API_TOKEN for $REGION" -AsSecureString
    $CF_RECORD_ID_API = Read-Host "     CF_RECORD_ID_API for $REGION"
    $CF_RECORD_ID_WWW = Read-Host "     CF_RECORD_ID_WWW for $REGION"
    
    # DigitalOcean secrets
    Write-Host "   📝 DigitalOcean configuration..."
    $DROPLET_IP_BLUE = Read-Host "     DROPLET_IP_BLUE for $REGION"
    $DROPLET_IP_GREEN = Read-Host "     DROPLET_IP_GREEN for $REGION"
    $DROPLET_USER = Read-Host "     DROPLET_USER for $REGION"
    $LB_IP = Read-Host "     LB_IP (load balancer) for $REGION"
    
    # Database secrets
    Write-Host "   📝 Database configuration..."
    $DATABASE_URL = Read-Host "     DATABASE_URL for $REGION"
    $REDIS_URL = Read-Host "     REDIS_URL for $REGION"
    
    # Slack webhook
    Write-Host "   📝 Slack configuration..."
    $SLACK_WEBHOOK = Read-Host "     SLACK_WEBHOOK for $REGION"
    
    # SSH key
    Write-Host "   📝 SSH key..."
    $SSH_KEY_PATH = Read-Host "     Path to SSH private key for $REGION"
    
    if (Test-Path $SSH_KEY_PATH) {
        $DROPLET_SSH_KEY = Get-Content $SSH_KEY_PATH -Raw
    } else {
        Write-Host "     ❌ SSH key not found at $SSH_KEY_PATH" -ForegroundColor Red
        continue
    }
    
    # Create GitHub Environment
    Write-Host "   🔧 Creating GitHub Environment: $ENV_NAME..."
    gh api -X PUT "/repos/$REPO_OWNER/$REPO_NAME/environments/$ENV_NAME"
    
    # Add secrets to environment
    Write-Host "   🔒 Adding secrets to $ENV_NAME..."
    
    gh secret set CF_ZONE_ID -b $CF_ZONE_ID --env $ENV_NAME --repo "$REPO_OWNER/$REPO_NAME"
    gh secret set CF_API_TOKEN -b $CF_API_TOKEN --env $ENV_NAME --repo "$REPO_OWNER/$REPO_NAME"
    gh secret set CF_RECORD_ID_API -b $CF_RECORD_ID_API --env $ENV_NAME --repo "$REPO_OWNER/$REPO_NAME"
    gh secret set CF_RECORD_ID_WWW -b $CF_RECORD_ID_WWW --env $ENV_NAME --repo "$REPO_OWNER/$REPO_NAME"
    gh secret set DROPLET_IP_BLUE -b $DROPLET_IP_BLUE --env $ENV_NAME --repo "$REPO_OWNER/$REPO_NAME"
    gh secret set DROPLET_IP_GREEN -b $DROPLET_IP_GREEN --env $ENV_NAME --repo "$REPO_OWNER/$REPO_NAME"
    gh secret set DROPLET_USER -b $DROPLET_USER --env $ENV_NAME --repo "$REPO_OWNER/$REPO_NAME"
    gh secret set DROPLET_SSH_KEY -b $DROPLET_SSH_KEY --env $ENV_NAME --repo "$REPO_OWNER/$REPO_NAME"
    gh secret set DATABASE_URL -b $DATABASE_URL --env $ENV_NAME --repo "$REPO_OWNER/$REPO_NAME"
    gh secret set REDIS_URL -b $REDIS_URL --env $ENV_NAME --repo "$REPO_OWNER/$REPO_NAME"
    gh secret set LB_IP -b $LB_IP --env $ENV_NAME --repo "$REPO_OWNER/$REPO_NAME"
    gh secret set SLACK_WEBHOOK -b $SLACK_WEBHOOK --env $ENV_NAME --repo "$REPO_OWNER/$REPO_NAME"
    
    Write-Host "   ✅ $REGION configuration complete!" -ForegroundColor Green
}

Write-Host ""
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "✅ All regions configured!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify secrets in GitHub: Settings → Environments" -ForegroundColor White
Write-Host "2. Test deployment: Actions → Multi-Region Deployment → Run workflow" -ForegroundColor White
Write-Host "3. Monitor: Check regional health endpoints" -ForegroundColor White
```

---

### 4. `cloudflare_global_lb.sh` - Cloudflare Load Balancer Setup

**Location:** `scripts/cloudflare_global_lb.sh`

```bash
#!/bin/bash

# Cloudflare Global Load Balancer setup script
# Usage: ./cloudflare_global_lb.sh

set -euo pipefail

echo "🌐 Cloudflare Global Load Balancer Setup"
echo "========================================="
echo ""

# User inputs
read -p "Cloudflare API Token: " CF_API_TOKEN
read -p "Cloudflare Zone ID: " CF_ZONE_ID
read -p "Domain (e.g., advancia.com): " DOMAIN

# Regional origin servers
read -p "US East IP: " US_IP
read -p "EU West IP: " EU_IP
read -p "APAC Southeast IP: " APAC_IP

# Create health check monitor
echo ""
echo "📊 Creating health check monitor..."

MONITOR_ID=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$(curl -s -H "Authorization: Bearer $CF_API_TOKEN" "https://api.cloudflare.com/client/v4/user" | jq -r '.result.id')/load_balancers/monitors" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "https",
    "description": "Advancia API Health Check",
    "method": "GET",
    "path": "/health",
    "header": {
      "Host": ["api.'"$DOMAIN"'"]
    },
    "port": 443,
    "timeout": 5,
    "retries": 2,
    "interval": 60,
    "expected_codes": "200",
    "follow_redirects": true
  }' | jq -r '.result.id')

echo "✅ Monitor created: $MONITOR_ID"

# Create regional pools
echo ""
echo "🌍 Creating regional pools..."

# US East Pool
US_POOL_ID=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$(curl -s -H "Authorization: Bearer $CF_API_TOKEN" "https://api.cloudflare.com/client/v4/user" | jq -r '.result.id')/load_balancers/pools" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "us-east-pool",
    "origins": [
      {
        "name": "us-east-origin",
        "address": "'"$US_IP"'",
        "enabled": true,
        "weight": 1
      }
    ],
    "monitor": "'"$MONITOR_ID"'",
    "notification_email": "",
    "enabled": true
  }' | jq -r '.result.id')

echo "✅ US East pool: $US_POOL_ID"

# EU West Pool
EU_POOL_ID=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$(curl -s -H "Authorization: Bearer $CF_API_TOKEN" "https://api.cloudflare.com/client/v4/user" | jq -r '.result.id')/load_balancers/pools" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "eu-west-pool",
    "origins": [
      {
        "name": "eu-west-origin",
        "address": "'"$EU_IP"'",
        "enabled": true,
        "weight": 1
      }
    ],
    "monitor": "'"$MONITOR_ID"'",
    "enabled": true
  }' | jq -r '.result.id')

echo "✅ EU West pool: $EU_POOL_ID"

# APAC Southeast Pool
APAC_POOL_ID=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$(curl -s -H "Authorization: Bearer $CF_API_TOKEN" "https://api.cloudflare.com/client/v4/user" | jq -r '.result.id')/load_balancers/pools" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "apac-se-pool",
    "origins": [
      {
        "name": "apac-se-origin",
        "address": "'"$APAC_IP"'",
        "enabled": true,
        "weight": 1
      }
    ],
    "monitor": "'"$MONITOR_ID"'",
    "enabled": true
  }' | jq -r '.result.id')

echo "✅ APAC Southeast pool: $APAC_POOL_ID"

# Create load balancer with geo-steering
echo ""
echo "🌐 Creating global load balancer..."

LB_ID=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/load_balancers" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "api.'"$DOMAIN"'",
    "default_pools": ["'"$US_POOL_ID"'", "'"$EU_POOL_ID"'", "'"$APAC_POOL_ID"'"],
    "region_pools": {
      "WNAM": ["'"$US_POOL_ID"'"],
      "ENAM": ["'"$US_POOL_ID"'"],
      "WEU": ["'"$EU_POOL_ID"'"],
      "EEU": ["'"$EU_POOL_ID"'"],
      "SEAS": ["'"$APAC_POOL_ID"'"],
      "NEAS": ["'"$APAC_POOL_ID"'"]
    },
    "steering_policy": "geo",
    "session_affinity": "cookie",
    "session_affinity_ttl": 3600,
    "proxied": true,
    "enabled": true
  }' | jq -r '.result.id')

echo "✅ Load balancer created: $LB_ID"

echo ""
echo "========================================="
echo "✅ Cloudflare Global Load Balancer Setup Complete!"
echo ""
echo "Configuration:"
echo "  - Domain: api.$DOMAIN"
echo "  - Monitor ID: $MONITOR_ID"
echo "  - US East Pool: $US_POOL_ID"
echo "  - EU West Pool: $EU_POOL_ID"
echo "  - APAC Southeast Pool: $APAC_POOL_ID"
echo "  - Load Balancer ID: $LB_ID"
echo ""
echo "Test your setup:"
echo "  curl https://api.$DOMAIN/health"
```

---

## 🔧 Usage Instructions

### Setup Regional Secrets
```powershell
# Windows (PowerShell)
.\scripts\setup_regional_secrets.ps1
```

### Deploy Canary Rollout
```bash
# Linux/macOS
./scripts/canary_rollout.sh \
  --region us-east \
  --green-ip 134.122.1.100 \
  --blue-ip 134.122.1.50 \
  --lb-ip 134.122.1.200
```

### Check Regional Health
```bash
./scripts/regional_health_check.sh
```

### Setup Cloudflare Global LB
```bash
./scripts/cloudflare_global_lb.sh
```

---

**Last Updated:** November 15, 2025
