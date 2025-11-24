# PowerShell script for setting up scheduled community workflows
# Requires: GitHub CLI (gh) installed and authenticated
# Run: .\setup-community-scheduled.ps1

param(
    [string]$Organization = "advancia-platform-org",
    [string]$Repository = "advancia-community",
    [switch]$Force = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Setting up scheduled workflows for $Organization/$Repository" -ForegroundColor Green

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
        throw "Failed to clone repository. Please check organization and repository names."
    }

    Set-Location $Repository

    # Create workflows directory
    New-Item -ItemType Directory -Path ".github/workflows" -Force | Out-Null

    Write-Host "📝 Creating scheduled workflows..." -ForegroundColor Cyan

    # Weekly Announcement Workflow
    $WeeklyWorkflow = @'
name: 📢 Weekly Community Announcement

on:
  schedule:
    - cron: '0 15 * * 5'   # Every Friday at 3 PM UTC
  workflow_dispatch:        # Allow manual trigger
    inputs:
      custom_message:
        description: 'Custom message for the announcement'
        required: false
        default: ''

jobs:
  weekly-announcement:
    runs-on: ubuntu-latest
    permissions:
      discussions: write
      contents: read
    steps:
      - name: 📅 Get current date
        id: date
        run: echo "date=$(date +'%B %d, %Y')" >> $GITHUB_OUTPUT

      - name: 📢 Post weekly announcement
        uses: actions/github-script@v7
        with:
          script: |
            const { owner, repo } = context.repo;
            const currentDate = '${{ steps.date.outputs.date }}';
            const customMessage = '${{ github.event.inputs.custom_message }}';

            // Get the general discussion category (adjust if needed)
            const categories = await github.rest.discussions.listCategories({
              owner,
              repo
            });

            const generalCategory = categories.data.find(cat =>
              cat.name.toLowerCase().includes('general') ||
              cat.name.toLowerCase().includes('announcement')
            );

            if (!generalCategory) {
              console.log('⚠️  No suitable discussion category found. Using the first available category.');
            }

            const categoryId = generalCategory ? generalCategory.id : categories.data[0]?.id;

            if (!categoryId) {
              throw new Error('No discussion categories available in this repository');
            }

            const weeklyMessage = customMessage || `
            Happy Friday everyone! 🎉

            This is our weekly community check-in for **${currentDate}**.

            ## 🌟 This Week's Highlights
            - Share your progress and achievements
            - Ask questions or seek help
            - Discuss new ideas and suggestions
            - Connect with fellow community members

            ## 💭 Discussion Topics
            - What are you working on this week?
            - Any blockers or challenges you're facing?
            - Cool discoveries or resources to share?
            - Feedback on recent updates or features?

            ## 🚀 Keep the Momentum Going!
            Your participation makes our community stronger. Don't hesitate to jump in and share your thoughts!

            ---
            *This is an automated weekly post. Feel free to suggest improvements!*
            `;

            try {
              const discussion = await github.rest.discussions.create({
                owner,
                repo,
                category_id: categoryId,
                title: `🌟 Weekly Community Check-In - ${currentDate}`,
                body: weeklyMessage.trim()
              });

              console.log(`✅ Weekly announcement created: ${discussion.data.html_url}`);

              // Pin the discussion for visibility
              await github.rest.discussions.update({
                owner,
                repo,
                discussion_number: discussion.data.number,
                pinned: true
              });

            } catch (error) {
              console.error('❌ Failed to create weekly announcement:', error);
              throw error;
            }
'@

    # Monthly Stats Workflow
    $MonthlyStatsWorkflow = @'
name: 📊 Monthly Community Stats

on:
  schedule:
    - cron: '0 10 1 * *'   # First day of month at 10 AM UTC
  workflow_dispatch:        # Allow manual trigger

