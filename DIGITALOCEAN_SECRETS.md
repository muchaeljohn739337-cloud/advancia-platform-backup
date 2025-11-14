# DigitalOcean GitHub Secrets Setup

Complete guide to setting up GitHub Secrets for DigitalOcean deployment automation.

## Overview

GitHub Secrets are encrypted environment variables used by GitHub Actions workflows. They're needed to authenticate with DigitalOcean and manage deployments securely.

## Step-by-Step Setup

### 1. Generate SSH Key for GitHub Actions

Run this on your **local machine** (not the droplet):

```bash
# Generate ED25519 SSH key (more secure than RSA)
ssh-keygen -t ed25519 -f ~/.ssh/do_github_actions -N ""

# This creates two files:
# ~/.ssh/do_github_actions       (private key - goes to GitHub)
# ~/.ssh/do_github_actions.pub   (public key - goes to droplet)

# Display the private key (you'll copy this to GitHub)
cat ~/.ssh/do_github_actions
```

**Output should look like**:

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUtbm9uZS1ub25lAAAAIQmZLy...
...
-----END OPENSSH PRIVATE KEY-----
```

**Save this securely** - you'll need it for GitHub Secrets.

### 2. Add SSH Key to Droplet

SSH into your DigitalOcean droplet and add the public key:

```bash
ssh root@YOUR_DROPLET_IP

# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add public key
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBlq..." >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Verify (should return "root@droplet-hostname")
ssh -i ~/.ssh/do_github_actions root@YOUR_DROPLET_IP "whoami"
```

### 3. Get Your Droplet IP

```bash
# Via droplet dashboard or:
ssh root@YOUR_DROPLET_IP
hostname -I
# Returns: YOUR_DROPLET_IP PRIVATE_IP

exit
```

### 4. Add Secrets to GitHub Repository

Go to your GitHub repository:

**Path**: Settings → Secrets and Variables → Actions

Click **"New repository secret"** and add each:

#### Secret 1: DO_SSH_KEY

- **Name**: `DO_SSH_KEY`
- **Value**: Paste the **complete** private key from `~/.ssh/do_github_actions`

```
-----BEGIN OPENSSH PRIVATE KEY-----
[paste entire content here]
-----END OPENSSH PRIVATE KEY-----
```

#### Secret 2: DO_DROPLET_IP

- **Name**: `DO_DROPLET_IP`
- **Value**: Your droplet's public IP address (e.g., `123.45.67.89`)

#### Secret 3: DATABASE_URL

- **Name**: `DATABASE_URL`
- **Value**: Your PostgreSQL connection string

```
postgresql://advancia_user:YOUR_STRONG_PASSWORD@YOUR_DB_HOST:5432/advancia_prod
```

If using the same droplet for database:

```
postgresql://advancia_user:YOUR_STRONG_PASSWORD@localhost:5432/advancia_prod
```

### (Optional) Add Additional Secrets

If you want GitHub Actions to upload backups to S3:

#### Secret: AWS_ACCESS_KEY_ID

```
AKIAIOSFODNN7EXAMPLE
```

#### Secret: AWS_SECRET_ACCESS_KEY

```
wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

#### Variable: S3_BACKUPS_BUCKET

Create a **Variable** (not Secret) at Settings → Variables → Actions:

```
advancia-backups
```

## Verify Secrets Are Configured

### 1. Check GitHub

Go to: Settings → Secrets and Variables → Actions

You should see:

- ✅ `DO_SSH_KEY` (value hidden)
- ✅ `DO_DROPLET_IP` (value hidden)
- ✅ `DATABASE_URL` (value hidden)

### 2. Test SSH Connection

Trigger a workflow to test SSH access. Push a test commit:

```bash
git commit --allow-empty -m "test: verify DO SSH access"
git push origin main
```

Go to: Actions → "Deploy to DigitalOcean" → View logs

You should see:

```
🚀 Deploying to DigitalOcean...
[SSH connection successful]
📦 Deploying...
```

### 3. Verify on Droplet

