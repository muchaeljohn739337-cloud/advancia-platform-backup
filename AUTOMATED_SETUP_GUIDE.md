# Automated GitHub Setup - Quick Guide

Two scripts available for GitHub configuration:

---

## Option 1: Interactive Setup (Recommended for First Time)

**Script:** `setup-github-config.ps1`

**Features:**
- Prompts for each secret value
- Validates GitHub CLI authentication
- Creates environments
- Provides detailed setup guides for each service

**Usage:**
```powershell
# Dry run to see what will be configured
.\setup-github-config.ps1 -DryRun

# Interactive configuration (prompts for each secret)
.\setup-github-config.ps1

# Skip secrets, only create environments
.\setup-github-config.ps1 -SkipSecrets

# View help
.\setup-github-config.ps1 -Help
```

**Time:** ~15 minutes (interactive prompts)

---

## Option 2: Automated Setup (Recommended for Teams)

**Script:** `setup-github-automated.ps1`

**Features:**
- Reads configuration from `github-config.json`
- Batch configures all secrets
- Sets up environment protection rules
- Configures required reviewers

**Usage:**

**Step 1: Edit configuration file**
```powershell
# Open the config file
code github-config.json

# Update with your actual values:
{
  "secrets": {
    "SLACK_WEBHOOK_URL": "https://hooks.slack.com/services/REAL/VALUES/HERE",
    "DROPLET_IP_GREEN": "actual-ip-address",
    ...
  },
  "reviewers": [
    { "type": "User", "username": "your-functional-lead" },
    { "type": "User", "username": "your-sre-lead" }
  ],
  "protection": {
    "wait_timer": 0,
    "protected_branches_only": true
  }
}
```

**Step 2: Run automated setup**
```powershell
# Dry run to preview
.\setup-github-automated.ps1 -DryRun

# Execute configuration
.\setup-github-automated.ps1
```

**Time:** ~5 minutes (after config file ready)

---

## Comparison

| Feature | Interactive | Automated |
|---------|-------------|-----------|
| **Setup time** | 15 minutes | 5 minutes |
| **Configuration** | Manual prompts | JSON file |
| **Reviewers** | Manual in GitHub UI | Auto-configured |
| **Protection rules** | Manual in GitHub UI | Auto-configured |
| **Team use** | One person | Repeatable for all |
| **Version control** | No | Yes (commit config file) |
| **Best for** | First-time setup | Team/CI automation |

---

## Configuration File Reference

### Required Secrets (12 total)

```json
{
  "secrets": {
    // Slack/Teams Notifications
    "SLACK_WEBHOOK_URL": "Incident alerts (#incidents-deployments)",
    "GLOBAL_SLACK_WEBHOOK": "Success notifications (#deployments)",
    "TEAMS_WEBHOOK_URL": "Microsoft Teams (optional)",
    
    // DigitalOcean Infrastructure
    "DROPLET_IP_GREEN": "New version target",
    "DROPLET_IP_BLUE": "Current production",
    "LB_IP": "Load balancer",
    "DROPLET_USER": "SSH user (usually 'deploy')",
    
    // Monitoring
    "PROMETHEUS_PUSHGATEWAY_URL": "Metrics endpoint",
    "GRAFANA_API_KEY": "Dashboard annotations",
    
    // Cloudflare DNS
    "CF_ZONE_ID": "Zone identifier",
    "CF_API_TOKEN": "API token with DNS edit",
    "CF_RECORD_ID_API": "DNS record ID"
  }
}
```

### Reviewer Configuration

```json
{
  "reviewers": [
    {
      "type": "User",
      "username": "github-username"  // GitHub username (not display name)
    }
  ]
}
```

**How to find GitHub usernames:**
```powershell
# Your own username
gh api user | jq -r '.login'

# Search for team members
gh api search/users?q=email:name@company.com | jq -r '.items[0].login'
```

### Protection Rules

```json
{
  "protection": {
    "wait_timer": 0,                    // Minutes to wait before deployment
    "protected_branches_only": true     // Restrict to main/release/* branches
  }
}
```

