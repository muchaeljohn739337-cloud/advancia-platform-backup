#!/bin/bash
# Adds starter workflows to the community repo for engagement
# Requires: GitHub CLI (gh) installed and authenticated
# Run: ./setup-community-workflows.sh

set -e  # Exit on any error

ORG="advancia-platform-org"       # Replace with your organization name
COMMUNITY_REPO="advancia-community"
REPO_URL="https://github.com/$ORG/$COMMUNITY_REPO"

echo "🚀 Setting up community workflows for $ORG/$COMMUNITY_REPO"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first."
    echo "   Visit: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI. Please run 'gh auth login' first."
    exit 1
fi

# Create temporary directory
TEMP_DIR=$(mktemp -d)
echo "📂 Working in temporary directory: $TEMP_DIR"

cd "$TEMP_DIR"

# Clone the community repo
echo "📥 Cloning repository..."
if ! git clone "$REPO_URL" 2>/dev/null; then
    echo "❌ Failed to clone repository. Please ensure:"
    echo "   1. Repository $REPO_URL exists"
    echo "   2. You have access to the repository"
    echo "   3. GitHub CLI is properly authenticated"
    exit 1
fi

cd "$COMMUNITY_REPO"

# Create workflows directory
mkdir -p .github/workflows

echo "📝 Creating community workflows..."

# --- Welcome Bot Workflow ---
cat <<'YAML' > .github/workflows/welcome.yml
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
            } else if (discussion) {
              welcomeMessage = `
                👋 **Welcome to the Advancia community discussions!**

                Thank you for starting this discussion! 🎉 Our community loves to help each other out.

                **Getting the most from discussions:**
                - 🏷️ Make sure to use appropriate labels
                - 🔍 Search existing discussions before posting
                - 📝 Provide context and details

                Happy discussing! 💭
              `;

              // Note: GitHub API doesn't support commenting on discussions yet
              console.log('Discussion welcome message would be:', welcomeMessage);
            }
YAML

# --- Auto-Assign Moderators Workflow ---
cat <<'YAML' > .github/workflows/auto-assign.yml
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
YAML

# --- Community Health Check Workflow ---
cat <<'YAML' > .github/workflows/community-health.yml
name: 🏥 Community Health Check

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
  workflow_dispatch:

jobs:
  health-check:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      pull-requests: read
      contents: read
    steps:
      - uses: actions/checkout@v4

      - name: 📊 Community Health Report
        uses: actions/github-script@v7
        with:
          script: |
            const { owner, repo } = context.repo;

            // Get recent activity
            const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

            const [issues, prs, discussions] = await Promise.all([
              github.rest.issues.listForRepo({ owner, repo, since, state: 'all' }),
              github.rest.pulls.list({ owner, repo, state: 'all' }),
              // github.rest.discussions would go here when available
            ]);

            const newIssues = issues.data.filter(issue => !issue.pull_request).length;
            const newPRs = prs.data.length;

            console.log(`📊 Weekly Community Report:
            - 🐛 New Issues: ${newIssues}
            - 🔄 New PRs: ${newPRs}
            - 📈 Total Issues: ${issues.data.length}
            - 🎯 Total PRs: ${prs.data.length}`);
YAML

# --- Stale Issue Management ---
cat <<'YAML' > .github/workflows/stale.yml
name: 🧹 Stale Issue Management

on:
  schedule:
    - cron: '30 1 * * *'  # Daily at 1:30 AM
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
YAML

# --- Auto Label Workflow ---
cat <<'YAML' > .github/workflows/auto-label.yml
name: 🏷️ Auto Label

on:
  issues:
    types: [opened]
  pull_request:
    types: [opened]