jobs:
  monthly-stats:
    runs-on: ubuntu-latest
    permissions:
      discussions: write
      issues: read
      pull-requests: read
      contents: read
    steps:
      - name: 📊 Generate monthly stats
        uses: actions/github-script@v7
        with:
          script: |
            const { owner, repo } = context.repo;
            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            // Get stats for last month
            const since = lastMonth.toISOString();
            const until = thisMonth.toISOString();

            // Get issues created last month
            const issues = await github.rest.issues.listForRepo({
              owner,
              repo,
              state: 'all',
              since,
              per_page: 100
            });

            // Get PRs created last month
            const pulls = await github.rest.pulls.list({
              owner,
              repo,
              state: 'all',
              per_page: 100
            });

            // Filter by date
            const lastMonthIssues = issues.data.filter(issue =>
              !issue.pull_request && new Date(issue.created_at) >= lastMonth && new Date(issue.created_at) < thisMonth
            );

            const lastMonthPRs = pulls.data.filter(pr =>
              new Date(pr.created_at) >= lastMonth && new Date(pr.created_at) < thisMonth
            );

            const monthName = lastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

            const statsMessage = `
            # 📊 Monthly Community Report - ${monthName}

            Here's a summary of our community activity last month:

            ## 📈 Activity Overview
            - **${lastMonthIssues.length}** new issues opened
            - **${lastMonthPRs.length}** new pull requests submitted
            - **${issues.data.filter(i => i.state === 'closed').length}** issues resolved
            - **${pulls.data.filter(p => p.state === 'closed').length}** PRs merged

            ## 🎉 Thank You!
            Thank you to all our contributors who made this month successful!
            Your participation and engagement continue to drive our community forward.

            ## 🔄 Looking Ahead
            As we start a new month, let's continue building amazing things together!

            ---
            *This is an automated monthly report. Have suggestions? Let us know!*
            `;

            // Get categories and post stats
            const categories = await github.rest.discussions.listCategories({
              owner,
              repo
            });

            const announcementCategory = categories.data.find(cat =>
              cat.name.toLowerCase().includes('announcement') ||
              cat.name.toLowerCase().includes('general')
            );

            const categoryId = announcementCategory ? announcementCategory.id : categories.data[0]?.id;

            if (categoryId) {
              await github.rest.discussions.create({
                owner,
                repo,
                category_id: categoryId,
                title: `📊 Monthly Community Report - ${monthName}`,
                body: statsMessage.trim()
              });

              console.log('✅ Monthly stats posted successfully');
            }
'@

    # Health Check Workflow
    $HealthCheckWorkflow = @'
name: 🏥 Community Health Check

on:
  schedule:
    - cron: '0 9 * * 1'    # Every Monday at 9 AM UTC
  workflow_dispatch:        # Allow manual trigger

