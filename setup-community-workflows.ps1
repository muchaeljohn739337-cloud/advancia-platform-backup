# PowerShell script to set up community workflows
# Requires: GitHub CLI (gh) installed and authenticated
# Run: .\setup-community-workflows.ps1

param(
    [string]$Organization = "advancia-platform-org",
    [string]$Repository = "advancia-community",
    [switch]$Force = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Setting up community workflows for $Organization/$Repository" -ForegroundColor Green

# Check if GitHub CLI is installed
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI (gh) is not installed. Please install it first." -ForegroundColor Red
    Write-Host "   Visit: https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

# Check if authenticated
try {
    $authStatus = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Not authenticated"
    }
} catch {
    Write-Host "❌ Not authenticated with GitHub CLI. Please run 'gh auth login' first." -ForegroundColor Red
    exit 1
}

$RepoUrl = "https://github.com/$Organization/$Repository"
$TempDir = [System.IO.Path]::GetTempPath() + [System.Guid]::NewGuid().ToString()

Write-Host "📂 Working in temporary directory: $TempDir" -ForegroundColor Cyan

try {
    New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
    Set-Location $TempDir

    # Clone the community repo
    Write-Host "📥 Cloning repository..." -ForegroundColor Cyan
    git clone $RepoUrl 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to clone repository"
    }

    Set-Location $Repository

    # Create workflows directory
    New-Item -ItemType Directory -Path ".github/workflows" -Force | Out-Null

    Write-Host "📝 Creating community workflows..." -ForegroundColor Cyan

    # Define workflow content
    $WelcomeWorkflow = @'
name: 👋 Welcome Bot

on:
  issues:
    types: [opened]
  pull_request:
    types: [opened]
  discussion:
    types: [created]

jobs:
  welcome:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      pull-requests: write
      discussions: write
    steps:
      - name: 👋 Welcome new contributor
        uses: actions/github-script@v7
        with:
          script: |
            const { owner, repo } = context.repo;
            const issueOrPr = context.payload.issue || context.payload.pull_request;
            const discussion = context.payload.discussion;

            let welcomeMessage = "";
            let issueNumber = null;

            if (issueOrPr) {
              issueNumber = issueOrPr.number;
              const isIssue = !!context.payload.issue;
              welcomeMessage = `
                👋 **Welcome to the Advancia community!**

                Thank you for ${isIssue ? 'opening this issue' : 'submitting this pull request'}! 🎉

                ${isIssue ?
                  '🐛 Our team will review your issue and get back to you soon.' :
                  '🔍 Our maintainers will review your changes and provide feedback.'
                }

                **New to our community?** Check out:
                - 📚 [Documentation](https://docs.advancia.com)
                - 💬 [Community Guidelines](https://github.com/${owner}/${repo}/blob/main/CODE_OF_CONDUCT.md)
                - 🚀 [Contributing Guide](https://github.com/${owner}/${repo}/blob/main/CONTRIBUTING.md)

                **Questions?** Feel free to ask in our [Discussions](https://github.com/${owner}/${repo}/discussions) 💭
              `;

              await github.rest.issues.createComment({
                owner,
                repo,
                issue_number: issueNumber,
                body: welcomeMessage
              });
            }
'@

    $AutoAssignWorkflow = @'
name: 🤖 Auto Assign Moderators

on:
  issues:
    types: [opened]
  pull_request:
    types: [opened]

jobs:
  auto-assign:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      pull-requests: write
    steps:
      - name: 🎯 Auto-assign to moderators
        uses: pozil/auto-assign-issue@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          assignees: |
            muchaeljohn739337-cloud
          numOfAssignee: 1
'@

    $StaleWorkflow = @'
name: 🧹 Stale Issue Management

on:
  schedule:
    - cron: '30 1 * * *'
  workflow_dispatch:

jobs:
  stale:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      pull-requests: write
    steps:
      - uses: actions/stale@v8
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          stale-issue-message: |
            👋 This issue has been automatically marked as stale because it has not had recent activity.

            **What happens next?**
            - If this is still relevant, please add a comment to keep it active
            - Otherwise, it will be closed in 7 days

            Thank you for your contributions to Advancia! 🙏
          stale-pr-message: |
            👋 This pull request has been automatically marked as stale because it has not had recent activity.

            **What happens next?**
            - Please rebase and resolve any conflicts
            - Add a comment if you're still working on this
            - Otherwise, it will be closed in 7 days

            Thank you for your contribution! 🚀
          close-issue-message: |
            🔒 This issue has been automatically closed due to inactivity.

            **Need to reopen?** Just comment on this issue and we'll take another look!
          close-pr-message: |
            🔒 This pull request has been automatically closed due to inactivity.

            **Want to continue?** Feel free to reopen this PR when you're ready to continue!
          stale-issue-label: 'stale'
          stale-pr-label: 'stale'
          exempt-issue-labels: 'pinned,security,enhancement'
          exempt-pr-labels: 'pinned,security'
          days-before-stale: 30
          days-before-close: 7
'@

    # Write workflow files
    $WelcomeWorkflow | Out-File -FilePath ".github/workflows/welcome.yml" -Encoding UTF8
    $AutoAssignWorkflow | Out-File -FilePath ".github/workflows/auto-assign.yml" -Encoding UTF8
    $StaleWorkflow | Out-File -FilePath ".github/workflows/stale.yml" -Encoding UTF8

    Write-Host "✅ Created workflow files:" -ForegroundColor Green
    Write-Host "   - welcome.yml" -ForegroundColor White
    Write-Host "   - auto-assign.yml" -ForegroundColor White
    Write-Host "   - stale.yml" -ForegroundColor White

    # Stage changes
    git add .github/workflows/
    git status

    Write-Host ""
    if ($Force) {
        $commit = $true
    } else {
        $response = Read-Host "📤 Do you want to commit and push these workflows? (y/N)"
        $commit = $response -match "^[Yy]"
    }

    if ($commit) {
        git commit -m "🤖 Add community workflows for automated community management"
        git push origin main
        Write-Host "✅ Workflows have been pushed to $Repository!" -ForegroundColor Green
    } else {
        Write-Host "⏸️  Changes staged but not pushed. Run 'git commit && git push' when ready." -ForegroundColor Yellow
    }

} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Cleanup
    if (Test-Path $TempDir) {
        Set-Location $env:USERPROFILE
        Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "🎉 Community workflows setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. 🏷️  Create labels in your repository" -ForegroundColor White
Write-Host "   2. 📝 Add CODE_OF_CONDUCT.md and CONTRIBUTING.md" -ForegroundColor White
Write-Host "   3. 🔧 Customize moderator usernames in auto-assign.yml" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Repository: $RepoUrl" -ForegroundColor Blue