jobs:
  auto-label:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4

      - name: 🏷️ Auto label based on content
        uses: actions/github-script@v7
        with:
          script: |
            const { owner, repo } = context.repo;
            const issueOrPr = context.payload.issue || context.payload.pull_request;
            const title = issueOrPr.title.toLowerCase();
            const body = (issueOrPr.body || '').toLowerCase();
            const isIssue = !!context.payload.issue;

            const labels = [];

            // Auto-label based on keywords
            if (title.includes('bug') || body.includes('bug') || title.includes('error')) {
              labels.push('bug');
            }
            if (title.includes('feature') || body.includes('enhancement')) {
              labels.push('enhancement');
            }
            if (title.includes('docs') || title.includes('documentation')) {
              labels.push('documentation');
            }
            if (title.includes('security') || body.includes('security')) {
              labels.push('security');
            }
            if (title.includes('help') || title.includes('question')) {
              labels.push('question');
            }

            // Add type label
            labels.push(isIssue ? 'issue' : 'pull-request');

            if (labels.length > 0) {
              await github.rest.issues.addLabels({
                owner,
                repo,
                issue_number: issueOrPr.number,
                labels
              });
            }
YAML

# --- First Time Contributor Workflow ---
cat <<'YAML' > .github/workflows/first-time-contributor.yml
name: 🌟 First Time Contributor

on:
  pull_request:
    types: [opened]

jobs:
  first-time:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - name: 🌟 Check if first-time contributor
        uses: actions/github-script@v7
        with:
          script: |
            const { owner, repo } = context.repo;
            const prAuthor = context.payload.pull_request.user.login;

            // Check if this is the user's first contribution
            const { data: prs } = await github.rest.pulls.list({
              owner,
              repo,
              state: 'all',
              creator: prAuthor
            });

            const isFirstTime = prs.length === 1; // Only this PR

            if (isFirstTime) {
              await github.rest.issues.createComment({
                owner,
                repo,
                issue_number: context.payload.pull_request.number,
                body: `
                  🌟 **Congratulations on your first contribution to Advancia!** 🎉

                  Thank you for taking the time to contribute to our project. We're excited to review your changes!

                  **What happens next?**
                  1. 🔍 Our maintainers will review your PR
                  2. 💬 We might ask for some changes or clarifications
                  3. ✅ Once approved, we'll merge your contribution

                  **First-time contributor tips:**
                  - ✅ Make sure all tests pass
                  - 📝 Update documentation if needed
                  - 🔄 Keep your branch up to date with main

                  Thanks again for being part of our community! 🚀
                `
              });

              await github.rest.issues.addLabels({
                owner,
                repo,
                issue_number: context.payload.pull_request.number,
                labels: ['first-time-contributor', '🌟 first-contribution']
              });
            }
YAML

echo "✅ Created workflow files:"
echo "   - welcome.yml (Welcome bot)"
echo "   - auto-assign.yml (Auto-assign moderators)"
echo "   - community-health.yml (Weekly health reports)"
echo "   - stale.yml (Stale issue management)"
echo "   - auto-label.yml (Auto-labeling)"
echo "   - first-time-contributor.yml (First-time contributor recognition)"

# Add and commit changes
git add .github/workflows/
git status

echo ""
read -p "📤 Do you want to commit and push these workflows? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    git commit -m "🤖 Add comprehensive community workflows

    - Welcome bot for new issues, PRs, and discussions
    - Auto-assignment to moderators
    - Community health monitoring
    - Stale issue management
    - Auto-labeling based on content
    - First-time contributor recognition

    These workflows will help automate community management
    and improve contributor experience."

    git push origin main
    echo "✅ Workflows have been pushed to $COMMUNITY_REPO!"
else
    echo "⏸️  Changes staged but not pushed. Run 'git commit && git push' when ready."
fi

# Cleanup
cd "$CURRENT_DIR"
rm -rf "$TEMP_DIR"

echo ""
echo "🎉 Community workflows setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. 🏷️  Create labels in your repository:"
echo "      - bug, enhancement, documentation, security, question"
echo "      - issue, pull-request, first-time-contributor, stale"
echo "   2. 📝 Add CODE_OF_CONDUCT.md and CONTRIBUTING.md to your repo"
echo "   3. 🔧 Customize moderator usernames in auto-assign.yml"
echo "   4. ⚙️  Adjust stale timing and exempt labels as needed"
echo ""
echo "🌐 Repository: $REPO_URL"
