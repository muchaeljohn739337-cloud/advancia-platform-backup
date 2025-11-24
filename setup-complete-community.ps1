# Complete Community Automation Setup for Windows
# This script handles everything: workflows, moderators, community files, and testing
# Run: .\setup-complete-community.ps1

param(
    [string]$Organization = "advancia-platform-org",
    [string]$Repository = "advancia-community",
    [string[]]$Moderators = @("muchaeljohn739337-cloud"),
    [int]$NumAssignees = 1,
    [switch]$Force = $false,
    [switch]$SkipTest = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Complete Community Automation Setup" -ForegroundColor Green
Write-Host "   Organization: $Organization" -ForegroundColor Cyan
Write-Host "   Repository: $Repository" -ForegroundColor Cyan
Write-Host "   Moderators: $($Moderators -join ', ')" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
function Test-Prerequisites {
    Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
        throw "GitHub CLI (gh) is not installed. Please install it from https://cli.github.com/"
    }

    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw "Git is not installed. Please install Git first."
    }

    # Check authentication
    try {
        $null = gh auth status 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Not authenticated"
        }
    } catch {
        throw "Not authenticated with GitHub CLI. Please run 'gh auth login' first."
    }

    Write-Host "✅ All prerequisites met" -ForegroundColor Green
}

# Setup repository
function Initialize-Repository {
    param([string]$TempDir)

    Write-Host "📥 Setting up repository..." -ForegroundColor Yellow

    $RepoUrl = "https://github.com/$Organization/$Repository"

    try {
        git clone $RepoUrl $TempDir 2>$null
        if ($LASTEXITCODE -ne 0) {
            # Repository might not exist, try to create it
            Write-Host "   Repository doesn't exist. Creating..." -ForegroundColor Yellow
            gh repo create "$Organization/$Repository" --public --description "Community repository for $Organization"

            # Initialize with README
            New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
            Set-Location $TempDir
            git init
            git remote add origin $RepoUrl

            "# $Repository" | Out-File -FilePath "README.md" -Encoding UTF8
            git add README.md
            git commit -m "Initial commit"
            git branch -M main
            git push -u origin main

            Write-Host "✅ Repository created successfully" -ForegroundColor Green
        }
    } catch {
        throw "Failed to setup repository: $_"
    }
}

# Create community files
function New-CommunityFiles {
    Write-Host "📝 Creating community files..." -ForegroundColor Yellow

    # Code of Conduct
    $CodeOfConduct = @'
# Code of Conduct

## Our Pledge

We are committed to fostering an open and welcoming environment for everyone, regardless of age, body size, disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

## Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

Examples of unacceptable behavior include:

- The use of sexualized language or imagery and unwelcome sexual attention or advances
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team. All complaints will be reviewed and investigated and will result in a response that is deemed necessary and appropriate to the circumstances.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant](https://www.contributor-covenant.org), version 2.0.
'@

    # Contributing Guidelines
    $Contributing = @'
# Contributing to Advancia Community

Thank you for your interest in contributing to our community! 🎉

## How to Get Started

1. **Join Discussions** - Start by participating in our [Discussions](../../discussions)
2. **Read the Code of Conduct** - Please review our [Code of Conduct](CODE_OF_CONDUCT.md)
3. **Explore Issues** - Check out our [Issues](../../issues) for ways to contribute

## Ways to Contribute

### 💬 Discussions
- Ask questions
- Share ideas and feedback
- Help answer questions from other community members
- Participate in community announcements

### 🐛 Issues
- Report bugs with detailed reproduction steps
- Suggest new features or improvements
- Help triage and respond to existing issues

### 🔄 Pull Requests
- Fix bugs or implement features
- Improve documentation
- Add examples or tutorials

## Contribution Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Make** your changes
4. **Commit** your changes (`git commit -m 'Add some amazing feature'`)
5. **Push** to the branch (`git push origin feature/amazing-feature`)
6. **Open** a Pull Request

## Guidelines

- **Be respectful** and constructive in all interactions
- **Search existing issues** and discussions before creating new ones
- **Provide clear descriptions** when reporting bugs or requesting features
- **Test your changes** before submitting pull requests
- **Follow existing code style** and conventions

## Community Support

- 💭 **Questions?** Use [Discussions](../../discussions) for general questions
- 🐛 **Bug Reports?** Create an [Issue](../../issues/new) with details
- 💡 **Feature Ideas?** Start a [Discussion](../../discussions) to gather feedback first

## Recognition

All contributors will be recognized in our community. Thank you for helping make this project better! 🙏

---

*By contributing, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).*
'@

    # Issue Templates
    $BugReportTemplate = @'
