#!/bin/bash
# Complete Community Automation Setup for Linux/Mac
# This script handles everything: workflows, moderators, community files, and testing
# Run: ./setup-complete-community.sh

set -e  # Exit on any error

# Default configuration
ORG="${ORG:-advancia-platform-org}"
COMMUNITY_REPO="${COMMUNITY_REPO:-advancia-community}"
MODERATORS="${MODERATORS:-muchaeljohn739337-cloud}"
NUM_ASSIGNEES="${NUM_ASSIGNEES:-1}"
FORCE="${FORCE:-false}"
SKIP_TEST="${SKIP_TEST:-false}"

TEMP_DIR="/tmp/community-complete-setup-$$"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Complete Community Automation Setup${NC}"
echo -e "   ${CYAN}Organization: $ORG${NC}"
echo -e "   ${CYAN}Repository: $COMMUNITY_REPO${NC}"
echo -e "   ${CYAN}Moderators: $MODERATORS${NC}"
echo ""

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

    if ! command -v gh &> /dev/null; then
        echo -e "${RED}❌ GitHub CLI (gh) is not installed. Please install it first.${NC}"
        echo -e "${YELLOW}   Visit: https://cli.github.com/${NC}"
        exit 1
    fi

    if ! command -v git &> /dev/null; then
        echo -e "${RED}❌ Git is not installed. Please install Git first.${NC}"
        exit 1
    fi

    # Check authentication
    if ! gh auth status &> /dev/null; then
        echo -e "${RED}❌ Not authenticated with GitHub CLI. Please run 'gh auth login' first.${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ All prerequisites met${NC}"
}

# Setup repository
setup_repository() {
    echo -e "${YELLOW}📥 Setting up repository...${NC}"

    local repo_url="https://github.com/$ORG/$COMMUNITY_REPO"

    if ! git clone "$repo_url" "$TEMP_DIR" &> /dev/null; then
        # Repository might not exist, try to create it
        echo -e "   ${YELLOW}Repository doesn't exist. Creating...${NC}"
        gh repo create "$ORG/$COMMUNITY_REPO" --public --description "Community repository for $ORG" || {
            echo -e "${RED}❌ Failed to create repository${NC}"
            exit 1
        }

        # Initialize with README
        mkdir -p "$TEMP_DIR"
        cd "$TEMP_DIR"
        git init
        git remote add origin "$repo_url"

        echo "# $COMMUNITY_REPO" > README.md
        git add README.md
        git commit -m "Initial commit"
        git branch -M main
        git push -u origin main

        echo -e "${GREEN}✅ Repository created successfully${NC}"
    fi
}

# Create community files
create_community_files() {
    echo -e "${YELLOW}📝 Creating community files...${NC}"

    # Code of Conduct
    cat > CODE_OF_CONDUCT.md << 'EOF'
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
EOF

    # Contributing Guidelines
    cat > CONTRIBUTING.md << 'EOF'
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
EOF

    # Create issue templates directory
    mkdir -p .github/ISSUE_TEMPLATE

    # Bug Report Template
    cat > .github/ISSUE_TEMPLATE/bug_report.md << 'EOF'
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
EOF

    # Feature Request Template
    cat > .github/ISSUE_TEMPLATE/feature_request.md << 'EOF'
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
EOF

    echo -e "${GREEN}✅ Community files created${NC}"
}

# Create workflows
create_workflows() {
    echo -e "${YELLOW}🤖 Creating community workflows...${NC}"

    mkdir -p .github/workflows

    # Welcome Bot Workflow
    cat > .github/workflows/welcome.yml << 'EOF'
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
EOF

    # Auto-assign workflow with moderators from environment
    local moderators_yaml=""
    IFS=',' read -ra ADDR <<< "$MODERATORS"
    for moderator in "${ADDR[@]}"; do
        moderators_yaml+="            ${moderator// /}"$'\n'
    done

    cat > .github/workflows/auto-assign.yml << EOF
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
          repo-token: \${{ secrets.GITHUB_TOKEN }}
          assignees: |
$moderators_yaml
          numOfAssignee: $NUM_ASSIGNEES
EOF

    # Stale management workflow
    cat > .github/workflows/stale.yml << 'EOF'
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
EOF

    echo -e "${GREEN}✅ Workflows created with moderators: $MODERATORS${NC}"
}

