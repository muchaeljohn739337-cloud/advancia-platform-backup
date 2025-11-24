# 📊 Regional Monitoring & Observability

Real-time visualization and alerting for multi-region deployments with Prometheus, Grafana, and Datadog integration.

---

## 🎯 Overview

Monitor your multi-region deployments with region-specific dashboards showing:

-   **Latency** per region (P50, P95, P99)
-   **Error rates** (HTTP 5xx, failed health checks)
-   **Resource usage** (CPU, memory, disk per droplet)
-   **Traffic distribution** (Blue vs Green, % per region)
-   **Deployment status** (Canary stages 10→100%)

---

## 📊 Metrics Collection Strategy

### Regional Metrics Endpoints

**Each region exposes:**

```
https://api-us.advancia.com/metrics    # US East Prometheus metrics
https://api-eu.advancia.com/metrics    # EU West Prometheus metrics
https://api-apac.advancia.com/metrics  # APAC Southeast Prometheus metrics
```

**Metrics Format (Prometheus):**

```prometheus
# HELP http_request_duration_seconds HTTP request latency
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{region="us-east",le="0.1"} 95240
http_request_duration_seconds_bucket{region="us-east",le="0.25"} 98320
http_request_duration_seconds_bucket{region="us-east",le="0.5"} 99850
http_request_duration_seconds_sum{region="us-east"} 12456.78
http_request_duration_seconds_count{region="us-east"} 100000

# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{region="us-east",status="200"} 95000
http_requests_total{region="us-east",status="500"} 150

# HELP error_rate_percent Current error rate percentage
# TYPE error_rate_percent gauge
error_rate_percent{region="us-east"} 0.15

# HELP deployment_version Current deployed version
# TYPE deployment_version gauge
deployment_version{region="us-east",environment="green"} 1
deployment_version{region="us-east",environment="blue"} 0

# HELP traffic_distribution_percent Traffic percentage per environment
# TYPE traffic_distribution_percent gauge
traffic_distribution_percent{region="us-east",environment="green"} 75
traffic_distribution_percent{region="us-east",environment="blue"} 25

# HELP system_cpu_usage_percent CPU usage percentage
# TYPE system_cpu_usage_percent gauge
system_cpu_usage_percent{region="us-east",droplet="green"} 45.2

# HELP system_memory_usage_percent Memory usage percentage
# TYPE system_memory_usage_percent gauge
system_memory_usage_percent{region="us-east",droplet="green"} 62.8
```

---

## 🔹 Integration Options

### Option 1: Prometheus + Grafana (Self-Hosted)

**Pros:**

-   Full control and customization
-   No external costs
-   Deep metric retention
-   Advanced querying (PromQL)

**Cons:**

-   Requires infrastructure management
-   Setup complexity
-   Need to configure scraping

**Monthly Cost:** $40 (droplet for Prometheus/Grafana)

---

### Option 2: Datadog (Managed)

**Pros:**

-   Fully managed service
-   Beautiful dashboards out-of-box
-   APM tracing included
-   Excellent alerting

**Cons:**

-   Expensive at scale
-   Vendor lock-in
-   Data retention limits

**Monthly Cost:** $150-500 (based on hosts/metrics)

---

### Option 3: Grafana Cloud (Managed)

**Pros:**

-   Managed Grafana + Prometheus
-   Same Grafana UI you know
-   Good free tier
-   Scalable

**Cons:**

-   Limited free tier
-   Costs increase with metrics
-   Less control than self-hosted

**Monthly Cost:** $0-200 (free tier → paid)

---

### Option 4: Hybrid (Recommended)

**Architecture:**

-   **Prometheus** (self-hosted on dedicated droplet)
-   **Grafana Cloud** (managed dashboards)
-   **Push metrics** from GitHub Actions during deployment
-   **Slack** for alerts

**Monthly Cost:** $40 (Prometheus droplet) + $0 (Grafana free tier) = **$40**

---

## 🚀 Setup Instructions

### Step 1: Deploy Prometheus Server

**Create Prometheus Droplet:**

```bash
doctl compute droplet create \
  advancia-prometheus \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-4gb \
  --region nyc3
```

**Install Prometheus:**