jobs:
  health-check:
    runs-on: ubuntu-latest
    permissions:
      issues: read
      pull-requests: read
      discussions: write
    steps:
      - name: 🏥 Check community health
        uses: actions/github-script@v7
        with:
          script: |
            const { owner, repo } = context.repo;

            // Get open issues and PRs
            const openIssues = await github.rest.issues.listForRepo({
              owner,
              repo,
              state: 'open',
              per_page: 100
            });

            const openPRs = await github.rest.pulls.list({
              owner,
              repo,
              state: 'open',
              per_page: 100
            });

            // Check for stale items (older than 30 days)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            const staleIssues = openIssues.data.filter(issue =>
              !issue.pull_request && new Date(issue.updated_at) < thirtyDaysAgo
            );

            const stalePRs = openPRs.data.filter(pr =>
              new Date(pr.updated_at) < thirtyDaysAgo
            );

            // Check for items needing attention
            const needsResponse = openIssues.data.filter(issue =>
              !issue.assignee && !issue.labels.some(label => label.name.includes('waiting'))
            );

            let healthReport = '# 🏥 Weekly Community Health Check\n\n';
            healthReport += `**Report generated:** ${new Date().toLocaleDateString()}\n\n`;

            healthReport += '## 📊 Current Status\n';
            healthReport += `- 🐛 Open Issues: ${openIssues.data.filter(i => !i.pull_request).length}\n`;
            healthReport += `- 🔄 Open PRs: ${openPRs.data.length}\n`;
            healthReport += `- ⏰ Stale Issues: ${staleIssues.length}\n`;
            healthReport += `- ⏰ Stale PRs: ${stalePRs.length}\n`;
            healthReport += `- 👀 Need Attention: ${needsResponse.length}\n\n`;

            if (staleIssues.length > 0 || stalePRs.length > 0) {
              healthReport += '## ⚠️ Action Items\n';

              if (staleIssues.length > 0) {
                healthReport += `\n### Stale Issues (${staleIssues.length})\n`;
                staleIssues.slice(0, 5).forEach(issue => {
                  healthReport += `- [#${issue.number}](${issue.html_url}) - ${issue.title}\n`;
                });
                if (staleIssues.length > 5) {
                  healthReport += `... and ${staleIssues.length - 5} more\n`;
                }
              }

              if (stalePRs.length > 0) {
                healthReport += `\n### Stale PRs (${stalePRs.length})\n`;
                stalePRs.slice(0, 5).forEach(pr => {
                  healthReport += `- [#${pr.number}](${pr.html_url}) - ${pr.title}\n`;
                });
                if (stalePRs.length > 5) {
                  healthReport += `... and ${stalePRs.length - 5} more\n`;
                }
              }
            } else {
              healthReport += '## ✅ All Good!\nNo stale issues or PRs detected.\n';
            }

            healthReport += '\n---\n*This is an automated health check. Maintainers will review and take action as needed.*';

            // Only post if there are health concerns or it's the first Monday of the month
            const shouldPost = staleIssues.length > 0 || stalePRs.length > 0 || new Date().getDate() <= 7;

            if (shouldPost) {
              const categories = await github.rest.discussions.listCategories({
                owner,
                repo
              });

              const metaCategory = categories.data.find(cat =>
                cat.name.toLowerCase().includes('meta') ||
                cat.name.toLowerCase().includes('general')
              );

              const categoryId = metaCategory ? metaCategory.id : categories.data[0]?.id;

              if (categoryId) {
                await github.rest.discussions.create({
                  owner,
                  repo,
                  category_id: categoryId,
                  title: `🏥 Weekly Community Health Check - ${new Date().toLocaleDateString()}`,
                  body: healthReport
                });

                console.log('✅ Health check posted successfully');
              }
            } else {
              console.log('✅ Community health is good, no report needed this week');
            }
'@

    # Write workflow files
    $WeeklyWorkflow | Out-File -FilePath ".github/workflows/weekly-announcement.yml" -Encoding UTF8
    $MonthlyStatsWorkflow | Out-File -FilePath ".github/workflows/monthly-stats.yml" -Encoding UTF8
    $HealthCheckWorkflow | Out-File -FilePath ".github/workflows/health-check.yml" -Encoding UTF8

    Write-Host "✅ Created scheduled workflow files:" -ForegroundColor Green
    Write-Host "   - weekly-announcement.yml (Every Friday at 3 PM UTC)" -ForegroundColor White
    Write-Host "   - monthly-stats.yml (First day of each month)" -ForegroundColor White
    Write-Host "   - health-check.yml (Every Monday, posts only when needed)" -ForegroundColor White

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
        git commit -m "🤖 Add scheduled community workflows for automation"
        git push origin main
        Write-Host "✅ Scheduled workflows have been pushed to $Repository!" -ForegroundColor Green
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
Write-Host "🎉 Scheduled workflows setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 What these workflows do:" -ForegroundColor Cyan
Write-Host "   🌟 Weekly announcements every Friday" -ForegroundColor White
Write-Host "   📊 Monthly community stats on the 1st of each month" -ForegroundColor White
Write-Host "   🏥 Weekly health checks (posts only when action needed)" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Cyan
Write-Host "   1. 💬 Make sure Discussions are enabled in your repository" -ForegroundColor White
Write-Host "   2. 🏷️  Create appropriate discussion categories (General, Announcements)" -ForegroundColor White
Write-Host "   3. ⚙️  Adjust cron schedules if needed for your timezone" -ForegroundColor White
Write-Host "   4. 🎨 Customize messages in the workflow files" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Repository: $RepoUrl" -ForegroundColor Blue
