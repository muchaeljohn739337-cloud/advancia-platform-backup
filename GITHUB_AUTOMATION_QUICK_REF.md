# GitHub Automation - Quick Reference Card

**Print this page and keep it handy!**

---

## ⚡ Quick Commands

### Setup (First Time)
```powershell
# 1. Copy config template
cp github-config.json.example github-config.json

# 2. Edit with real values
code github-config.json

# 3. Test (safe preview)
.\setup-github-automated.ps1 -DryRun

# 4. Apply changes
.\setup-github-automated.ps1
```

### Update Secrets
```powershell
# Edit config with new values
code github-config.json

# Apply updates
.\setup-github-automated.ps1
```

### Verify Configuration
```powershell
# List environments
gh api repos/OWNER/REPO/environments --jq '.environments[].name'

# List secrets
gh secret list

# Check protection rules
gh api repos/OWNER/REPO/environments/ENV-NAME --jq '.protection_rules'
```

---

## 📋 Configuration Template

```json
{
  "environments": ["production-us-east", "production-eu-west", "production-apac-se"],
  "secrets": {
    "SLACK_WEBHOOK_URL": "https://hooks.slack.com/...",
    "DROPLET_IP_GREEN": "IP-ADDRESS",
    "CF_ZONE_ID": "zone-id"
  },
  "reviewers": [
    { "type": "User", "username": "github-user" }
  ],
  "protection": {
    "wait_timer": 30,
    "protected_branches_only": true
  }
}
```

---

## 🔐 Required Secrets (12 Total)

| Secret | Get From |
|--------|----------|
| `SLACK_WEBHOOK_URL` | Slack API → Incoming Webhooks |
| `GLOBAL_SLACK_WEBHOOK` | Slack API → Incoming Webhooks |
| `TEAMS_WEBHOOK_URL` | Teams → Connectors (optional) |
| `DROPLET_IP_GREEN` | DigitalOcean → Droplets |
| `DROPLET_IP_BLUE` | DigitalOcean → Droplets |
| `LB_IP` | DigitalOcean → Load Balancers |
| `DROPLET_USER` | SSH user (usually "deploy") |
| `PROMETHEUS_PUSHGATEWAY_URL` | Monitoring setup |
| `CF_ZONE_ID` | Cloudflare → Zone Overview |
| `CF_API_TOKEN` | Cloudflare → API Tokens |
| `CF_RECORD_ID_API` | Cloudflare API call |
| `GRAFANA_API_KEY` | Grafana → API Keys |

---

## 🚀 Deployment Commands

```powershell
# Test deployment (single region)
gh workflow run multi-region-deployment-with-monitoring.yml \
  -f regions=us \
  -f deployment_strategy=sequential

# Production (delayed mode - safest)
gh workflow run multi-region-deployment-with-monitoring.yml \
  -f regions=all \
  -f deployment_strategy=delayed \
  -f delay_between_regions=90

# Monitor
gh run watch
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| "GitHub CLI not found" | `winget install GitHub.cli` |
| "Not authenticated" | `gh auth login` |
| "Config file not found" | Check you're in correct directory |
| "Failed to fetch ID" | Verify username/team exists |
| "Invalid JSON" | Use https://jsonlint.com/ |

---

## 📞 Quick Help

```powershell
# Script help
.\setup-github-automated.ps1 -?

# GitHub CLI help
gh --help

# Check auth status
gh auth status

# View workflow runs
gh run list --limit 5
```

---

## 📚 Documentation

- `GITHUB_AUTOMATION_GUIDE.md` - Complete reference
- `WEBHOOK_CONFIGURATION_GUIDE.md` - Slack/Teams setup
- `QUICK_START_DEPLOYMENT.md` - Deployment guide

---

**Pin this card to your desk! 📌**