```bash
ssh root@PROMETHEUS_IP << 'EOF'
  # Download Prometheus
  wget https://github.com/prometheus/prometheus/releases/download/v2.48.0/prometheus-2.48.0.linux-amd64.tar.gz
  tar xvfz prometheus-*.tar.gz
  cd prometheus-*

  # Create service user
  useradd --no-create-home --shell /bin/false prometheus

  # Create directories
  mkdir /etc/prometheus /var/lib/prometheus

  # Copy binaries
  cp prometheus promtool /usr/local/bin/
  cp -r consoles console_libraries /etc/prometheus/

  # Set ownership
  chown -R prometheus:prometheus /etc/prometheus /var/lib/prometheus
  chown prometheus:prometheus /usr/local/bin/{prometheus,promtool}

  # Create config
  cat > /etc/prometheus/prometheus.yml << 'CONFIG'
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'advancia-production'

scrape_configs:
  # US East
  - job_name: 'us-east-blue'
    static_configs:
      - targets: ['US_BLUE_IP:4000']
        labels:
          region: 'us-east'
          environment: 'blue'

  - job_name: 'us-east-green'
    static_configs:
      - targets: ['US_GREEN_IP:4000']
        labels:
          region: 'us-east'
          environment: 'green'

  # EU West
  - job_name: 'eu-west-blue'
    static_configs:
      - targets: ['EU_BLUE_IP:4000']
        labels:
          region: 'eu-west'
          environment: 'blue'

  - job_name: 'eu-west-green'
    static_configs:
      - targets: ['EU_GREEN_IP:4000']
        labels:
          region: 'eu-west'
          environment: 'green'

  # APAC Southeast
  - job_name: 'apac-se-blue'
    static_configs:
      - targets: ['APAC_BLUE_IP:4000']
        labels:
          region: 'apac-se'
          environment: 'blue'

  - job_name: 'apac-se-green'
    static_configs:
      - targets: ['APAC_GREEN_IP:4000']
        labels:
          region: 'apac-se'
          environment: 'green'

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']

rule_files:
  - '/etc/prometheus/alerts.yml'
CONFIG

  # Create systemd service
  cat > /etc/systemd/system/prometheus.service << 'SERVICE'
[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/local/bin/prometheus \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/var/lib/prometheus/ \
  --web.console.templates=/etc/prometheus/consoles \
  --web.console.libraries=/etc/prometheus/console_libraries

[Install]
WantedBy=multi-user.target
SERVICE

  # Start Prometheus
  systemctl daemon-reload
  systemctl enable prometheus
  systemctl start prometheus

  echo "✅ Prometheus installed and running on :9090"
EOF
```

---

### Step 2: Configure Alert Rules

**Create `/etc/prometheus/alerts.yml`:**

```yaml
groups:
  - name: regional_alerts
    interval: 30s
    rules:
      # High Error Rate Alerts
      - alert: HighErrorRateUSEast
        expr: error_rate_percent{region="us-east"} > 1.0
        for: 2m
        labels:
          severity: critical
          region: us-east
        annotations:
          summary: "High error rate in US East"
          description: "Error rate is {{ $value }}% (threshold: 1.0%)"
          dashboard: "https://grafana.advancia.com/d/us-east"

      - alert: HighErrorRateEUWest
        expr: error_rate_percent{region="eu-west"} > 1.0
        for: 2m
        labels:
          severity: critical
          region: eu-west
        annotations:
          summary: "High error rate in EU West"
          description: "Error rate is {{ $value }}% (threshold: 1.0%)"

      - alert: HighErrorRateAPACSE
        expr: error_rate_percent{region="apac-se"} > 1.0
        for: 2m
        labels:
          severity: critical
          region: apac-se
        annotations:
          summary: "High error rate in APAC Southeast"
          description: "Error rate is {{ $value }}% (threshold: 1.0%)"

      # High Latency Alerts
      - alert: HighLatencyUSEast
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{region="us-east"}[5m])) > 0.3
        for: 5m
        labels:
          severity: warning
          region: us-east
        annotations:
          summary: "High P95 latency in US East"
          description: "P95 latency is {{ $value }}s (threshold: 0.3s)"

      # High CPU Usage
      - alert: HighCPUUsage
        expr: system_cpu_usage_percent > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage in {{ $labels.region }}"
          description: "CPU usage is {{ $value }}% on {{ $labels.droplet }}"

      # High Memory Usage
      - alert: HighMemoryUsage
        expr: system_memory_usage_percent > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage in {{ $labels.region }}"
          description: "Memory usage is {{ $value }}% on {{ $labels.droplet }}"

      # Regional Service Down
      - alert: RegionalServiceDown
        expr: up{job=~".*-(blue|green)"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service down in {{ $labels.region }}"
          description: "{{ $labels.job }} is down"

      # Deployment In Progress
      - alert: CanaryDeploymentStalled
        expr: changes(traffic_distribution_percent[10m]) == 0 and traffic_distribution_percent > 0 and traffic_distribution_percent < 100
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Canary deployment stalled in {{ $labels.region }}"
          description: "Traffic distribution hasn't changed in 15 minutes"
```

