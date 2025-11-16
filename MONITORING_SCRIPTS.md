# 📊 Monitoring Scripts for Multi-Region Deployments

Collection of scripts for monitoring and observability during multi-region deployments.

---

## 🔹 Monitor Deployment Script

**File:** `scripts/monitor_deployment.sh`

```bash
#!/bin/bash

# Real-time deployment monitoring script
# Usage: ./monitor_deployment.sh --region us-east --stage 50

set -euo pipefail

REGION=""
STAGE=""
DURATION=300  # Default 5 minutes
INTERVAL=30   # Check every 30 seconds

while [[ $# -gt 0 ]]; do
  case $1 in
    --region) REGION="$2"; shift 2 ;;
    --stage) STAGE="$2"; shift 2 ;;
    --duration) DURATION="$2"; shift 2 ;;
    *) echo "Unknown: $1"; exit 1 ;;
  esac
done

if [[ -z "$REGION" || -z "$STAGE" ]]; then
  echo "❌ Usage: $0 --region REGION --stage STAGE"
  exit 1
fi

echo "📊 Monitoring $REGION deployment (Stage $STAGE%) for $DURATION seconds"
echo "========================================================================"

# Get API endpoint based on region
case $REGION in
  us-east) API="api-us.advancia.com" ;;
  eu-west) API="api-eu.advancia.com" ;;
  apac-se) API="api-apac.advancia.com" ;;
  *) echo "❌ Unknown region: $REGION"; exit 1 ;;
esac

CHECKS=$((DURATION / INTERVAL))
FAILED=0

for i in $(seq 1 $CHECKS); do
  echo ""
  echo "Check $i/$CHECKS ($(date '+%H:%M:%S'))"
  echo "----------------------------------------"
  
  # Fetch metrics
  METRICS=$(curl -s "https://$API/metrics" 2>/dev/null || echo "")
  
  if [[ -z "$METRICS" ]]; then
    echo "❌ Failed to fetch metrics"
    ((FAILED++))
    continue
  fi
  
  # Parse metrics
  ERROR_RATE=$(echo "$METRICS" | grep 'error_rate_percent' | awk '{print $2}' | head -1)
  LATENCY_P50=$(echo "$METRICS" | grep 'http_request_duration_seconds{quantile="0.5"}' | awk '{print $2}' | awk '{printf "%.0f", $1 * 1000}')
  LATENCY_P95=$(echo "$METRICS" | grep 'http_request_duration_seconds{quantile="0.95"}' | awk '{print $2}' | awk '{printf "%.0f", $1 * 1000}')
  CPU=$(echo "$METRICS" | grep 'system_cpu_usage_percent' | awk '{print $2}' | head -1)
  MEMORY=$(echo "$METRICS" | grep 'system_memory_usage_percent' | awk '{print $2}' | head -1)
  REQUEST_COUNT=$(echo "$METRICS" | grep 'http_requests_total' | awk '{sum+=$2} END {print sum}')
  
  # Display metrics
  echo "  Error Rate:   ${ERROR_RATE}%"
  echo "  Latency P50:  ${LATENCY_P50}ms"
  echo "  Latency P95:  ${LATENCY_P95}ms"
  echo "  CPU Usage:    ${CPU}%"
  echo "  Memory:       ${MEMORY}%"
  echo "  Requests:     $REQUEST_COUNT"
  
  # Determine thresholds based on stage
  case $STAGE in
    10) MAX_ERROR=1.0; MAX_LATENCY=500 ;;
    25) MAX_ERROR=0.8; MAX_LATENCY=450 ;;
    50) MAX_ERROR=0.5; MAX_LATENCY=400 ;;
    75) MAX_ERROR=0.3; MAX_LATENCY=350 ;;
    100) MAX_ERROR=0.2; MAX_LATENCY=300 ;;
    *) MAX_ERROR=1.0; MAX_LATENCY=500 ;;
  esac
  
  # Check thresholds
  WARNINGS=0
  
  if (( $(echo "$ERROR_RATE > $MAX_ERROR" | bc -l) )); then
    echo "  ❌ ERROR: Error rate ${ERROR_RATE}% exceeds ${MAX_ERROR}%"
    exit 1
  fi
  
  if [ "$LATENCY_P95" -gt "$MAX_LATENCY" ]; then
    echo "  ❌ ERROR: P95 latency ${LATENCY_P95}ms exceeds ${MAX_LATENCY}ms"
    exit 1
  fi
  
  if (( $(echo "$CPU > 85" | bc -l) )); then
    echo "  ⚠️  WARNING: High CPU usage ${CPU}%"
    ((WARNINGS++))
  fi
  
  if (( $(echo "$MEMORY > 90" | bc -l) )); then
    echo "  ⚠️  WARNING: High memory usage ${MEMORY}%"
    ((WARNINGS++))
  fi
  
  if [ $WARNINGS -eq 0 ]; then
    echo "  ✅ All metrics within acceptable ranges"
  fi
  
  sleep $INTERVAL
done

echo ""
echo "========================================================================"
echo "✅ Monitoring complete - $REGION stage $STAGE% passed all checks"
echo "   Failed checks: $FAILED/$CHECKS"

if [ $FAILED -gt 2 ]; then
  echo "⚠️  Warning: Multiple failed metric collections"
  exit 1
fi

exit 0
```

