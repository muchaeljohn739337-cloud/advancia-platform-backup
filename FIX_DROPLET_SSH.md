# 🔧 Fix DigitalOcean Droplet SSH Connection

## Current Status

✅ **TCP Port 22 is OPEN** - Port test succeeded
❌ **SSH connection TIMING OUT** - Banner exchange fails
📍 **Droplet IP**: `157.245.8.131`

## Problem Diagnosis

Your droplet's port 22 is reachable, but SSH connection times out during banner exchange. This typically means:

1. SSH service is not running properly
2. Firewall is blocking after initial connection
3. SSH configuration issue on the droplet
4. Network MTU/packet fragmentation issue

## Immediate Solution (Required)

### 🎯 **Use DigitalOcean Web Console** (RECOMMENDED)

Since SSH isn't working from your machine, you MUST use the DigitalOcean web-based console:

**Steps:**

1. **Login to DigitalOcean**: <https://cloud.digitalocean.com>
2. **Navigate to your droplet**: Click on Droplets → Your droplet name
3. **Open Console**: Click **"Access"** tab → **"Launch Droplet Console"**
4. **Login**: Enter your root password (set during droplet creation)

If you don't remember the root password:

-   Click **"Access"** → **"Reset Root Password"**
-   New password will be emailed to you
-   Use it to login via console

---

## Once in Console, Run These Commands

### Step 1: Check SSH Service

```bash
# Check if SSH is running
systemctl status sshd

# If not running, start it
systemctl start sshd
systemctl enable sshd
```

### Step 2: Check Firewall Rules

```bash
# Check firewall status
ufw status verbose

# If firewall is active, ensure SSH is allowed
ufw allow 22/tcp
ufw allow OpenSSH
ufw reload

# Verify
ufw status numbered
```

### Step 3: Check SSH Configuration

```bash
# View SSH config
cat /etc/ssh/sshd_config | grep -E "PermitRootLogin|PubkeyAuthentication|PasswordAuthentication|Port"

# Should show:
# Port 22
# PermitRootLogin yes (or prohibit-password)
# PubkeyAuthentication yes
```

If settings are wrong, fix them:

```bash
nano /etc/ssh/sshd_config

# Ensure these lines:
Port 22
PermitRootLogin yes
PubkeyAuthentication yes
PasswordAuthentication yes  # Temporarily for troubleshooting

# Save and restart SSH
systemctl restart sshd
```

### Step 4: Add Your SSH Key

From your Windows machine, get your public key:

```powershell
# Get your public key (run on Windows)
Get-Content ~\.ssh\id_rsa.pub
```

Copy the output, then in the **droplet console**:

```bash
# Ensure .ssh directory exists
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your public key (paste the key you copied)
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys
```

### Step 5: Check Network and SSH Logs

```bash
# Check SSH logs for errors
tail -f /var/log/auth.log

# In another terminal, try connecting from your Windows machine
# Watch the logs for connection attempts and errors
```

---

## Alternative: Enable Password Authentication Temporarily

If key-based auth is not working, enable password authentication temporarily:

**In droplet console:**

```bash
# Edit SSH config
nano /etc/ssh/sshd_config

# Change or add:
PasswordAuthentication yes

# Restart SSH
systemctl restart sshd

# Set root password if needed
passwd root
```

**From Windows:**

```powershell
# Try connecting with password
ssh root@157.245.8.131
# Enter password when prompted
```

---

## Check DigitalOcean Cloud Firewall

**Via DigitalOcean Dashboard:**

1. Go to **Networking** → **Firewalls**
2. Check if any firewall is applied to your droplet
3. If yes, ensure these inbound rules exist:
   -   **SSH**: TCP Port 22, Source: All IPv4 or your IP
   -   **HTTP**: TCP Port 80, Source: All IPv4
   -   **HTTPS**: TCP Port 443, Source: All IPv4

**To temporarily test:**

-   Remove the cloud firewall from the droplet
-   Try SSH connection
-   If it works, add proper rules and re-attach

---

## Upload Files Once SSH Works

### Method 1: SCP (Secure Copy)

```powershell
# Upload single file
scp "C:\path\to\file.zip" root@157.245.8.131:/root/

# Upload directory
scp -r "C:\path\to\directory" root@157.245.8.131:/root/

# Upload deployment archive
scp "C:\Users\mucha.DESKTOP-H7T9NPM\advancia-deploy.zip" root@157.245.8.131:/root/
```

### Method 2: SFTP

```powershell
# Start SFTP session
sftp root@157.245.8.131

# SFTP commands:
put local-file.txt              # Upload file
put -r local-directory          # Upload directory
get remote-file.txt             # Download file
ls                              # List remote files
lcd C:\local\path              # Change local directory
cd /remote/path                # Change remote directory
exit                           # Exit SFTP
```

