# GitHub Environments and Secrets Setup Script
# Run this script to configure your repository for multi-region deployment

param(
    [switch]$DryRun,
    [switch]$SkipEnvironments,
    [switch]$SkipSecrets,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
GitHub Configuration Setup Script

Usage:
  .\setup-github-config.ps1 [-DryRun] [-SkipEnvironments] [-SkipSecrets]

Parameters:
  -DryRun            Show commands without executing them
  -SkipEnvironments  Skip environment creation
  -SkipSecrets       Skip secrets configuration
  -Help              Show this help message

Prerequisites:
  - GitHub CLI (gh) installed and authenticated
  - Repository owner/admin permissions
  - Slack webhook URL ready
  - DigitalOcean credentials ready
  - Cloudflare API tokens ready

"@
    exit 0
}

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

# Check prerequisites
Write-Info "`n=== Checking Prerequisites ===`n"

# Check if gh CLI is installed
try {
    $ghVersion = gh --version 2>&1 | Select-Object -First 1
    Write-Success "✓ GitHub CLI installed: $ghVersion"
} catch {
    Write-Error "✗ GitHub CLI not found. Install from: https://cli.github.com/"
    exit 1
}

# Check if authenticated
try {
    $ghUser = gh auth status 2>&1 | Select-String "Logged in"
    if ($ghUser) {
        Write-Success "✓ GitHub CLI authenticated"
    } else {
        Write-Error "✗ Not authenticated. Run: gh auth login"
        exit 1
    }
} catch {
    Write-Error "✗ Authentication check failed. Run: gh auth login"
    exit 1
}

# Get repository info
try {
    $repoInfo = gh repo view --json nameWithOwner,defaultBranchRef | ConvertFrom-Json
    $repoName = $repoInfo.nameWithOwner
    $defaultBranch = $repoInfo.defaultBranchRef.name
    Write-Success "✓ Repository: $repoName"
    Write-Success "✓ Default branch: $defaultBranch"
} catch {
    Write-Error "✗ Failed to get repository info. Are you in a git repository?"
    exit 1
}

Write-Info "`n=== Setup Configuration ===`n"

# Environment names
$environments = @(
    "production-us-east",
    "production-eu-west",
    "production-apac-se"
)

# Required secrets with descriptions
$secrets = @{
    "SLACK_WEBHOOK_URL" = "Slack webhook for incident Quick Cards"
    "GLOBAL_SLACK_WEBHOOK" = "Slack webhook for deployment summaries"
    "TEAMS_WEBHOOK_URL" = "Microsoft Teams webhook (optional)"
    "DROPLET_IP_GREEN" = "Green environment IP (new version)"
    "DROPLET_IP_BLUE" = "Blue environment IP (current production)"
    "LB_IP" = "Load balancer IP address"
    "DROPLET_USER" = "SSH user for deployment (e.g., deploy)"
    "PROMETHEUS_PUSHGATEWAY_URL" = "Prometheus Pushgateway endpoint"
    "CF_ZONE_ID" = "Cloudflare zone ID"
    "CF_API_TOKEN" = "Cloudflare API token"
    "CF_RECORD_ID_API" = "Cloudflare DNS record ID"
    "GRAFANA_API_KEY" = "Grafana API key for annotations"
}

