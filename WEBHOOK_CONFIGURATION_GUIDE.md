# Webhook Configuration Guide

# Complete setup for Slack and Microsoft Teams notifications

## 📋 Table of Contents

-   [Slack Webhook Setup](#slack-webhook-setup)
-   [Microsoft Teams Webhook Setup](#microsoft-teams-webhook-setup)
-   [Testing Webhooks](#testing-webhooks)
-   [Troubleshooting](#troubleshooting)

---

## 🔔 Slack Webhook Setup

### Step 1: Create Slack App

1. **Go to Slack API Portal:**
   -   Visit: <https://api.slack.com/apps>
   -   Click "Create New App"
   -   Select "From scratch"

2. **Configure App:**
   -   **App Name:** `Advancia Deployment Alerts`
   -   **Workspace:** Select your workspace
   -   Click "Create App"

### Step 2: Enable Incoming Webhooks

1. **Navigate to Incoming Webhooks:**
   -   In your app settings, click "Incoming Webhooks" in the left sidebar
   -   Toggle "Activate Incoming Webhooks" to **ON**

2. **Add Webhook URLs:**

   **For Incident Alerts:**
   -   Click "Add New Webhook to Workspace"
   -   Select channel: `#incidents-deployments` (create if doesn't exist)
   -   Click "Allow"
   -   **Copy webhook URL** → Save as `SLACK_WEBHOOK_URL` secret

   **For Deployment Summaries:**
   -   Click "Add New Webhook to Workspace" again
   -   Select channel: `#deployments`
   -   Click "Allow"
   -   **Copy webhook URL** → Save as `GLOBAL_SLACK_WEBHOOK` secret

### Step 3: Configure Slack Channels

**Create Required Channels:**

```
#deployments
Purpose: Success notifications and deployment summaries
Members: Engineering team, SRE, Product

#incidents-deployments
Purpose: Incident Quick Cards, failure alerts, rollback notifications
Members: On-call SRE, Engineering leads, VP Engineering
```

**Channel Settings:**

-   Enable notifications for all messages
-   Pin important runbooks and dashboard links
-   Set channel topic with relevant links

### Step 4: Add Secrets to GitHub

```powershell
# Using the setup script
.\setup-github-config.ps1

# Or manually
echo "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" | gh secret set SLACK_WEBHOOK_URL
echo "https://hooks.slack.com/services/YOUR/WEBHOOK/URL2" | gh secret set GLOBAL_SLACK_WEBHOOK
```

### Step 5: Customize Slack Quick Card

**Edit workflow (optional):**

```yaml
# .github/workflows/multi-region-deployment-with-monitoring.yml
# Lines 680-743 - Customize Quick Card format

- name: Post incident Quick Card to Slack
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
  run: |
    # Customize color, fields, or buttons here
    COLOR="danger"  # danger (red), warning (yellow), good (green)
```

---

## 📧 Microsoft Teams Webhook Setup

### Step 1: Configure Incoming Webhook in Teams

1. **Open Microsoft Teams:**
   -   Navigate to the channel where you want alerts
   -   Example channels: `Deployments` or `Incidents`

2. **Add Connector:**
   -   Click the `•••` (three dots) next to the channel name
   -   Select "Connectors" or "Manage connectors"
   -   Search for "Incoming Webhook"
   -   Click "Configure"

3. **Configure Webhook:**
   -   **Name:** `Advancia Deployment Alerts`
   -   **Upload Image:** (optional) Add company logo
   -   Click "Create"
   -   **Copy webhook URL** → Save as `TEAMS_WEBHOOK_URL` secret

### Step 2: Add Secret to GitHub

```powershell
echo "https://your-tenant.webhook.office.com/..." | gh secret set TEAMS_WEBHOOK_URL
```

### Step 3: Update Workflow for Teams Support

**Add Teams notification step:**

```yaml
- name: Post to Microsoft Teams
  if: always() && env.TEAMS_WEBHOOK_URL != ''
  env:
    TEAMS_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}
  run: |
    TEAMS_MESSAGE=$(cat <<'TEAMSJSON'
    {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      "summary": "Deployment Alert",
      "themeColor": "FF0000",
      "title": "🚨 Deployment Incident",
      "sections": [
        {
          "activityTitle": "Multi-Region Deployment",
          "activitySubtitle": "Region: ${{ env.FAILED_REGION }}",
          "facts": [
            {
              "name": "Stage:",
              "value": "Canary rollout"
            },
            {
              "name": "Impact:",
              "value": "Rollback triggered"
            },
            {
              "name": "Error Rate:",
              "value": "${{ env.ERROR_RATE }}%"
            },
            {
              "name": "Latency:",
              "value": "${{ env.LATENCY_P95 }}ms"
            },
            {
              "name": "Version:",
              "value": "${{ github.sha }}"
            }
          ]
        }
      ],
      "potentialAction": [
        {
          "@type": "OpenUri",
          "name": "View Dashboard",
          "targets": [
            {
              "os": "default",
              "uri": "https://grafana.advancia.com"
            }
          ]
        },
        {
          "@type": "OpenUri",
          "name": "View Logs",
          "targets": [
            {
              "os": "default",
              "uri": "https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}"
            }
          ]
        }
      ]
    }
    TEAMSJSON
    )

    curl -X POST "$TEAMS_WEBHOOK_URL" \
      -H "Content-Type: application/json" \
      -d "$TEAMS_MESSAGE"
```

---

## 🧪 Testing Webhooks

### Test Slack Webhook

**Using curl:**

```bash
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -H "Content-Type: application/json" \
  -d '{
    "text": "🧪 Test notification from deployment pipeline",
    "attachments": [
      {
        "color": "good",
        "fields": [
          {
            "title": "Status",
            "value": "Webhook configured successfully",
            "short": true
          },
          {
            "title": "Test",
            "value": "Connection OK",
            "short": true
          }
        ]
      }
    ]
  }'
```

**Using PowerShell:**

```powershell
$webhookUrl = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
$body = @{
    text = "🧪 Test notification from deployment pipeline"
    attachments = @(
        @{
            color = "good"
            fields = @(
                @{
                    title = "Status"
                    value = "Webhook configured successfully"
                    short = $true
                },
                @{
                    title = "Test"
                    value = "Connection OK"
                    short = $true
                }
            )
        }
    )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $body -ContentType "application/json"
```

### Test Microsoft Teams Webhook

**Using curl:**

```bash
curl -X POST "https://your-tenant.webhook.office.com/..." \
  -H "Content-Type: application/json" \
  -d '{
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "summary": "Test Notification",
    "themeColor": "28a745",
    "title": "🧪 Test Notification",
    "sections": [
      {
        "activityTitle": "Webhook Configuration Test",
        "facts": [
          {
            "name": "Status:",
            "value": "Connected"
          },
          {
            "name": "Test:",
            "value": "Successful"
          }
        ]
      }
    ]
  }'
```

**Using PowerShell:**

```powershell
$webhookUrl = "https://your-tenant.webhook.office.com/..."
$body = @{
    "@type" = "MessageCard"
    "@context" = "https://schema.org/extensions"
    summary = "Test Notification"
    themeColor = "28a745"
    title = "🧪 Test Notification"
    sections = @(
        @{
            activityTitle = "Webhook Configuration Test"
            facts = @(
                @{
                    name = "Status:"
                    value = "Connected"
                },
                @{
                    name = "Test:"
                    value = "Successful"
                }
            )
        }
    )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $body -ContentType "application/json"
```

### Test from GitHub Actions

**Create test workflow:**

```yaml
# .github/workflows/test-webhooks.yml
name: Test Webhooks

on:
  workflow_dispatch:

jobs:
  test-slack:
    runs-on: ubuntu-latest
    steps:
      - name: Test Slack Webhook
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        run: |
          curl -X POST "$SLACK_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d '{
              "text": "✅ Slack webhook test from GitHub Actions",
              "attachments": [{
                "color": "good",
                "fields": [{
                  "title": "Workflow",
                  "value": "'"${{ github.workflow }}"'",
                  "short": true
                }]
              }]
            }'

  test-teams:
    runs-on: ubuntu-latest
    if: vars.TEAMS_WEBHOOK_URL != ''
    steps:
      - name: Test Teams Webhook
        env:
          TEAMS_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}
        run: |
          curl -X POST "$TEAMS_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d '{
              "@type": "MessageCard",
              "title": "✅ Teams webhook test from GitHub Actions",
              "text": "Webhook configured successfully"
            }'
```

**Run test:**

```bash
gh workflow run test-webhooks.yml
gh run watch
```

---

## 🔧 Troubleshooting

### Slack Webhook Issues

**Problem: "invalid_payload" error**

```
Solution:
- Ensure JSON is properly formatted
- Check for special characters that need escaping
- Validate JSON: https://jsonlint.com/

Example fix:
# Bad
"text": "Error: $ERROR_MSG"  # May contain unescaped quotes

# Good
"text": "Error: ${ERROR_MSG//\"/\\\"}"  # Escaped quotes
```

**Problem: "channel_not_found" error**

```
Solution:
- Webhook URL is tied to a specific channel
- If channel is deleted/renamed, create new webhook
- Go to Slack API → Your App → Incoming Webhooks
- Add new webhook to correct channel
```

**Problem: Messages not appearing**

```
Solution:
1. Check channel permissions (webhook has access?)
2. Verify webhook URL is correct (starts with https://hooks.slack.com/)
3. Test with simple message:
   curl -X POST "$WEBHOOK" -d '{"text":"test"}'
4. Check Slack API logs: https://api.slack.com/apps → Your App → Event Subscriptions
```

### Microsoft Teams Webhook Issues

**Problem: "400 Bad Request" error**

```
Solution:
- Ensure "@type" and "@context" are included
- MessageCard schema must be valid
- Use proper JSON structure

Example:
{
  "@type": "MessageCard",
  "@context": "https://schema.org/extensions",
  "title": "Title required",
  "text": "Text or sections required"
}
```

**Problem: Webhook URL expired**

```
Solution:
- Teams webhooks can expire if connector is removed
- Recreate webhook:
  1. Go to Teams channel
  2. ••• → Connectors → Incoming Webhook
  3. Remove old webhook
  4. Create new webhook
  5. Update GitHub secret
```

**Problem: Message formatting issues**

```
Solution:
- Use MessageCard designer: https://amdesigner.azurewebsites.net/
- Test payload before adding to workflow
- Validate JSON structure
```

### GitHub Secrets Issues

**Problem: Secret not found in workflow**

```
Solution:
1. Verify secret exists:
   gh secret list

2. Check secret name matches exactly (case-sensitive):
   Workflow: ${{ secrets.SLACK_WEBHOOK_URL }}
   Secret must be named: SLACK_WEBHOOK_URL

3. Re-add secret if needed:
   echo "webhook-url" | gh secret set SLACK_WEBHOOK_URL
```

**Problem: Secret value incorrect**

```
Solution:
1. Secrets can't be viewed after creation
2. Delete and recreate:
   gh secret delete SLACK_WEBHOOK_URL
   echo "correct-webhook-url" | gh secret set SLACK_WEBHOOK_URL
```

### Network Issues

**Problem: Connection timeout**

```
Solution:
- Verify GitHub Actions runner has internet access
- Check firewall rules
- Test connectivity:
  - name: Test connectivity
    run: |
      curl -v https://hooks.slack.com/
      # Should return 404 (expected), not timeout
```

**Problem: SSL certificate errors**

```
Solution:
- Usually indicates man-in-the-middle proxy
- Use curl with -k flag (not recommended for production):
  curl -k -X POST "$WEBHOOK_URL" ...
- Better: Fix SSL certificate chain on runner
```

---

## 📊 Webhook Best Practices

### Rate Limiting

**Slack Rate Limits:**

-   1 message per second per webhook
-   Bursts up to 100 messages allowed
-   Throttle if sending many notifications

```yaml
- name: Send notification with rate limiting
  run: |
    for region in us eu apac; do
      curl -X POST "$SLACK_WEBHOOK_URL" -d "{\"text\":\"$region deployed\"}"
      sleep 1  # Rate limit: 1 msg/sec
    done
```

### Error Handling

**Retry failed webhook calls:**

```yaml
- name: Send Slack notification with retry
  run: |
    MAX_RETRIES=3
    RETRY_COUNT=0

    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
      HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "$SLACK_WEBHOOK_URL" \
        -d '{"text":"Deployment notification"}')
      
      if [ $HTTP_CODE -eq 200 ]; then
        echo "Notification sent successfully"
        break
      else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "Retry $RETRY_COUNT/$MAX_RETRIES (HTTP $HTTP_CODE)"
        sleep 2
      fi
    done
```

### Message Formatting

**Use consistent Quick Card format:**

```json
{
  "text": "🚨 Incident Alert",
  "attachments": [
    {
      "color": "danger",
      "fields": [
        { "title": "Region", "value": "US East", "short": true },
        { "title": "Stage", "value": "Canary 25%", "short": true },
        { "title": "Error Rate", "value": "1.2%", "short": true },
        { "title": "Latency", "value": "475ms", "short": true }
      ],
      "actions": [
        {
          "type": "button",
          "text": "📊 Dashboard",
          "url": "https://grafana.advancia.com"
        },
        {
          "type": "button",
          "text": "🔍 Logs",
          "url": "https://github.com/..."
        }
      ]
    }
  ]
}
```

---

## ✅ Verification Checklist

After setup, verify:

-   [ ] Slack webhook URL added to `SLACK_WEBHOOK_URL` secret
-   [ ] Global Slack webhook added to `GLOBAL_SLACK_WEBHOOK` secret
-   [ ] Teams webhook added to `TEAMS_WEBHOOK_URL` secret (if using Teams)
-   [ ] Test message sent successfully to Slack
-   [ ] Test message sent successfully to Teams (if configured)
-   [ ] `#deployments` channel created and members added
-   [ ] `#incidents-deployments` channel created and members added
-   [ ] Webhook test workflow runs successfully
-   [ ] Quick Card format displays correctly
-   [ ] Dashboard and log links work in notifications
-   [ ] Rate limiting configured (1 msg/sec)
-   [ ] Error handling and retries implemented

---

## 📚 Related Documentation

-   **Setup Script:** `setup-github-config.ps1` - Automated configuration
-   **Deployment Guide:** `DEPLOYMENT_LIFECYCLE.md` - Configure → Deploy → Monitor → Celebrate
-   **Quick Reference:** `DEPLOYMENT_QUICK_REFERENCE.md` - Day-of deployment card
-   **Debugging:** `DEPLOYMENT_DEBUGGING_GUIDE.md` - Troubleshooting runbooks

---

**Your webhooks are configured! Time to deploy and watch the alerts flow.** 🚀