---

## 🔹 Compare Regions Script

**File:** `scripts/compare_regions.sh`

```bash
#!/bin/bash

# Compare metrics across all regions
# Usage: ./compare_regions.sh

echo "🌍 Multi-Region Metrics Comparison"
echo "======================================"
echo ""

REGIONS=("us-east" "eu-west" "apac-se")
APIS=("api-us.advancia.com" "api-eu.advancia.com" "api-apac.advancia.com")

printf "%-15s %-10s %-10s %-10s %-8s %-8s\n" "REGION" "ERROR%" "P95(ms)" "P99(ms)" "CPU%" "MEM%"
echo "------------------------------------------------------------------------"

for i in "${!REGIONS[@]}"; do
  REGION="${REGIONS[$i]}"
  API="${APIS[$i]}"
  
  METRICS=$(curl -s "https://$API/metrics" 2>/dev/null || echo "")
  
  if [[ -z "$METRICS" ]]; then
    printf "%-15s %-10s %-10s %-10s %-8s %-8s\n" "$REGION" "N/A" "N/A" "N/A" "N/A" "N/A"
    continue
  fi
  
  ERROR=$(echo "$METRICS" | grep 'error_rate_percent' | awk '{print $2}' | head -1)
  P95=$(echo "$METRICS" | grep 'http_request_duration_seconds{quantile="0.95"}' | awk '{print $2}' | awk '{printf "%.0f", $1 * 1000}')
  P99=$(echo "$METRICS" | grep 'http_request_duration_seconds{quantile="0.99"}' | awk '{print $2}' | awk '{printf "%.0f", $1 * 1000}')
  CPU=$(echo "$METRICS" | grep 'system_cpu_usage_percent' | awk '{print $2}' | head -1)
  MEM=$(echo "$METRICS" | grep 'system_memory_usage_percent' | awk '{print $2}' | head -1)
  
  printf "%-15s %-10s %-10s %-10s %-8s %-8s\n" "$REGION" "${ERROR}%" "${P95}ms" "${P99}ms" "${CPU}%" "${MEM}%"
done

echo ""
echo "======================================"
```

---

## 🔹 Push Metrics to Prometheus

**File:** `scripts/push_metrics_prometheus.sh`

```bash
#!/bin/bash

# Push deployment metrics to Prometheus Pushgateway
# Usage: ./push_metrics_prometheus.sh --region us-east --environment green

set -euo pipefail

REGION=""
ENVIRONMENT=""
PUSHGATEWAY_URL="${PROMETHEUS_PUSHGATEWAY_URL:-http://prometheus.advancia.com:9091}"

while [[ $# -gt 0 ]]; do
  case $1 in
    --region) REGION="$2"; shift 2 ;;
    --environment) ENVIRONMENT="$2"; shift 2 ;;
    --pushgateway) PUSHGATEWAY_URL="$2"; shift 2 ;;
    *) echo "Unknown: $1"; exit 1 ;;
  esac
done

if [[ -z "$REGION" || -z "$ENVIRONMENT" ]]; then
  echo "❌ Usage: $0 --region REGION --environment ENVIRONMENT"
  exit 1
fi

echo "📊 Pushing metrics for $REGION ($ENVIRONMENT) to Prometheus"

# Get API endpoint
case $REGION in
  us-east) API="api-us.advancia.com" ;;
  eu-west) API="api-eu.advancia.com" ;;
  apac-se) API="api-apac.advancia.com" ;;
  *) echo "❌ Unknown region: $REGION"; exit 1 ;;
esac

# Fetch current metrics
METRICS=$(curl -s "https://$API/metrics")

# Extract key metrics
ERROR_RATE=$(echo "$METRICS" | grep 'error_rate_percent' | awk '{print $2}' | head -1)
LATENCY_P95=$(echo "$METRICS" | grep 'http_request_duration_seconds{quantile="0.95"}' | awk '{print $2}')
CPU=$(echo "$METRICS" | grep 'system_cpu_usage_percent' | awk '{print $2}' | head -1)
MEMORY=$(echo "$METRICS" | grep 'system_memory_usage_percent' | awk '{print $2}' | head -1)
REQUEST_COUNT=$(echo "$METRICS" | grep 'http_requests_total' | awk '{sum+=$2} END {print sum}')

# Push to Prometheus Pushgateway
cat <<EOF | curl --data-binary @- "$PUSHGATEWAY_URL/metrics/job/deployment/region/$REGION/environment/$ENVIRONMENT"
# TYPE deployment_error_rate gauge
deployment_error_rate{region="$REGION",environment="$ENVIRONMENT"} $ERROR_RATE

# TYPE deployment_latency_p95 gauge
deployment_latency_p95{region="$REGION",environment="$ENVIRONMENT"} $LATENCY_P95

# TYPE deployment_cpu_usage gauge
deployment_cpu_usage{region="$REGION",environment="$ENVIRONMENT"} $CPU

# TYPE deployment_memory_usage gauge
deployment_memory_usage{region="$REGION",environment="$ENVIRONMENT"} $MEMORY

# TYPE deployment_request_count gauge
deployment_request_count{region="$REGION",environment="$ENVIRONMENT"} $REQUEST_COUNT

# TYPE deployment_timestamp gauge
deployment_timestamp{region="$REGION",environment="$ENVIRONMENT"} $(date +%s)
EOF

echo "✅ Metrics pushed successfully"
echo "   Error Rate: ${ERROR_RATE}%"
echo "   P95 Latency: ${LATENCY_P95}s"
echo "   CPU: ${CPU}%"
echo "   Memory: ${MEMORY}%"
```