---

### Step 3: Install Grafana Cloud (Free Tier)

**Sign up:**

1. Go to <https://grafana.com/auth/sign-up>
2. Create free account (14-day trial, then free tier)
3. Get your API credentials

**Configure Prometheus Remote Write:**

```yaml
# Add to /etc/prometheus/prometheus.yml
remote_write:
  - url: https://prometheus-prod-01-eu-west-0.grafana.net/api/prom/push
    basic_auth:
      username: YOUR_USERNAME
      password: YOUR_GRAFANA_CLOUD_API_KEY
```

**Restart Prometheus:**

```bash
systemctl restart prometheus
```

---

### Step 4: Create Grafana Dashboards

**Import Dashboard JSON:**

See `GRAFANA_DASHBOARDS.json` for complete multi-region dashboard configuration.

**Key Panels:**

1. **Global Traffic Map** - Geographic distribution of requests
2. **Regional Latency Comparison** - Side-by-side P50/P95/P99
3. **Error Rate Timeline** - Per-region error rates over time
4. **Deployment Status** - Current Blue/Green split per region
5. **Resource Usage** - CPU/Memory/Disk per droplet
6. **Canary Progress** - Real-time rollout stages

---

## 🔔 GitHub Actions Integration

### Push Metrics During Deployment

**Add to `.github/workflows/multi-region-deployment.yml`:**

```yaml
- name: Collect and push deployment metrics
  env:
    PROMETHEUS_PUSHGATEWAY: ${{ secrets.PROMETHEUS_PUSHGATEWAY_URL }}
    REGION: ${{ matrix.region }}
    ENVIRONMENT: green
  run: |
    # Collect metrics from deployed service
    RESPONSE=$(curl -s http://${{ secrets.DROPLET_IP_GREEN }}:4000/metrics)

    # Extract key metrics
    ERROR_RATE=$(echo "$RESPONSE" | grep 'error_rate_percent' | awk '{print $2}')
    LATENCY_P95=$(echo "$RESPONSE" | grep 'http_request_duration_seconds_bucket{le="0.5"}' | awk '{print $2}')
    CPU_USAGE=$(echo "$RESPONSE" | grep 'system_cpu_usage_percent' | awk '{print $2}')
    MEMORY_USAGE=$(echo "$RESPONSE" | grep 'system_memory_usage_percent' | awk '{print $2}')

    # Push to Prometheus Pushgateway
    cat <<EOF | curl --data-binary @- "$PROMETHEUS_PUSHGATEWAY/metrics/job/github-actions/region/$REGION"
# TYPE deployment_error_rate gauge
deployment_error_rate{region="$REGION",environment="$ENVIRONMENT"} $ERROR_RATE

# TYPE deployment_latency_p95 gauge
deployment_latency_p95{region="$REGION",environment="$ENVIRONMENT"} $LATENCY_P95

# TYPE deployment_cpu_usage gauge
deployment_cpu_usage{region="$REGION",environment="$ENVIRONMENT"} $CPU_USAGE

# TYPE deployment_memory_usage gauge
deployment_memory_usage{region="$REGION",environment="$ENVIRONMENT"} $MEMORY_USAGE

# TYPE deployment_timestamp gauge
deployment_timestamp{region="$REGION",environment="$ENVIRONMENT"} $(date +%s)
EOF

    echo "✅ Metrics pushed for $REGION"

- name: Validate metrics against thresholds
  run: |
    if (( $(echo "$ERROR_RATE > 1.0" | bc -l) )); then
      echo "❌ Error rate too high: $ERROR_RATE%"
      exit 1
    fi

    if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
      echo "⚠️ Warning: High CPU usage: $CPU_USAGE%"
    fi

    echo "✅ Metrics within acceptable thresholds"
```

---

## 📊 Datadog Integration (Alternative)

### Setup Datadog Agent

**Install on each droplet:**

```bash
DD_API_KEY=YOUR_DATADOG_API_KEY \
DD_SITE="datadoghq.com" \
bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"
```

**Configure regional tags:**

```yaml
# /etc/datadog-agent/datadog.yaml
tags:
  - region:us-east
  - environment:production
  - cluster:advancia
```

### Push Custom Metrics from GitHub Actions