### Method 3: rsync (if available)

```powershell
# Install rsync on Windows (via WSL or Cygwin)
# Or use WSL:
wsl rsync -avz /mnt/c/Users/mucha.DESKTOP-H7T9NPM/-modular-saas-platform/ root@157.245.8.131:/var/www/advancia/
```

---

## If SSH Still Doesn't Work - Alternative Deployment Methods

### Option 1: Deploy via Git

**On droplet (via console):**

```bash
# Install git
apt update
apt install -y git

# Clone repository
cd /var/www
git clone https://github.com/YOUR-USERNAME/-modular-saas-platform.git
cd -modular-saas-platform

# Pull latest changes
git pull origin main
```

### Option 2: Use DigitalOcean Spaces

1. Create a DigitalOcean Space (S3-compatible storage)
2. Upload your files to Spaces
3. Download on droplet:

```bash
# On droplet
apt install -y wget
wget https://your-space.nyc3.digitaloceanspaces.com/advancia-deploy.zip
unzip advancia-deploy.zip
```

### Option 3: Docker Deploy

If you're using Docker:

```bash
# On droplet
apt install -y docker.io docker-compose
systemctl start docker
systemctl enable docker

# Pull and run
docker pull YOUR_DOCKER_IMAGE
docker-compose up -d
```

---

## Prevention - Ensure SSH Always Works

Once you have SSH working:

```bash
# 1. Configure firewall properly
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 4000/tcp  # Backend API
ufw allow 3000/tcp  # Frontend dev
ufw enable

# 2. Ensure SSH starts on boot
systemctl enable sshd

# 3. Backup SSH configuration
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# 4. Add multiple SSH keys (for redundancy)
cat >> ~/.ssh/authorized_keys << EOF
ssh-rsa YOUR_BACKUP_KEY user@machine
EOF

# 5. Create a non-root user for deployments
adduser deployer
usermod -aG sudo deployer
mkdir -p /home/deployer/.ssh
cp ~/.ssh/authorized_keys /home/deployer/.ssh/
chown -R deployer:deployer /home/deployer/.ssh
```

---

## Quick Diagnostic Commands

**On Windows (your machine):**

```powershell
# Test basic connectivity
Test-NetConnection -ComputerName 157.245.8.131 -Port 22

# Verbose SSH attempt (shows where it fails)
ssh -vvv root@157.245.8.131

# Check if your key is valid
ssh-keygen -l -f ~\.ssh\id_rsa

# Test with specific key
ssh -i ~\.ssh\advancia_droplet -v root@157.245.8.131
```

**On Droplet (via console):**

```bash
# Check SSH is listening
netstat -tlnp | grep :22
ss -tlnp | grep :22

# Check firewall
ufw status verbose
iptables -L -n

# Check SSH service
systemctl status sshd
journalctl -u sshd -n 50

# Test localhost SSH
ssh root@localhost
```

---

## Immediate Action Plan

1. ✅ **Access droplet via DigitalOcean web console**
2. ✅ **Check and start SSH service**: `systemctl status sshd`
3. ✅ **Configure firewall**: `ufw allow 22/tcp && ufw reload`
4. ✅ **Add your SSH key to** `~/.ssh/authorized_keys`
5. ✅ **Test SSH from Windows**: `ssh root@157.245.8.131`
6. ✅ **Upload files**: `scp file.zip root@157.245.8.131:/root/`
7. ✅ **Proceed with deployment**

---

## Get Your Public Key

**On Windows, run:**

```powershell
# Display your public key
Get-Content ~\.ssh\id_rsa.pub

# Or copy to clipboard
Get-Content ~\.ssh\id_rsa.pub | Set-Clipboard
Write-Host "Public key copied to clipboard!"
```

Then paste it into the droplet's `~/.ssh/authorized_keys` file via the web console.

---

## Need More Help?

If SSH still doesn't work after these steps:

1. **Share the output of:**
   -   `ssh -vvv root@157.245.8.131` (from Windows)
   -   `journalctl -u sshd -n 50` (from droplet console)
   -   `ufw status verbose` (from droplet console)

2. **Check DigitalOcean support**:
   -   Open a support ticket
   -   They can help diagnose droplet-specific issues

3. **Consider droplet rebuild**:
   -   Backup any important data
   -   Destroy and recreate droplet
   -   Ensure SSH key is added during creation

---

## Success Criteria

✅ Can SSH into droplet: `ssh root@157.245.8.131`
✅ Can upload files: `scp file.txt root@157.245.8.131:/root/`
✅ Ready to deploy application

Once these work, proceed with the deployment guide in `DIGITALOCEAN_DROPLET_DEPLOYMENT.md`.