# Test community setup
test_setup() {
    echo -e "${YELLOW}🧪 Testing community setup...${NC}"

    # Test if repository exists and is accessible
    if repo_info=$(gh repo view "$ORG/$COMMUNITY_REPO" --json name,description,isPrivate 2>/dev/null); then
        repo_name=$(echo "$repo_info" | jq -r '.name')
        echo -e "   ${GREEN}✅ Repository accessible: $repo_name${NC}"
    else
        echo -e "   ${RED}❌ Repository not accessible${NC}"
        return
    fi

    # Check if workflows exist
    if workflows=$(gh workflow list --repo "$ORG/$COMMUNITY_REPO" --json name,path 2>/dev/null); then
        expected_workflows=("👋 Welcome Bot" "🤖 Auto Assign Moderators" "🧹 Stale Issue Management")

        for expected in "${expected_workflows[@]}"; do
            if echo "$workflows" | jq -e ".[] | select(.name == \"$expected\")" > /dev/null; then
                echo -e "   ${GREEN}✅ Workflow found: $expected${NC}"
            else
                echo -e "   ${YELLOW}⚠️ Workflow missing: $expected${NC}"
            fi
        done
    fi

    # Check community files
    if files=$(gh api "/repos/$ORG/$COMMUNITY_REPO/contents" 2>/dev/null); then
        expected_files=("CODE_OF_CONDUCT.md" "CONTRIBUTING.md")

        for expected in "${expected_files[@]}"; do
            if echo "$files" | jq -e ".[] | select(.name == \"$expected\")" > /dev/null; then
                echo -e "   ${GREEN}✅ Community file found: $expected${NC}"
            else
                echo -e "   ${YELLOW}⚠️ Community file missing: $expected${NC}"
            fi
        done
    fi

    echo -e "${GREEN}✅ Testing complete!${NC}"
}

# Cleanup function
cleanup() {
    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi
}
trap cleanup EXIT

# Main execution
main() {
    check_prerequisites

    echo -e "${CYAN}📂 Working in: $TEMP_DIR${NC}"

    setup_repository
    cd "$TEMP_DIR"

    create_community_files
    create_workflows

    # Stage all changes
    git add .
    git status

    echo ""
    if [ "$FORCE" = "true" ]; then
        should_commit=true
    else
        read -p "📤 Commit and push all changes? (y/N): " -r
        should_commit=false
        [[ $REPLY =~ ^[Yy]$ ]] && should_commit=true
    fi

    if [ "$should_commit" = true ]; then
        git commit -m "🚀 Complete community setup: workflows, files, and templates"
        git push origin main
        echo -e "${GREEN}✅ All changes pushed successfully!${NC}"

        # Test the setup
        if [ "$SKIP_TEST" != "true" ]; then
            sleep 3  # Wait for GitHub to process
            test_setup
        fi
    else
        echo -e "${YELLOW}⏸️ Changes staged but not committed.${NC}"
        echo -e "${WHITE}   Run 'git commit && git push' when ready.${NC}"
    fi
}

# Run main function
main "$@"

echo ""
echo -e "${GREEN}🎉 Community setup complete!${NC}"
echo ""
echo -e "${CYAN}📋 What was set up:${NC}"
echo -e "${WHITE}   ✅ Repository created/configured${NC}"
echo -e "${WHITE}   ✅ Welcome bot for new contributors${NC}"
echo -e "${WHITE}   ✅ Auto-assignment to moderators: $MODERATORS${NC}"
echo -e "${WHITE}   ✅ Stale issue management${NC}"
echo -e "${WHITE}   ✅ Code of Conduct and Contributing guidelines${NC}"
echo -e "${WHITE}   ✅ Issue templates for bugs and features${NC}"
echo ""
echo -e "${CYAN}🚀 Next steps:${NC}"
echo -e "${WHITE}   1. 💬 Enable Discussions in repository settings${NC}"
echo -e "${WHITE}   2. 🏷️ Create repository labels if needed${NC}"
echo -e "${WHITE}   3. 🧪 Test by creating an issue or discussion${NC}"
echo -e "${WHITE}   4. 📈 Monitor workflow runs in the Actions tab${NC}"
echo ""
echo -e "${BLUE}🌐 Repository: https://github.com/$ORG/$COMMUNITY_REPO${NC}"