---

## 🔹 Send Datadog Metrics

**File:** `scripts/send_datadog_metrics.sh`

```bash
#!/bin/bash

# Send deployment metrics to Datadog
# Usage: ./send_datadog_metrics.sh --region us-east --stage 50

set -euo pipefail

REGION=""
STAGE=""
DD_API_KEY="${DATADOG_API_KEY}"
DD_SITE="${DATADOG_SITE:-datadoghq.com}"

while [[ $# -gt 0 ]]; do
  case $1 in
    --region) REGION="$2"; shift 2 ;;
    --stage) STAGE="$2"; shift 2 ;;
    --api-key) DD_API_KEY="$2"; shift 2 ;;
    *) echo "Unknown: $1"; exit 1 ;;
  esac
done

if [[ -z "$REGION" || -z "$STAGE" || -z "$DD_API_KEY" ]]; then
  echo "❌ Missing required parameters"
  exit 1
fi

echo "📊 Sending metrics to Datadog for $REGION (Stage $STAGE%)"

# Get metrics
case $REGION in
  us-east) API="api-us.advancia.com" ;;
  eu-west) API="api-eu.advancia.com" ;;
  apac-se) API="api-apac.advancia.com" ;;
  *) echo "❌ Unknown region: $REGION"; exit 1 ;;
esac

METRICS=$(curl -s "https://$API/metrics")
ERROR_RATE=$(echo "$METRICS" | grep 'error_rate_percent' | awk '{print $2}' | head -1)
LATENCY=$(echo "$METRICS" | grep 'http_request_duration_seconds{quantile="0.95"}' | awk '{print $2}' | awk '{printf "%.0f", $1 * 1000}')
CPU=$(echo "$METRICS" | grep 'system_cpu_usage_percent' | awk '{print $2}' | head -1)
MEMORY=$(echo "$METRICS" | grep 'system_memory_usage_percent' | awk '{print $2}' | head -1)

CURRENT_TIME=$(date +%s)

# Send deployment event
curl -X POST "https://api.${DD_SITE}/api/v1/events" \
  -H "Content-Type: application/json" \
  -H "DD-API-KEY: $DD_API_KEY" \
  -d '{
    "title": "Canary Stage '"$STAGE"'% - '"$REGION"'",
    "text": "Deployment stage '"$STAGE"'% completed in '"$REGION"'\nError: '"$ERROR_RATE"'%, Latency: '"$LATENCY"'ms",
    "tags": ["region:'"$REGION"'", "stage:'"$STAGE"'", "deployment:canary"],
    "alert_type": "info"
  }'

# Send metrics
curl -X POST "https://api.${DD_SITE}/api/v1/series" \
  -H "Content-Type: application/json" \
  -H "DD-API-KEY: $DD_API_KEY" \
  -d '{
    "series": [
      {
        "metric": "deployment.canary.error_rate",
        "points": [[ '"$CURRENT_TIME"', '"$ERROR_RATE"' ]],
        "tags": ["region:'"$REGION"'", "stage:'"$STAGE"'"],
        "type": "gauge"
      },
      {
        "metric": "deployment.canary.latency_p95",
        "points": [[ '"$CURRENT_TIME"', '"$LATENCY"' ]],
        "tags": ["region:'"$REGION"'", "stage:'"$STAGE"'"],
        "type": "gauge"
      },
      {
        "metric": "deployment.canary.cpu_usage",
        "points": [[ '"$CURRENT_TIME"', '"$CPU"' ]],
        "tags": ["region:'"$REGION"'", "stage:'"$STAGE"'"],
        "type": "gauge"
      },
      {
        "metric": "deployment.canary.memory_usage",
        "points": [[ '"$CURRENT_TIME"', '"$MEMORY"' ]],
        "tags": ["region:'"$REGION"'", "stage:'"$STAGE"'"],
        "type": "gauge"
      }
    ]
  }'

echo "✅ Datadog metrics sent successfully"
```