```yaml
- name: Send deployment metrics to Datadog
  env:
    DD_API_KEY: ${{ secrets.DATADOG_API_KEY }}
    REGION: ${{ matrix.region }}
  run: |
    # Send deployment event
    curl -X POST "https://api.datadoghq.com/api/v1/events" \
      -H "Content-Type: application/json" \
      -H "DD-API-KEY: $DD_API_KEY" \
      -d '{
        "title": "Deployment to '"$REGION"'",
        "text": "Canary stage completed in '"$REGION"'",
        "tags": ["region:'"$REGION"'", "deployment:canary"],
        "alert_type": "success"
      }'

    # Send custom metrics
    CURRENT_TIME=$(date +%s)

    curl -X POST "https://api.datadoghq.com/api/v1/series" \
      -H "Content-Type: application/json" \
      -H "DD-API-KEY: $DD_API_KEY" \
      -d '{
        "series": [
          {
            "metric": "deployment.canary.error_rate",
            "points": [[ '"$CURRENT_TIME"', '"$ERROR_RATE"' ]],
            "tags": ["region:'"$REGION"'", "environment:green"],
            "type": "gauge"
          },
          {
            "metric": "deployment.canary.latency_p95",
            "points": [[ '"$CURRENT_TIME"', '"$LATENCY_P95"' ]],
            "tags": ["region:'"$REGION"'", "environment:green"],
            "type": "gauge"
          },
          {
            "metric": "deployment.canary.cpu_usage",
            "points": [[ '"$CURRENT_TIME"', '"$CPU_USAGE"' ]],
            "tags": ["region:'"$REGION"'", "environment:green"],
            "type": "gauge"
          }
        ]
      }'
```

---

## 🔔 Enhanced Slack Notifications

### Notification with Dashboard Links

```yaml
- name: Send enhanced Slack notification
  if: always()
  env:
    SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
    REGION: ${{ matrix.region }}
    STAGE: ${{ matrix.canary_stage }}
    STATUS: ${{ job.status }}
  run: |
    # Determine color based on status
    if [ "$STATUS" = "success" ]; then
      COLOR="good"
      EMOJI="✅"
    else
      COLOR="danger"
      EMOJI="❌"
    fi

    # Get current metrics
    METRICS=$(curl -s http://${{ secrets.DROPLET_IP_GREEN }}:4000/metrics)
    ERROR_RATE=$(echo "$METRICS" | grep 'error_rate_percent' | awk '{print $2}')
    LATENCY=$(echo "$METRICS" | grep 'http_request_duration_seconds_sum' | awk '{print $2}')
    CPU=$(echo "$METRICS" | grep 'system_cpu_usage_percent' | awk '{print $2}')
    MEMORY=$(echo "$METRICS" | grep 'system_memory_usage_percent' | awk '{print $2}')

    # Dashboard URLs
    GRAFANA_URL="https://grafana.advancia.com/d/${REGION}-overview"
    PROMETHEUS_URL="https://prometheus.advancia.com/graph?g0.expr=error_rate_percent{region=\"${REGION}\"}"

    curl -X POST "$SLACK_WEBHOOK" \
      -H 'Content-Type: application/json' \
      -d '{
        "attachments": [{
          "color": "'"$COLOR"'",
          "title": "'"$EMOJI"' Canary Stage '"$STAGE"' - '"$REGION"'",
          "title_link": "'"$GRAFANA_URL"'",
          "fields": [
            {
              "title": "Region",
              "value": "'"$REGION"'",
              "short": true
            },
            {
              "title": "Stage",
              "value": "'"$STAGE"'%",
              "short": true
            },
            {
              "title": "Error Rate",
              "value": "'"$ERROR_RATE"'%",
              "short": true
            },
            {
              "title": "Latency (Avg)",
              "value": "'"$LATENCY"'ms",
              "short": true
            },
            {
              "title": "CPU Usage",
              "value": "'"$CPU"'%",
              "short": true
            },
            {
              "title": "Memory Usage",
              "value": "'"$MEMORY"'%",
              "short": true
            }
          ],
          "actions": [
            {
              "type": "button",
              "text": "📊 View Grafana Dashboard",
              "url": "'"$GRAFANA_URL"'"
            },
            {
              "type": "button",
              "text": "📈 View Prometheus Metrics",
              "url": "'"$PROMETHEUS_URL"'"
            },
            {
              "type": "button",
              "text": "🚨 View GitHub Actions",
              "url": "https://github.com/'"$GITHUB_REPOSITORY"'/actions/runs/'"$GITHUB_RUN_ID"'"
            }
          ],
          "footer": "Advancia Deploy Bot",
          "footer_icon": "https://advancia.com/icon.png",
          "ts": '"$(date +%s)"'
        }]
      }'
```