---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: ['bug']
assignees: ''
---

## 🐛 Bug Description
A clear and concise description of what the bug is.

## 🔄 Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## ✅ Expected Behavior
A clear description of what you expected to happen.

## ❌ Actual Behavior
A clear description of what actually happened.

## 📱 Environment
- OS: [e.g. Windows 11, macOS 12, Ubuntu 20.04]
- Browser: [e.g. Chrome 96, Firefox 95, Safari 15]
- Version: [e.g. 1.0.0]

## 📎 Additional Context
Add any other context about the problem here, including screenshots if applicable.
'@

    $FeatureRequestTemplate = @'
---
name: Feature Request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: ['enhancement']
assignees: ''
---

## 🚀 Feature Description
A clear and concise description of what you want to happen.

## 🎯 Problem Statement
Is your feature request related to a problem? Please describe the problem you're trying to solve.

## 💡 Proposed Solution
Describe the solution you'd like to see implemented.

## 🔄 Alternative Solutions
Describe any alternative solutions or features you've considered.

## 📋 Additional Context
Add any other context, mockups, or examples about the feature request here.
'@

    # Write files
    $CodeOfConduct | Out-File -FilePath "CODE_OF_CONDUCT.md" -Encoding UTF8
    $Contributing | Out-File -FilePath "CONTRIBUTING.md" -Encoding UTF8

    # Create issue templates directory
    New-Item -ItemType Directory -Path ".github/ISSUE_TEMPLATE" -Force | Out-Null
    $BugReportTemplate | Out-File -FilePath ".github/ISSUE_TEMPLATE/bug_report.md" -Encoding UTF8
    $FeatureRequestTemplate | Out-File -FilePath ".github/ISSUE_TEMPLATE/feature_request.md" -Encoding UTF8

    Write-Host "✅ Community files created" -ForegroundColor Green
}

# Create workflows
function New-CommunityWorkflows {
    param([string[]]$ModeratorList, [int]$AssigneeCount)

    Write-Host "🤖 Creating community workflows..." -ForegroundColor Yellow

    # Create workflows directory
    New-Item -ItemType Directory -Path ".github/workflows" -Force | Out-Null

    # Welcome Bot Workflow
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
              const isFirstTime = issueOrPr.author_association === 'FIRST_TIME_CONTRIBUTOR';

              welcomeMessage = `
                👋 **Welcome to the Advancia community!** ${isFirstTime ? '🎉 *This is your first contribution!*' : ''}

                Thank you for ${isIssue ? 'opening this issue' : 'submitting this pull request'}!

                ${isIssue ?
                  '🐛 Our team will review your issue and get back to you soon.' :
                  '🔍 Our maintainers will review your changes and provide feedback.'
                }

                **New to our community?** Check out:
                - 📚 [Contributing Guide](https://github.com/${owner}/${repo}/blob/main/CONTRIBUTING.md)
                - 💬 [Community Guidelines](https://github.com/${owner}/${repo}/blob/main/CODE_OF_CONDUCT.md)
                - 🚀 [Discussions](https://github.com/${owner}/${repo}/discussions)

                **Questions?** Feel free to ask in our [Discussions](https://github.com/${owner}/${repo}/discussions) 💭
              `;

              await github.rest.issues.createComment({
                owner,
                repo,
                issue_number: issueNumber,
                body: welcomeMessage
              });

              // Add labels for first-time contributors
              if (isFirstTime) {
                await github.rest.issues.addLabels({
                  owner,
                  repo,
                  issue_number: issueNumber,
                  labels: ['first-time-contributor']
                });
              }
            }

            // Handle discussions
            if (discussion) {
              const isFirstTime = discussion.author.type !== 'User' ||
                                context.payload.discussion.author_association === 'FIRST_TIME_CONTRIBUTOR';

              const discussionWelcome = `
                👋 **Welcome to our community discussion!** ${isFirstTime ? '🎉 *Great to have you here for the first time!*' : ''}

                Thank you for starting this conversation! Our community loves engaging discussions.

                **Tips for great discussions:**
                - 📝 Be clear and specific in your questions
                - 🔍 Search existing discussions first
                - 🤝 Be respectful and constructive
                - 🚀 Feel free to share your ideas and experiences

                **Community Resources:**
                - 📚 [Contributing Guide](https://github.com/${owner}/${repo}/blob/main/CONTRIBUTING.md)
                - 💬 [Code of Conduct](https://github.com/${owner}/${repo}/blob/main/CODE_OF_CONDUCT.md)

                Happy discussing! 💬
              `;

              // Note: GitHub Discussions API for comments might need different approach
              console.log('Discussion welcome message prepared:', discussionWelcome);
            }
