# GitHub Automation Guide
## Automated Environment & Secrets Provisioning

Complete guide for using the automated GitHub setup system.

---

## 📋 Overview

This automation system provisions GitHub environments, secrets, and protection rules automatically using:

- **PowerShell Script**: `setup-github-automated.ps1` - Local execution
- **GitHub Actions Workflow**: `.github/workflows/setup-github-environments.yml` - Cloud execution
- **Configuration File**: `github-config.json` - Centralized config (gitignored for security)

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Create Configuration File

```powershell
# Copy the example template
cp github-config.json.example github-config.json

# Edit with your editor
code github-config.json
```

### Step 2: Update Configuration Values

Replace all placeholder values:

```json
{
  "environments": [
    "production-us-east",
    "production-eu-west", 
    "production-apac-se"
  ],
  "secrets": {
    "SLACK_WEBHOOK_URL": "https://hooks.slack.com/services/YOUR/REAL/WEBHOOK",
    "DROPLET_IP_GREEN": "your-real-ip",
    // ... update all values
  },
  "reviewers": [
    { "type": "User", "username": "your-github-username" },
    { "type": "User", "username": "teammate-username" }
  ]
}
```

### Step 3: Test with Dry Run

```powershell
.\setup-github-automated.ps1 -DryRun
```

**Expected output:**
- Lists all environments that would be created
- Shows all secrets that would be configured
- Displays reviewer IDs that would be fetched
- Previews protection rules that would be applied

### Step 4: Apply Changes

```powershell
.\setup-github-automated.ps1
```

**Result:**
- 3 environments created
- 12 secrets configured per environment (36 total)
- Reviewer protection rules applied
- Wait timers and branch policies configured

---

## 🎯 Usage Methods

### Method 1: Local PowerShell Script

**Advantages:**
- Fast execution
- Immediate feedback
- Easy debugging
- Works offline (once gh CLI authenticated)

**Commands:**

```powershell
# Preview without changes
.\setup-github-automated.ps1 -DryRun

# Apply changes
.\setup-github-automated.ps1

# Use custom config file
.\setup-github-automated.ps1 -ConfigFile custom-config.json

# Get help
.\setup-github-automated.ps1 -?
```

### Method 2: GitHub Actions Workflow

**Advantages:**
- Cloud execution (no local setup needed)
- Audit trail (workflow runs logged)
- Team collaboration (anyone with repo access)
- Scheduled execution possible

**Steps:**

1. Commit `github-config.json` to repository (or use example)
2. Go to: GitHub → Actions → "Setup GitHub Environments"
3. Click "Run workflow"
4. Configure inputs:
   - **dry_run**: `true` (preview) or `false` (apply)
   - **config_file**: `github-config.json` (default)
5. Click "Run workflow"
6. Monitor execution in real-time

**Trigger manually:**

```bash
gh workflow run setup-github-environments.yml \
  -f dry_run=true \
  -f config_file=github-config.json
```

---

## 📝 Configuration File Reference

### Structure

```json
{
  "environments": ["array", "of", "environment", "names"],
  "secrets": {
    "SECRET_NAME": "secret-value"
  },
  "reviewers": [
    { "type": "User", "username": "github-username" },
    { "type": "Team", "org": "org-name", "team": "team-slug" }
  ],
  "protection": {
    "wait_timer": 30,
    "protected_branches_only": true,
    "custom_branch_patterns": ["main", "release/*"]
  }
}
```

### Environments

**Purpose:** Define which GitHub environments to create/configure

**Example:**
```json
"environments": [
  "production-us-east",
  "production-eu-west",
  "production-apac-se",
  "staging",
  "development"
]
```

**Naming Conventions:**
- Use descriptive names: `production-<region>`, `staging`, `dev`
- Lowercase with hyphens (no underscores or spaces)
- Match your deployment workflow expectations

### Secrets

**Purpose:** Define secrets to create in each environment

**All Available Secrets:**

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `SLACK_WEBHOOK_URL` | Incident Quick Cards | `https://hooks.slack.com/services/XXX` |
| `GLOBAL_SLACK_WEBHOOK` | Deployment summaries | `https://hooks.slack.com/services/YYY` |
| `TEAMS_WEBHOOK_URL` | Microsoft Teams (optional) | `https://outlook.webhook.office.com/...` |
| `DROPLET_IP_GREEN` | Green environment IP | `10.0.1.100` |
| `DROPLET_IP_BLUE` | Blue environment IP | `10.0.1.101` |
| `LB_IP` | Load balancer IP | `10.0.1.10` |
| `DROPLET_USER` | SSH deployment user | `deploy` |
| `PROMETHEUS_PUSHGATEWAY_URL` | Metrics endpoint | `http://pushgateway.monitoring:9091` |
| `CF_ZONE_ID` | Cloudflare zone ID | `abc123def456` |
| `CF_API_TOKEN` | Cloudflare API token | `token-string` |
| `CF_RECORD_ID_API` | DNS record ID | `record-id-string` |
| `GRAFANA_API_KEY` | Grafana API key | `eyJrIjoi...` |