---

## Troubleshooting

### "gh: command not found"
```powershell
# Install GitHub CLI
winget install GitHub.cli

# Or download from: https://cli.github.com/
```

### "Authentication required"
```powershell
gh auth login
# Follow prompts to authenticate
```

### "Failed to set secret"
```powershell
# Check permissions
gh api user | jq -r '.login'

# Verify you have admin access to repo
gh repo view --json permissions
```

### "Config file not found"
```powershell
# Script auto-generates template on first run
.\setup-github-automated.ps1

# Edit the generated github-config.json
code github-config.json
```

### "Placeholder values detected"
The automated script skips secrets with:
- `YOUR` in the value
- `your-` prefix
- `10.0.0.*` IPs

**Solution:** Update `github-config.json` with actual values

---

## Verification

After running either script:

**Check secrets:**
```powershell
gh secret list
# Should show 12 secrets
```

**Check environments:**
```powershell
gh api repos/OWNER/REPO/environments | jq -r '.environments[].name'
# Should show: production-us-east, production-eu-west, production-apac-se
```

**Verify protection rules:**
```
Visit: https://github.com/OWNER/REPO/settings/environments
Each environment should show:
  ✓ Required reviewers configured
  ✓ Deployment branches: protected branches only
```

---

## Next Steps After Configuration

1. **Test deployment:**
   ```powershell
   gh workflow run multi-region-deployment-with-monitoring.yml `
     -f regions=us `
     -f deployment_strategy=sequential
   ```

2. **Monitor run:**
   ```powershell
   gh run watch
   ```

3. **Check Slack:** Verify notifications arrive in #deployments

4. **Review docs:**
   - `DEPLOYMENT_QUICK_REFERENCE.md` - Day-of deployment card
   - `PRODUCTION_READINESS_CHECKLIST.md` - Pre-deployment validation

---

## Security Best Practices

### DO ✅
- Store `github-config.json` in **private** location
- Use `.gitignore` to exclude config file from commits
- Rotate secrets regularly (every 90 days)
- Use environment-specific secrets when possible
- Audit secret access logs monthly

### DON'T ❌
- Commit `github-config.json` with real secrets to Git
- Share webhook URLs in public channels
- Use same secrets across staging and production
- Grant admin access to service accounts unnecessarily

---

## Template for Teams

Create this as `.github/github-config.template.json` (safe to commit):

```json
{
  "secrets": {
    "SLACK_WEBHOOK_URL": "GET_FROM_SLACK_ADMIN",
    "GLOBAL_SLACK_WEBHOOK": "GET_FROM_SLACK_ADMIN",
    "TEAMS_WEBHOOK_URL": "OPTIONAL",
    "DROPLET_IP_GREEN": "GET_FROM_DIGITALOCEAN",
    "DROPLET_IP_BLUE": "GET_FROM_DIGITALOCEAN",
    "LB_IP": "GET_FROM_DIGITALOCEAN",
    "DROPLET_USER": "deploy",
    "PROMETHEUS_PUSHGATEWAY_URL": "GET_FROM_SRE",
    "CF_ZONE_ID": "GET_FROM_CLOUDFLARE",
    "CF_API_TOKEN": "GET_FROM_CLOUDFLARE",
    "CF_RECORD_ID_API": "GET_FROM_CLOUDFLARE",
    "GRAFANA_API_KEY": "GET_FROM_SRE"
  },
  "reviewers": [
    { "type": "User", "username": "FUNCTIONAL_LEAD_GITHUB_USERNAME" },
    { "type": "User", "username": "SRE_LEAD_GITHUB_USERNAME" }
  ],
  "protection": {
    "wait_timer": 0,
    "protected_branches_only": true
  }
}
```

**Team members can then:**
```powershell
# Copy template
cp .github/github-config.template.json github-config.json

# Fill in actual values
code github-config.json

# Run setup
.\setup-github-automated.ps1
```

---

**Ready to automate your GitHub configuration!** 🚀