---

## 📊 Dashboard Examples

### Grafana: Multi-Region Overview

**Panels:**

1. **Regional Traffic Map** (Geomap)

   ```promql
   sum by (region) (rate(http_requests_total[5m]))
   ```

2. **Error Rate Comparison** (Time Series)

   ```promql
   error_rate_percent{region=~"us-east|eu-west|apac-se"}
   ```

3. **Latency Heatmap** (Heatmap)

   ```promql
   rate(http_request_duration_seconds_bucket[5m])
   ```

4. **Deployment Status** (Stat Panel)

   ```promql
   traffic_distribution_percent{environment="green"}
   ```

5. **Resource Usage** (Gauge)

   ```promql
   system_cpu_usage_percent
   system_memory_usage_percent
   ```

---

## 🚨 Alert Routing

### Alertmanager Configuration

**`/etc/alertmanager/alertmanager.yml`:**

```yaml
global:
  resolve_timeout: 5m
  slack_api_url: "$SLACK_WEBHOOK_URL"

route:
  group_by: ["region", "severity"]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: "slack-default"

  routes:
    # Critical alerts → PagerDuty + Slack
    - match:
        severity: critical
      receiver: "pagerduty-critical"
      continue: true

    # Regional routing
    - match:
        region: us-east
      receiver: "slack-us-team"

    - match:
        region: eu-west
      receiver: "slack-eu-team"

    - match:
        region: apac-se
      receiver: "slack-apac-team"

receivers:
  - name: "slack-default"
    slack_configs:
      - channel: "#deployments"
        title: "{{ .GroupLabels.region }} Alert"
        text: "{{ range .Alerts }}{{ .Annotations.description }}{{ end }}"
        send_resolved: true

  - name: "slack-us-team"
    slack_configs:
      - channel: "#us-ops"
        title: "US East Alert"

  - name: "slack-eu-team"
    slack_configs:
      - channel: "#eu-ops"
        title: "EU West Alert"

  - name: "slack-apac-team"
    slack_configs:
      - channel: "#apac-ops"
        title: "APAC Southeast Alert"

  - name: "pagerduty-critical"
    pagerduty_configs:
      - service_key: "$PAGERDUTY_SERVICE_KEY"
```

---

## ✅ Setup Checklist

### Infrastructure

-   [ ] Prometheus server deployed and running
-   [ ] Grafana Cloud account created
-   [ ] Remote write configured
-   [ ] Alertmanager installed
-   [ ] All regions exposing `/metrics` endpoint

### Dashboards

-   [ ] Multi-region overview dashboard created
-   [ ] Per-region dashboards configured
-   [ ] Canary progress dashboard setup
-   [ ] Resource usage dashboard created
-   [ ] Custom alerts configured

### Integration

-   [ ] GitHub Actions pushing metrics
-   [ ] Slack webhooks configured
-   [ ] Dashboard links in notifications
-   [ ] Alert routing tested
-   [ ] Runbooks documented

### Testing

-   [ ] Test metric collection from all regions
-   [ ] Verify dashboards updating in real-time
-   [ ] Trigger test alerts
-   [ ] Validate Slack notifications
-   [ ] Test dashboard links

---

## 💰 Cost Summary

### Self-Hosted (Prometheus + Grafana Cloud)

```
Prometheus droplet: $40/month (2vCPU, 4GB RAM)
Grafana Cloud:      $0/month (free tier: 10K series, 14-day retention)
Total:              $40/month
```

### Fully Managed (Datadog)

```
Datadog Pro:        $15/host/month × 6 hosts = $90/month
Custom metrics:     $0.05/metric × 100 = $5/month
APM:               $31/host/month × 6 hosts = $186/month
Total:             $281/month (with APM)
```

### Hybrid (Recommended)

```
Prometheus:        $40/month
Grafana Cloud:     $0/month
Alertmanager:      $0 (same droplet as Prometheus)
Total:             $40/month
```

---

## 🎯 Next Steps

1. **Deploy Prometheus** - Set up central metrics collection
2. **Create Dashboards** - Build multi-region overview
3. **Configure Alerts** - Set up regional alert rules
4. **Test Integration** - Verify metrics flowing from deployments
5. **Train Team** - Document dashboard usage and alert response

---

**Last Updated:** November 15, 2025  
**Status:** Ready for regional monitoring deployment ✅

See `.github/workflows/multi-region-deployment-with-monitoring.yml` for complete implementation.
