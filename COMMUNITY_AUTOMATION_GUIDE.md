# 🚀 Community Automation Guide

This guide shows you how to set up complete community automation for your GitHub repository in just a few simple steps.

## 📋 What Gets Automated

✅ **Welcome Bot** - Automatically greets new contributors  
✅ **Auto-Assignment** - Assigns moderators to new issues/PRs  
✅ **Stale Management** - Manages inactive issues and PRs  
✅ **Community Files** - Creates CODE_OF_CONDUCT.md and CONTRIBUTING.md  
✅ **Issue Templates** - Adds structured templates for bug reports and features  
✅ **Testing** - Validates that everything works correctly

---

## 🛠️ Quick Setup (Windows)

### Option 1: Default Settings

```powershell
# Run with default settings (advancia-platform-org/advancia-community)
.\setup-complete-community.ps1
```

### Option 2: Custom Settings

```powershell
# Customize organization, repository, and moderators
.\setup-complete-community.ps1 `
  -Organization "your-org" `
  -Repository "your-community-repo" `
  -Moderators @("user1", "user2", "user3") `
  -NumAssignees 2
```

### Option 3: Automated (No Prompts)

```powershell
# Run without any user interaction
.\setup-complete-community.ps1 -Force
```

---

## 🛠️ Quick Setup (Linux/Mac)

### Option 1: Default Settings

```bash
# Make executable and run with defaults
chmod +x setup-complete-community.sh
./setup-complete-community.sh
```

### Option 2: Custom Settings

```bash
# Set environment variables for customization
ORG="your-org" \
COMMUNITY_REPO="your-community-repo" \
MODERATORS="user1,user2,user3" \
NUM_ASSIGNEES=2 \
./setup-complete-community.sh
```

### Option 3: Automated (No Prompts)

```bash
# Run without any user interaction
FORCE=true ./setup-complete-community.sh
```

---

## 📋 Step-by-Step Walkthrough

### 1. 🔧 Prerequisites Check

The script automatically verifies:

-   ✅ GitHub CLI (`gh`) is installed
-   ✅ Git is installed and configured
-   ✅ You're authenticated with GitHub

### 2. 📥 Repository Setup

-   Creates repository if it doesn't exist
-   Clones to temporary workspace
-   Sets up initial structure

### 3. 📝 Community Files Creation

-   **CODE_OF_CONDUCT.md** - Professional code of conduct
-   **CONTRIBUTING.md** - Complete contribution guidelines
-   **Issue Templates** - Bug reports and feature requests

### 4. 🤖 Workflow Creation

-   **Welcome Bot** - Greets new contributors with helpful links
-   **Auto-Assignment** - Assigns your specified moderators
-   **Stale Management** - Keeps issues and PRs organized

### 5. 🧪 Testing & Validation

-   Verifies repository accessibility
-   Checks that all workflows are present
-   Confirms community files exist
-   Reports any missing components

---

## 🎯 Customization Options

### PowerShell Parameters

| Parameter       | Default                        | Description                    |
| --------------- | ------------------------------ | ------------------------------ |
| `-Organization` | `advancia-platform-org`        | GitHub organization name       |
| `-Repository`   | `advancia-community`           | Repository name                |
| `-Moderators`   | `@("muchaeljohn739337-cloud")` | Array of moderator usernames   |
| `-NumAssignees` | `1`                            | Number of moderators to assign |
| `-Force`        | `false`                        | Skip all confirmation prompts  |
| `-SkipTest`     | `false`                        | Skip testing after setup       |

### Bash Environment Variables

| Variable         | Default                   | Description                    |
| ---------------- | ------------------------- | ------------------------------ |
| `ORG`            | `advancia-platform-org`   | GitHub organization name       |
| `COMMUNITY_REPO` | `advancia-community`      | Repository name                |
| `MODERATORS`     | `muchaeljohn739337-cloud` | Comma-separated moderators     |
| `NUM_ASSIGNEES`  | `1`                       | Number of moderators to assign |
| `FORCE`          | `false`                   | Skip all confirmation prompts  |
| `SKIP_TEST`      | `false`                   | Skip testing after setup       |

---

## 🔧 Post-Setup Configuration