**Adding Custom Secrets:**

```json
"secrets": {
  "CUSTOM_API_KEY": "your-api-key",
  "DATABASE_URL": "postgresql://..."
}
```

### Reviewers

**Purpose:** Define who must approve deployments to each environment

**User Reviewer:**
```json
{
  "type": "User",
  "username": "john-doe"
}
```

**Team Reviewer:**
```json
{
  "type": "Team",
  "org": "your-org-name",
  "team": "release-team"
}
```

**Multiple Reviewers Example:**
```json
"reviewers": [
  { "type": "User", "username": "functional-lead" },
  { "type": "User", "username": "sre-oncall" },
  { "type": "Team", "org": "advancia", "team": "platform-team" }
]
```

**How It Works:**
- Script fetches GitHub user/team IDs automatically
- IDs are used to configure environment protection rules
- All reviewers must approve before deployment proceeds

**Getting Reviewer IDs Manually (if needed):**

```powershell
# Get user ID
gh api users/username --jq '.id'

# Get team ID
gh api orgs/org-name/teams/team-slug --jq '.id'
```

### Protection Rules

**Purpose:** Configure deployment protection policies

**Options:**

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `wait_timer` | number | `30` | Minutes to wait before deployment (0-43200) |
| `protected_branches_only` | boolean | `true` | Only allow deploys from protected branches |
| `custom_branch_patterns` | array | `["main", "release/*"]` | Custom branch patterns (if `protected_branches_only` = false) |

**Example Configurations:**

**Strict (Production):**
```json
"protection": {
  "wait_timer": 30,
  "protected_branches_only": true
}
```

**Flexible (Staging):**
```json
"protection": {
  "wait_timer": 0,
  "protected_branches_only": false,
  "custom_branch_patterns": ["main", "staging", "feature/*"]
}
```

---

## 🔧 Advanced Usage

### Multiple Configuration Files

Create different configs for different scenarios:

```powershell
# Production config
.\setup-github-automated.ps1 -ConfigFile github-config-prod.json

# Staging config
.\setup-github-automated.ps1 -ConfigFile github-config-staging.json
```

### Environment-Specific Secrets

Use different config files with environment-specific values:

```json
// github-config-us.json
{
  "environments": ["production-us-east"],
  "secrets": {
    "DROPLET_IP_GREEN": "us-specific-ip",
    "CF_ZONE_ID": "us-zone-id"
  }
}

// github-config-eu.json
{
  "environments": ["production-eu-west"],
  "secrets": {
    "DROPLET_IP_GREEN": "eu-specific-ip",
    "CF_ZONE_ID": "eu-zone-id"
  }
}
```

### Updating Existing Secrets

To update secrets:

1. Edit `github-config.json` with new values
2. Run script again: `.\setup-github-automated.ps1`
3. Script will overwrite existing secrets

**Or update individual secrets:**

```powershell
# Update single secret
echo "new-value" | gh secret set SECRET_NAME --env production-us-east

# Delete secret
gh secret delete SECRET_NAME --env production-us-east
```

### Removing Environments

**Manual removal (GitHub UI):**
1. Go to: Settings → Environments
2. Click environment name
3. Click "Delete environment"

**Using GitHub CLI:**
```powershell
gh api repos/OWNER/REPO/environments/ENV-NAME --method DELETE
```

---

## 🔍 Troubleshooting

### Issue: "GitHub CLI not found"

**Solution:**
```powershell
# Install GitHub CLI
winget install --id GitHub.cli

# Verify installation
gh --version

# Authenticate
gh auth login
```

### Issue: "Not authenticated"

**Solution:**
```powershell
# Re-authenticate
gh auth login

# Verify status
gh auth status

# Check token permissions (needs: repo, workflow, admin:org for teams)
```

### Issue: "Failed to fetch user/team ID"

**Possible Causes:**
- Username/team name incorrect
- User doesn't exist or is private
- Team requires org admin permissions
- Not authenticated with correct org

**Solution:**
```powershell
# Verify user exists
gh api users/USERNAME

# Verify team exists
gh api orgs/ORG/teams/TEAM

# Check your access
gh api user/orgs
```

### Issue: "Failed to set secret"

**Possible Causes:**
- Secret value too long (max 64KB)
- Environment doesn't exist
- Insufficient permissions

**Solution:**
```powershell
# Check environment exists
gh api repos/OWNER/REPO/environments

# Verify permissions
gh api repos/OWNER/REPO --jq '.permissions'

# Test secret creation manually
echo "test-value" | gh secret set TEST_SECRET
```

### Issue: "Config file not found"

**Solution:**
```powershell
# Check current directory
Get-Location

# List files
Get-ChildItem -Filter "*.json"

# Use absolute path
.\setup-github-automated.ps1 -ConfigFile "C:\full\path\to\config.json"
```

### Issue: "Invalid JSON in config file"

**Solution:**
```powershell
# Validate JSON
Get-Content github-config.json -Raw | ConvertFrom-Json

# Common issues:
# - Missing comma between items
# - Trailing comma on last item
# - Unescaped backslashes in values
# - Missing quotes around keys/values

# Use JSON formatter: https://jsonlint.com/
```