---

## 🔹 Alert if Thresholds Exceeded

**File:** `scripts/check_thresholds.sh`

```bash
#!/bin/bash

# Check if metrics exceed thresholds and alert
# Usage: ./check_thresholds.sh --region us-east --stage 50

set -euo pipefail

REGION=""
STAGE=""
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL}"

while [[ $# -gt 0 ]]; do
  case $1 in
    --region) REGION="$2"; shift 2 ;;
    --stage) STAGE="$2"; shift 2 ;;
    *) shift ;;
  esac
done

case $REGION in
  us-east) API="api-us.advancia.com" ;;
  eu-west) API="api-eu.advancia.com" ;;
  apac-se) API="api-apac.advancia.com" ;;
  *) echo "❌ Unknown region"; exit 1 ;;
esac

METRICS=$(curl -s "https://$API/metrics")
ERROR_RATE=$(echo "$METRICS" | grep 'error_rate_percent' | awk '{print $2}' | head -1)
LATENCY=$(echo "$METRICS" | grep 'http_request_duration_seconds{quantile="0.95"}' | awk '{print $2}' | awk '{printf "%.0f", $1 * 1000}')
CPU=$(echo "$METRICS" | grep 'system_cpu_usage_percent' | awk '{print $2}' | head -1)

# Determine thresholds
case $STAGE in
  10) MAX_ERROR=1.0; MAX_LATENCY=500 ;;
  25) MAX_ERROR=0.8; MAX_LATENCY=450 ;;
  50) MAX_ERROR=0.5; MAX_LATENCY=400 ;;
  75) MAX_ERROR=0.3; MAX_LATENCY=350 ;;
  100) MAX_ERROR=0.2; MAX_LATENCY=300 ;;
esac

ALERTS=""

if (( $(echo "$ERROR_RATE > $MAX_ERROR" | bc -l) )); then
  ALERTS="❌ Error rate ${ERROR_RATE}% exceeds ${MAX_ERROR}%\n"
fi

if [ "$LATENCY" -gt "$MAX_LATENCY" ]; then
  ALERTS="${ALERTS}❌ Latency ${LATENCY}ms exceeds ${MAX_LATENCY}ms\n"
fi

if (( $(echo "$CPU > 85" | bc -l) )); then
  ALERTS="${ALERTS}⚠️ High CPU ${CPU}%\n"
fi

if [[ -n "$ALERTS" ]]; then
  echo -e "$ALERTS"
  
  # Send Slack alert
  curl -X POST "$SLACK_WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d '{
      "attachments": [{
        "color": "danger",
        "title": "🚨 Threshold Exceeded - '"$REGION"' Stage '"$STAGE"'%",
        "text": "'"$ALERTS"'",
        "footer": "Deployment Monitor"
      }]
    }'
  
  exit 1
else
  echo "✅ All thresholds OK"
  exit 0
fi
```

---

## 📋 Usage Examples

### Monitor a Deployment Stage
```bash
./scripts/monitor_deployment.sh \
  --region us-east \
  --stage 50 \
  --duration 300
```

### Compare All Regions
```bash
./scripts/compare_regions.sh
```

### Push Metrics to Prometheus
```bash
./scripts/push_metrics_prometheus.sh \
  --region us-east \
  --environment green
```

### Send Metrics to Datadog
```bash
export DATADOG_API_KEY="your-api-key"
./scripts/send_datadog_metrics.sh \
  --region us-east \
  --stage 75
```

### Check Thresholds
```bash
export SLACK_WEBHOOK_URL="your-webhook-url"
./scripts/check_thresholds.sh \
  --region eu-west \
  --stage 50
```

---

**Last Updated:** November 15, 2025
