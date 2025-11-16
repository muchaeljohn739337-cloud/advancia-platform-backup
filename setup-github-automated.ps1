# GitHub Automated Configuration Script
# Provisions secrets and protection rules for multi-region deployment

param(
    [switch]$DryRun,
    [switch]$Interactive,
    [string]$ConfigFile = "github-config.json"
)

$ErrorActionPreference = "Stop"

# Colors
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

Write-Info "`n=== GitHub Automated Config Script ===`n"

# Check prerequisites
try {
    gh --version | Out-Null
    Write-Success "✓ GitHub CLI installed"
} catch {
    Write-Error "✗ GitHub CLI not found. Install from: https://cli.github.com/"
    exit 1
}

# Get repository info
try {
    $repoInfo = gh repo view --json nameWithOwner | ConvertFrom-Json
    $repoName = $repoInfo.nameWithOwner
    Write-Success "✓ Repository: $repoName"
} catch {
    Write-Error "✗ Failed to get repository info"
    exit 1
}

# Configuration
$environments = @("production-us-east", "production-eu-west", "production-apac-se")

# Load configuration from file if exists
if (Test-Path $ConfigFile) {
    Write-Info "Loading configuration from $ConfigFile"
    $config = Get-Content $ConfigFile | ConvertFrom-Json
    
    if ($config.secrets) {
        $secrets = @{}
        $config.secrets.PSObject.Properties | ForEach-Object {
            $secrets[$_.Name] = $_.Value
        }
    }
    
    if ($config.reviewers) {
        $reviewers = $config.reviewers
    }
} else {
    Write-Warning "Config file not found: $ConfigFile"
    Write-Info "Creating template configuration file..."
    
    # Create template config
    $template = @{
        secrets = @{
            SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
            GLOBAL_SLACK_WEBHOOK = "https://hooks.slack.com/services/YOUR/GLOBAL/URL"
            TEAMS_WEBHOOK_URL = "https://your-tenant.webhook.office.com/..."
            DROPLET_IP_GREEN = "10.0.0.1"
            DROPLET_IP_BLUE = "10.0.0.2"
            LB_IP = "10.0.0.3"
            DROPLET_USER = "deploy"
            PROMETHEUS_PUSHGATEWAY_URL = "http://pushgateway.monitoring.svc:9091"
            CF_ZONE_ID = "your-zone-id"
            CF_API_TOKEN = "your-api-token"
            CF_RECORD_ID_API = "your-record-id"
            GRAFANA_API_KEY = "your-grafana-key"
        }
        reviewers = @(
            @{ type = "User"; username = "functional-lead" }
            @{ type = "User"; username = "sre-lead" }
        )
        protection = @{
            wait_timer = 0
            protected_branches_only = $true
        }
    } | ConvertTo-Json -Depth 10
    
    $template | Out-File $ConfigFile -Encoding UTF8
    Write-Success "✓ Created template: $ConfigFile"
    Write-Info "  Edit this file with your actual values, then re-run the script`n"
    exit 0
}

Write-Info "`n=== Creating Environments ===`n"

foreach ($env in $environments) {
    Write-Info "Environment: $env"
    
    if ($DryRun) {
        Write-Warning "  [DRY RUN] Would create environment: $env"
    } else {
        try {
            # Create environment with protection rules
            $protectionRules = @{
                wait_timer = 0
                reviewers = @()
                deployment_branch_policy = @{
                    protected_branches = $true
                    custom_branch_policies = $false
                }
            } | ConvertTo-Json -Depth 10
            
            $protectionRules | gh api "repos/$repoName/environments/$env" `
                --method PUT `
                --input - `
                -H "Accept: application/vnd.github+json" 2>&1 | Out-Null
            
            Write-Success "  ✓ Created: $env"
        } catch {
            Write-Warning "  ⚠ May already exist: $env"
        }
    }
}

Write-Info "`n=== Configuring Secrets ===`n"

$secretsConfigured = 0
$secretsSkipped = 0

foreach ($secretName in $secrets.Keys | Sort-Object) {
    $secretValue = $secrets[$secretName]
    
    Write-Host "[$($secretsConfigured + $secretsSkipped + 1)/$($secrets.Count)] $secretName" -ForegroundColor Cyan
    
    if ($DryRun) {
        Write-Warning "  [DRY RUN] Would set: $secretName"
        continue
    }
    
    # Skip placeholder values
    if ($secretValue -like "*YOUR*" -or $secretValue -like "*your-*" -or $secretValue -like "10.0.0.*") {
        Write-Warning "  Skipped (placeholder value detected)"
        $secretsSkipped++
        continue
    }
    
    try {
        # Set repository secret (available to all environments)
        $secretValue | gh secret set $secretName
        Write-Success "  ✓ Configured: $secretName"
        $secretsConfigured++
    } catch {
        Write-Error "  ✗ Failed: $_"
        $secretsSkipped++
    }
}

Write-Info "`n=== Configuring Environment Protection ===`n"

if ($config.reviewers -and $config.reviewers.Count -gt 0) {
    foreach ($env in $environments) {
        Write-Info "Environment: $env"
        
        if ($DryRun) {
            Write-Warning "  [DRY RUN] Would configure protection rules"
            continue
        }
        
        try {
            # Get reviewer IDs
            $reviewerIds = @()
            foreach ($reviewer in $config.reviewers) {
                if ($reviewer.type -eq "User") {
                    $userInfo = gh api "users/$($reviewer.username)" | ConvertFrom-Json
                    $reviewerIds += @{
                        type = "User"
                        id = $userInfo.id
                    }
                }
            }
            
            if ($reviewerIds.Count -gt 0) {
                $protectionUpdate = @{
                    reviewers = $reviewerIds
                    wait_timer = $config.protection.wait_timer
                    deployment_branch_policy = @{
                        protected_branches = $config.protection.protected_branches_only
                        custom_branch_policies = $false
                    }
                } | ConvertTo-Json -Depth 10
                
                $protectionUpdate | gh api "repos/$repoName/environments/$env" `
                    --method PUT `
                    --input - `
                    -H "Accept: application/vnd.github+json" 2>&1 | Out-Null
                
                Write-Success "  ✓ Protection rules configured"
            }
        } catch {
            Write-Warning "  ⚠ Failed to configure protection: $_"
        }
    }
} else {
    Write-Warning "No reviewers configured in $ConfigFile"
    Write-Info "  Add reviewers manually: https://github.com/$repoName/settings/environments"
}

Write-Info "`n=== Summary ===`n"
Write-Success "Secrets configured: $secretsConfigured / $($secrets.Count)"
Write-Warning "Secrets skipped: $secretsSkipped"
Write-Info "Environments created: $($environments.Count)"

Write-Info "`n=== Next Steps ===`n"
Write-Host "1. Verify environments: https://github.com/$repoName/settings/environments"
Write-Host "2. Add reviewers if not auto-configured"
Write-Host "3. Test deployment:`n"
Write-Host "   gh workflow run multi-region-deployment-with-monitoring.yml ``" -ForegroundColor Gray
Write-Host "     -f regions=us ``" -ForegroundColor Gray
Write-Host "     -f deployment_strategy=sequential" -ForegroundColor Gray
Write-Host ""
Write-Success "✓ Configuration complete!`n"