```bash
ssh -i ~/.ssh/do_github_actions root@YOUR_DROPLET_IP

# Check if recent deployment ran
ls -la /app/modular-saas-platform/

# Check Docker services
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml ps
```

## Rotate SSH Key (Monthly Recommended)

### Generate New Key

```bash
# On local machine
ssh-keygen -t ed25519 -f ~/.ssh/do_github_actions_new -N ""

# Get new public key
cat ~/.ssh/do_github_actions_new.pub
```

### Update Droplet

```bash
ssh -i ~/.ssh/do_github_actions root@YOUR_DROPLET_IP

# Add new key
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBlq..." >> ~/.ssh/authorized_keys

# Verify both keys work
exit

# Test with old key
ssh -i ~/.ssh/do_github_actions root@YOUR_DROPLET_IP "echo Old key works"

# Test with new key
ssh -i ~/.ssh/do_github_actions_new root@YOUR_DROPLET_IP "echo New key works"
```

### Update GitHub Secret

1. Go to: Settings → Secrets and Variables → Actions
2. Click `DO_SSH_KEY`
3. Click "Update secret"
4. Paste new private key from `~/.ssh/do_github_actions_new`
5. Save

### Remove Old Key

```bash
ssh -i ~/.ssh/do_github_actions_new root@YOUR_DROPLET_IP

# View current keys
cat ~/.ssh/authorized_keys

# Remove old key (edit file and remove the line)
nano ~/.ssh/authorized_keys

# Verify new key still works
exit

ssh -i ~/.ssh/do_github_actions_new root@YOUR_DROPLET_IP "echo Still works!"
```

## Troubleshooting

### "Permission denied (publickey)"

**Issue**: GitHub Actions can't SSH into droplet

**Solutions**:

1. Verify `DO_SSH_KEY` secret contains complete private key (including `-----BEGIN` and `-----END`)
2. Verify `DO_DROPLET_IP` is correct
3. Verify public key was added to droplet's `~/.ssh/authorized_keys`
4. Check droplet firewall allows SSH (port 22)

```bash
# From droplet
ufw status
# Should show: 22/tcp ALLOW
```

### "No repository secrets found"

**Issue**: Workflows can't access secrets

**Solution**:

1. Go to Settings → Secrets and Variables → Actions
2. Verify secrets are listed (not case-sensitive)
3. Verify you're in the right branch/repository

### "Connection timeout"

**Issue**: Can't reach droplet

**Solutions**:

1. Verify `DO_DROPLET_IP` is correct: `ping YOUR_DROPLET_IP`
2. Verify droplet is running (check DigitalOcean dashboard)
3. Verify firewall allows port 22: `sudo ufw allow 22/tcp`

## Security Best Practices

✅ **DO**:

- [ ] Use strong, unique SSH keys
- [ ] Rotate SSH keys monthly
- [ ] Keep `DO_SSH_KEY` secret (never commit to repo)
- [ ] Use different keys for different environments
- [ ] Audit secret usage: Check who accessed secrets
- [ ] Delete unused secrets immediately

❌ **DON'T**:

- [ ] Commit SSH keys to repository
- [ ] Share SSH keys via email/chat
- [ ] Use same key for multiple environments
- [ ] Store passwords in plain text
- [ ] Enable "Allow all" SSH access
- [ ] Keep SSH keys for longer than 90 days

## Accessing Secrets in Workflows

In `.github/workflows/*.yml`, use secrets like:

```yaml
- name: Deploy
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.DO_DROPLET_IP }}
    username: root
    key: ${{ secrets.DO_SSH_KEY }}
    script: |
      echo "Deploying..."
```

**Note**: Secrets are masked in logs. You'll see `***` instead of actual values.

## Reference

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [appleboy/ssh-action](https://github.com/appleboy/ssh-action) - SSH action used in workflows
- [SSH Key Types](https://en.wikipedia.org/wiki/Comparison_of_cryptography_software)

---

**Next**: Follow [DIGITALOCEAN_MIGRATION_GUIDE.md](./DIGITALOCEAN_MIGRATION_GUIDE.md) to complete your migration.