'@

    # Auto-assign workflow with custom moderators
    $ModeratorsList = ($ModeratorList | ForEach-Object { "            $_" }) -join "`n"
    $AutoAssignWorkflow = @"
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
          repo-token: `${{ secrets.GITHUB_TOKEN }}
          assignees: |
$ModeratorsList
          numOfAssignee: $AssigneeCount
"@

    # Stale management workflow
    $StaleWorkflow = @'
name: 🧹 Stale Issue Management

on:
  schedule:
    - cron: '30 1 * * *'  # Daily at 1:30 AM UTC
  workflow_dispatch:       # Allow manual trigger

jobs:
  stale:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      pull-requests: write
    steps:
      - uses: actions/stale@v9
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          stale-issue-message: |
            👋 This issue has been automatically marked as stale because it has not had recent activity.

            **What happens next?**
            - If this is still relevant, please add a comment to keep it active
            - Otherwise, it will be closed in 7 days to help keep our issue list manageable

            Thank you for your contributions to our community! 🙏
          stale-pr-message: |
            👋 This pull request has been automatically marked as stale because it has not had recent activity.

            **What happens next?**
            - Please rebase and resolve any conflicts if needed
            - Add a comment if you're still working on this
            - Otherwise, it will be closed in 7 days

            Thank you for your contribution! 🚀
          close-issue-message: |
            🔒 This issue has been automatically closed due to inactivity.

            **Need to reopen?** Just comment on this issue and we'll take another look!
            Don't hesitate to create a new issue if this problem persists.
          close-pr-message: |
            🔒 This pull request has been automatically closed due to inactivity.

            **Want to continue?** Feel free to reopen this PR when you're ready to continue!
            Make sure to rebase against the current main branch.
          stale-issue-label: 'stale'
          stale-pr-label: 'stale'
          exempt-issue-labels: 'pinned,security,enhancement,good first issue'
          exempt-pr-labels: 'pinned,security,work-in-progress'
          days-before-stale: 30
          days-before-close: 7
          operations-per-run: 30
'@

    # Write workflow files
    $WelcomeWorkflow | Out-File -FilePath ".github/workflows/welcome.yml" -Encoding UTF8
    $AutoAssignWorkflow | Out-File -FilePath ".github/workflows/auto-assign.yml" -Encoding UTF8
    $StaleWorkflow | Out-File -FilePath ".github/workflows/stale.yml" -Encoding UTF8

    Write-Host "✅ Workflows created with custom moderators: $($ModeratorList -join ', ')" -ForegroundColor Green
}

# Test workflows
function Test-CommunitySetup {
    Write-Host "🧪 Testing community setup..." -ForegroundColor Yellow

    try {
        # Test if repository exists and is accessible
        $repoInfo = gh repo view "$Organization/$Repository" --json name,description,isPrivate | ConvertFrom-Json
        Write-Host "   ✅ Repository accessible: $($repoInfo.name)" -ForegroundColor Green

        # Check if workflows exist
        $workflows = gh workflow list --repo "$Organization/$Repository" --json name,path | ConvertFrom-Json
        $expectedWorkflows = @("👋 Welcome Bot", "🤖 Auto Assign Moderators", "🧹 Stale Issue Management")

        foreach ($expected in $expectedWorkflows) {
            if ($workflows | Where-Object { $_.name -eq $expected }) {
                Write-Host "   ✅ Workflow found: $expected" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️ Workflow missing: $expected" -ForegroundColor Yellow
            }
        }

        # Check community files
        $files = gh api "/repos/$Organization/$Repository/contents" | ConvertFrom-Json
        $expectedFiles = @("CODE_OF_CONDUCT.md", "CONTRIBUTING.md")

        foreach ($expected in $expectedFiles) {
            if ($files | Where-Object { $_.name -eq $expected }) {
                Write-Host "   ✅ Community file found: $expected" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️ Community file missing: $expected" -ForegroundColor Yellow
            }
        }

        Write-Host "✅ Testing complete!" -ForegroundColor Green

    } catch {
        Write-Host "⚠️ Testing encountered issues: $_" -ForegroundColor Yellow
    }
}

# Main execution
try {
    Test-Prerequisites

    $TempDir = [System.IO.Path]::GetTempPath() + "community-setup-" + [System.Guid]::NewGuid().ToString()
    Write-Host "📂 Working in: $TempDir" -ForegroundColor Cyan

    New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
    Set-Location $TempDir

    # Setup repository
    Initialize-Repository -TempDir $TempDir
    Set-Location $Repository

    # Create community files
    New-CommunityFiles

    # Create workflows with custom moderators
    New-CommunityWorkflows -ModeratorList $Moderators -AssigneeCount $NumAssignees

    # Stage all changes
    git add .
    git status

    Write-Host ""
    if ($Force) {
        $shouldCommit = $true
    } else {
        $response = Read-Host "📤 Commit and push all changes? (y/N)"
        $shouldCommit = $response -match "^[Yy]"
    }

    if ($shouldCommit) {
        git commit -m "🚀 Complete community setup: workflows, files, and templates"
        git push origin main
        Write-Host "✅ All changes pushed successfully!" -ForegroundColor Green

        # Test the setup
        if (-not $SkipTest) {
            Start-Sleep -Seconds 3  # Wait for GitHub to process
            Test-CommunitySetup
        }
    } else {
        Write-Host "⏸️ Changes staged but not committed." -ForegroundColor Yellow
        Write-Host "   Run 'git commit && git push' when ready." -ForegroundColor White
    }

} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Cleanup
    if (Test-Path $TempDir) {
        try {
            Set-Location $env:USERPROFILE
            Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
        } catch {
            Write-Host "⚠️ Could not clean up temp directory: $TempDir" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "🎉 Community setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 What was set up:" -ForegroundColor Cyan
Write-Host "   ✅ Repository created/configured" -ForegroundColor White
Write-Host "   ✅ Welcome bot for new contributors" -ForegroundColor White
Write-Host "   ✅ Auto-assignment to moderators: $($Moderators -join ', ')" -ForegroundColor White
Write-Host "   ✅ Stale issue management" -ForegroundColor White
Write-Host "   ✅ Code of Conduct and Contributing guidelines" -ForegroundColor White
Write-Host "   ✅ Issue templates for bugs and features" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "   1. 💬 Enable Discussions in repository settings" -ForegroundColor White
Write-Host "   2. 🏷️ Create repository labels if needed" -ForegroundColor White
Write-Host "   3. 🧪 Test by creating an issue or discussion" -ForegroundColor White
Write-Host "   4. 📈 Monitor workflow runs in the Actions tab" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Repository: https://github.com/$Organization/$Repository" -ForegroundColor Blue