---

## 🔐 Security Best Practices

### 1. Never Commit Real Secrets

```powershell
# Verify github-config.json is in .gitignore
Get-Content .gitignore | Select-String "github-config.json"

# Check if accidentally committed
git ls-files | Select-String "github-config.json"

# If committed, remove from history
git rm --cached github-config.json
git commit -m "Remove config with secrets"
```

### 2. Use Environment Variables for Sensitive Data

Instead of hardcoding in JSON:

```json
"secrets": {
  "API_KEY": "${env:API_KEY}"
}
```

```powershell
$env:API_KEY = "real-api-key"
.\setup-github-automated.ps1
```

### 3. Rotate Secrets Regularly

```powershell
# Update config with new values
code github-config.json

# Apply changes
.\setup-github-automated.ps1

# Verify in GitHub UI
# Settings → Secrets → Actions
```

### 4. Limit Reviewer Access

- Only add trusted users/teams as reviewers
- Use teams for easier management
- Review environment protection logs regularly

### 5. Audit Trail

```powershell
# View recent GitHub Actions runs
gh run list --workflow=setup-github-environments.yml --limit 10

# View specific run details
gh run view RUN_ID --log

# Check who made changes
gh api repos/OWNER/REPO/environments/ENV-NAME
```

---

## 📊 Monitoring & Verification

### Verify Environments Created

```powershell
# List all environments
gh api repos/OWNER/REPO/environments --jq '.environments[].name'

# View specific environment
gh api repos/OWNER/REPO/environments/production-us-east
```

### Verify Secrets Configured

```powershell
# List all secrets (values hidden)
gh secret list

# List secrets for specific environment
gh secret list --env production-us-east
```

### Verify Protection Rules

```powershell
# Get environment protection rules
gh api repos/OWNER/REPO/environments/production-us-east \
  --jq '.protection_rules'

# Expected output:
# [
#   {
#     "type": "required_reviewers",
#     "reviewers": [...]
#   },
#   {
#     "type": "wait_timer",
#     "wait_timer": 30
#   }
# ]
```

### Test Deployment Flow

```powershell
# Trigger test deployment
gh workflow run multi-region-deployment-with-monitoring.yml \
  -f regions=us \
  -f deployment_strategy=sequential

# Monitor run
gh run watch

# Verify approval requested
# GitHub → Actions → Deployment → Review deployments
```

---

## 🎯 Complete Example

**Scenario:** Configure production environments for multi-region deployment

```powershell
# Step 1: Create config file
cp github-config.json.example github-config.json

# Step 2: Edit with real values
code github-config.json
```

```json
{
  "environments": [
    "production-us-east",
    "production-eu-west",
    "production-apac-se"
  ],
  "secrets": {
    "SLACK_WEBHOOK_URL": "https://hooks.slack.com/services/T123/B456/abc",
    "GLOBAL_SLACK_WEBHOOK": "https://hooks.slack.com/services/T123/B789/def",
    "DROPLET_IP_GREEN": "192.168.1.10",
    "DROPLET_IP_BLUE": "192.168.1.11",
    "LB_IP": "192.168.1.1",
    "DROPLET_USER": "deploy",
    "PROMETHEUS_PUSHGATEWAY_URL": "http://prometheus:9091",
    "CF_ZONE_ID": "abc123",
    "CF_API_TOKEN": "token-xyz",
    "CF_RECORD_ID_API": "record-123",
    "GRAFANA_API_KEY": "eyJrIjoikey"
  },
  "reviewers": [
    { "type": "User", "username": "jane-functional-lead" },
    { "type": "User", "username": "john-sre" },
    { "type": "Team", "org": "advancia", "team": "release-managers" }
  ],
  "protection": {
    "wait_timer": 30,
    "protected_branches_only": true
  }
}
```

```powershell
# Step 3: Test with dry run
.\setup-github-automated.ps1 -DryRun

# Output:
# Would create environment: production-us-east
# Would set secret: SLACK_WEBHOOK_URL
# Would fetch ID for user: jane-functional-lead (ID: 12345)
# Would configure protection with 3 reviewer(s)

# Step 4: Apply changes
.\setup-github-automated.ps1

# Output:
# ✓ Environment created: production-us-east
# ✓ Set: SLACK_WEBHOOK_URL
# ✓ User: jane-functional-lead (ID: 12345)
# ✓ Protection rules applied

# Step 5: Verify
gh api repos/advancia/-modular-saas-platform/environments --jq '.environments[].name'

# Output:
# production-us-east
# production-eu-west
# production-apac-se
```

---

## 📚 Related Documentation

- **Main Setup**: `setup-github-config.ps1` - Manual interactive setup
- **Webhook Guide**: `WEBHOOK_CONFIGURATION_GUIDE.md` - Slack/Teams webhooks
- **Quick Start**: `QUICK_START_DEPLOYMENT.md` - Complete deployment guide
- **Checklist**: `SETUP_CHECKLIST_POSTER.md` - Print & track progress

---

**Your GitHub environments are now fully automated!** 🚀