### 1. Enable Discussions

```bash
# Enable discussions in your repository
gh repo edit your-org/your-repo --enable-discussions
```

### 2. Create Labels (Optional)

```bash
# Create useful labels for your repository
gh label create "good first issue" --color "7057ff" --description "Good for newcomers"
gh label create "help wanted" --color "008672" --description "Extra attention is needed"
gh label create "priority: high" --color "d73a4a" --description "High priority issue"
```

### 3. Customize Workflows

Edit `.github/workflows/*.yml` files to:

-   Adjust cron schedules for your timezone
-   Modify welcome messages
-   Change stale issue timeframes
-   Add custom labels or responses

---

## 🧪 Testing Your Setup

### Manual Testing

1. **Create a Test Issue**

   ```bash
   gh issue create --title "Test Issue" --body "Testing the welcome bot"
   ```

2. **Check Workflow Runs**

   ```bash
   gh run list --repo your-org/your-repo
   ```

3. **Monitor Actions Tab**
   Visit: `https://github.com/your-org/your-repo/actions`

### Automated Testing

The scripts include built-in testing that checks:

-   Repository accessibility
-   Workflow presence
-   Community file existence
-   Basic functionality

---

## 🎨 Advanced Customization

### Custom Welcome Messages

Edit `.github/workflows/welcome.yml` to personalize:

-   Welcome text and tone
-   Links to your documentation
-   Special messages for first-time contributors
-   Community-specific guidance

### Custom Auto-Assignment Rules

Modify `.github/workflows/auto-assign.yml` for:

-   Different assignment strategies
-   Label-based assignment
-   Time-based assignment
-   Issue type specific assignment

### Custom Stale Management

Adjust `.github/workflows/stale.yml` for:

-   Different timeframes (30 days → 60 days)
-   Custom stale messages
-   Exempt labels and milestones
-   Different close behaviors

---

## 🚨 Troubleshooting

### Common Issues

**Permission Denied**

```bash
# Make sure you have admin access to the organization/repository
gh auth refresh -s admin:org
```

**Repository Already Exists**

```bash
# The script will use existing repository and add workflows
# No data will be lost
```

**Workflow Not Running**

```bash
# Check if Actions are enabled
gh repo edit your-org/your-repo --enable-issues --enable-projects --enable-wiki
```

**Authentication Issues**

```bash
# Re-authenticate with proper scopes
gh auth logout
gh auth login --scopes "repo,admin:org,workflow"
```

### Debug Mode

```bash
# Run with verbose output for debugging
set -x  # For bash
$VerbosePreference = "Continue"  # For PowerShell
```

---

## 📚 What Each File Does

### Community Files

-   **CODE_OF_CONDUCT.md** - Sets community standards and behavior expectations
-   **CONTRIBUTING.md** - Guides new contributors through the process
-   **ISSUE_TEMPLATE/** - Provides structured forms for bug reports and features

### Workflows

-   **welcome.yml** - Automatically greets new contributors and provides helpful links
-   **auto-assign.yml** - Assigns moderators to new issues and PRs for faster response
-   **stale.yml** - Keeps the repository clean by managing inactive issues and PRs

---

## 🔄 Updating and Maintenance

### Regular Updates

```bash
# Update workflow versions periodically
# Check for new versions of:
# - actions/github-script
# - pozil/auto-assign-issue
# - actions/stale
```

### Monitoring Health

```bash
# Check workflow runs regularly
gh run list --status failure

# Monitor community engagement
gh issue list --state open
gh pr list --state open
```

---

## 🌟 Best Practices

✅ **Review and customize** welcome messages for your community tone  
✅ **Test workflows** before rolling out to production repositories  
✅ **Monitor engagement** and adjust timeframes as needed  
✅ **Keep moderator lists** updated as team changes  
✅ **Regularly review** and update community guidelines  
✅ **Celebrate contributors** and maintain positive community culture

---

## 📞 Support

If you encounter issues or need help customizing:

1. Check the [GitHub Actions documentation](https://docs.github.com/en/actions)
2. Review [GitHub CLI documentation](https://cli.github.com/manual/)
3. Open an issue in your community repository
4. Join discussions for community support

---

_Happy community building! 🎉_