# Create GitHub Environments
if (-not $SkipEnvironments) {
    Write-Info "`n=== Creating GitHub Environments ===`n"
    
    foreach ($env in $environments) {
        Write-Info "Creating environment: $env"
        
        if ($DryRun) {
            Write-Warning "[DRY RUN] Would create environment: $env"
        } else {
            try {
                # Create environment (requires GitHub API)
                $body = @{
                    wait_timer = 0
                    reviewers = @()
                    deployment_branch_policy = @{
                        protected_branches = $false
                        custom_branch_policies = $true
                    }
                } | ConvertTo-Json -Depth 10
                
                # Use PowerShell pipeline instead of bash heredoc
                $body | gh api "repos/$repoName/environments/$env" `
                    --method PUT `
                    --input - `
                    -H "Accept: application/vnd.github+json" 2>&1 | Out-Null
                
                Write-Success "  ✓ Created: $env"
            } catch {
                Write-Warning "  ⚠ Environment may already exist or error: $_"
            }
        }
    }
    
    Write-Info "`nNext steps for environments:"
    Write-Host "  1. Go to: https://github.com/$repoName/settings/environments"
    Write-Host "  2. For each environment ($($environments -join ', ')):"
    Write-Host "     • Add required reviewers (1 functional + 1 SRE)"
    Write-Host "     • Set deployment branches (main, release/*)"
    Write-Host "     • Configure wait timer if needed (0-43200 minutes)"
}

# Configure Secrets
if (-not $SkipSecrets) {
    Write-Info "`n=== Configuring Repository Secrets ===`n"
    
    Write-Warning "You will be prompted to enter values for each secret."
    Write-Warning "Press Ctrl+C to skip a secret or Enter to leave empty.`n"
    
    $secretsConfigured = 0
    $secretsSkipped = 0
    
    foreach ($secretName in $secrets.Keys | Sort-Object) {
        $description = $secrets[$secretName]
        Write-Host "`n[$($secretsConfigured + $secretsSkipped + 1)/$($secrets.Count)] $secretName" -ForegroundColor Cyan
        Write-Host "    Description: $description" -ForegroundColor Gray
        
        if ($DryRun) {
            Write-Warning "    [DRY RUN] Would prompt for secret value"
            continue
        }
        
        # Check if secret already exists
        try {
            $existing = gh secret list | Select-String -Pattern "^$secretName\s"
            if ($existing) {
                Write-Host "    Status: Already exists" -ForegroundColor Yellow
                $overwrite = Read-Host "    Overwrite? (y/N)"
                if ($overwrite -ne 'y' -and $overwrite -ne 'Y') {
                    Write-Info "    Skipped"
                    $secretsSkipped++
                    continue
                }
            }
        } catch {
            # Secret doesn't exist, that's fine
        }
        
        # Prompt for secret value
        $secretValue = Read-Host "    Enter value (or press Enter to skip)" -AsSecureString
        $secretValuePlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretValue)
        )
        
        if ([string]::IsNullOrWhiteSpace($secretValuePlain)) {
            Write-Warning "    Skipped (empty value)"
            $secretsSkipped++
            continue
        }
        
        try {
            $secretValuePlain | gh secret set $secretName
            Write-Success "    ✓ Configured: $secretName"
            $secretsConfigured++
        } catch {
            Write-Error "    ✗ Failed to set secret: $_"
            $secretsSkipped++
        }
    }
    
    Write-Info "`n=== Secrets Summary ===`n"
    Write-Success "Configured: $secretsConfigured secrets"
    Write-Warning "Skipped: $secretsSkipped secrets"
    Write-Host "Total: $($secrets.Count) secrets`n"
}

# Slack Webhook Setup Guide
Write-Info "`n=== Slack Webhook Setup ===`n"
Write-Host @"
If you haven't configured Slack webhooks yet:

1. Go to: https://api.slack.com/apps
2. Create a new app or select existing app
3. Navigate to "Incoming Webhooks" and activate
4. Click "Add New Webhook to Workspace"
5. Select channel: #deployments (for success) and #incidents-deployments (for alerts)
6. Copy webhook URL (looks like: https://hooks.slack.com/services/XXX/YYY/ZZZ)
7. Run this script again to add SLACK_WEBHOOK_URL and GLOBAL_SLACK_WEBHOOK

For Microsoft Teams (optional):
1. Go to your Teams channel
2. Click ••• → Connectors → Incoming Webhook
3. Configure and copy webhook URL
4. Run this script again to add TEAMS_WEBHOOK_URL
"@

# DigitalOcean Setup Guide
Write-Info "`n=== DigitalOcean Setup ===`n"
Write-Host @"
To get your DigitalOcean droplet IPs:

1. Log in to: https://cloud.digitalocean.com/
2. Go to Droplets section
3. Find your droplets:
   • Green environment (new deployments): Copy IP → DROPLET_IP_GREEN
   • Blue environment (current production): Copy IP → DROPLET_IP_BLUE
   • Load balancer: Copy IP → LB_IP
4. Create deployment user:
   ssh root@<droplet-ip>
   adduser deploy
   usermod -aG sudo deploy
   mkdir -p /home/deploy/.ssh
   cp ~/.ssh/authorized_keys /home/deploy/.ssh/
   chown -R deploy:deploy /home/deploy/.ssh
5. Set DROPLET_USER=deploy
"@

# Cloudflare Setup Guide
Write-Info "`n=== Cloudflare Setup ===`n"
Write-Host @"
To get your Cloudflare credentials:

1. Log in to: https://dash.cloudflare.com/
2. Select your domain
3. Copy Zone ID from the right sidebar → CF_ZONE_ID
4. Create API Token:
   • Click "Get your API token" → Create Token
   • Use "Edit zone DNS" template
   • Zone Resources: Include → Specific zone → Your domain
   • Copy token → CF_API_TOKEN
5. Get DNS Record ID:
   curl -X GET "https://api.cloudflare.com/client/v4/zones/<CF_ZONE_ID>/dns_records" \
     -H "Authorization: Bearer <CF_API_TOKEN>" \
     -H "Content-Type: application/json"
   Find your API record and copy "id" → CF_RECORD_ID_API
"@

# Prometheus and Grafana Setup
Write-Info "`n=== Monitoring Setup ===`n"
Write-Host @"
Prometheus Pushgateway:
1. Deploy Prometheus Pushgateway (if not already running)
2. Get endpoint URL (e.g., http://pushgateway.monitoring.svc:9091)
3. Set PROMETHEUS_PUSHGATEWAY_URL

Grafana API Key:
1. Log in to Grafana: https://grafana.advancia.com
2. Go to Configuration → API Keys
3. Create new key:
   • Name: "GitHub Actions Deployment"
   • Role: Editor
   • Time to live: Never expire (or set expiration)
4. Copy key → GRAFANA_API_KEY
"@

# Test Deployment Command
Write-Info "`n=== Test Deployment ===`n"
Write-Host @"
After configuration is complete, test your deployment:

# Staging deployment (recommended first)
gh workflow run multi-region-deployment-with-monitoring.yml \
  -f regions=us \
  -f deployment_strategy=sequential

# Production deployment (delayed mode - safest)
gh workflow run multi-region-deployment-with-monitoring.yml \
  -f regions=all \
  -f deployment_strategy=delayed \
  -f delay_between_regions=90

# Monitor deployment
gh run list --workflow=multi-region-deployment-with-monitoring.yml --limit 5
gh run watch

# View logs
gh run view --log
"@

# Summary
Write-Info "`n=== Setup Complete ===`n"
Write-Success "✓ Prerequisites checked"
if (-not $SkipEnvironments) {
    Write-Success "✓ Environments created (configure reviewers manually)"
}
if (-not $SkipSecrets) {
    Write-Success "✓ Secrets configured: $secretsConfigured / $($secrets.Count)"
}

Write-Host "`nNext Steps:"
Write-Host "  1. Configure environment protection rules in GitHub UI"
Write-Host "  2. Add required reviewers (1 functional + 1 SRE per environment)"
Write-Host "  3. Configure Slack/Teams webhooks if not done"
Write-Host "  4. Review PRODUCTION_READINESS_CHECKLIST.md"
Write-Host "  5. Run test deployment to staging"
Write-Host "`nDocumentation:"
Write-Host "  • PRODUCTION_READINESS_CHECKLIST.md - Complete pre-deployment checklist"
Write-Host "  • DEPLOYMENT_QUICK_REFERENCE.md - Day-of deployment card"
Write-Host "  • DEPLOYMENT_LIFECYCLE.md - Configure → Deploy → Monitor → Celebrate"
Write-Host "`nReady to deploy! 🚀`n"
