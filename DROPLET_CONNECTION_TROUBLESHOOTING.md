# 🔧 DigitalOcean Droplet Connection Troubleshooting

## Problem

Cannot SSH/upload files to droplet at `157.245.8.131` - connection times out.

## Common Causes & Solutions

### 1. ✅ Droplet Firewall (Most Likely)

DigitalOcean droplets have a built-in firewall (UFW) that may be blocking SSH access.

**Solution A - Via DigitalOcean Console:**

1. Go to [DigitalOcean Dashboard](https://cloud.digitalocean.com)
2. Navigate to your droplet
3. Click **"Access"** → **"Launch Droplet Console"**
4. Login with root credentials
5. Run these commands:

```bash
# Check firewall status
sudo ufw status

# If firewall is active and SSH not allowed:
sudo ufw allow 22/tcp
sudo ufw allow OpenSSH
sudo ufw reload

# Check again
sudo ufw status
```

**Solution B - Disable Firewall Temporarily:**

```bash
# Via console
sudo ufw disable
```

Then try SSH from your local machine:

```powershell
ssh root@157.245.8.131
```

Once connected, re-enable with proper rules:

```bash
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

---

### 2. ✅ DigitalOcean Cloud Firewall

Check if a Cloud Firewall is blocking access.

**Fix:**

1. Go to DigitalOcean Dashboard → **Networking** → **Firewalls**
2. Check if any firewall is applied to your droplet
3. Either:
   - **Add your IP**: Add inbound rule for SSH (port 22) from your IP
   - **Remove firewall**: Temporarily remove firewall from droplet
   - **Allow all SSH**: Add rule for `0.0.0.0/0` on port 22 (less secure)

**Recommended Rule:**

- Type: SSH
- Protocol: TCP
- Port: 22
- Sources: Your IP address (find at https://whatismyipaddress.com)

---

### 3. ✅ SSH Key Authentication Issues

**Check if you have SSH keys:**

```powershell
# Check for SSH keys
ls ~\.ssh\

# You should see: id_rsa, id_rsa.pub (or id_ed25519, id_ed25519.pub)
```

**If no keys exist, generate them:**

```powershell
# Generate new SSH key
ssh-keygen -t ed25519 -C "your-email@example.com"

# Press Enter for default location
# Press Enter for no passphrase (or set one)
```

**Add key to DigitalOcean:**

1. Copy your public key:

```powershell
Get-Content ~\.ssh\id_ed25519.pub | clip
```

2. Go to DigitalOcean → **Settings** → **Security** → **SSH Keys**
3. Click **"Add SSH Key"**
4. Paste key and save

**Add key to existing droplet:**

Via console:

```bash
mkdir -p ~/.ssh
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

---

### 4. ✅ Droplet is Off or Rebuilding

**Check droplet status:**

1. Go to DigitalOcean Dashboard
2. Check droplet status - should show **"Active"** (green dot)
3. If **"Off"**: Click **"Power On"**
4. If **"Rebuilding"**: Wait for it to complete

---

### 5. ✅ Wrong IP Address

**Verify IP address:**

1. Go to DigitalOcean Dashboard
2. Click on your droplet
3. Confirm IP address matches `157.245.8.131`

---

### 6. ✅ Network/ISP Blocking

Your ISP or network might be blocking SSH (port 22).

**Test:**

```powershell
# Test if port 22 is reachable
Test-NetConnection -ComputerName 157.245.8.131 -Port 22
```

**Alternative - Use Different Port:**

If your network blocks port 22, configure SSH on a different port (via console):

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Change line:
Port 2222

# Restart SSH
sudo systemctl restart sshd

# Allow in firewall
sudo ufw allow 2222/tcp
```

Then connect with:

```powershell
ssh -p 2222 root@157.245.8.131
```

---

### 7. ✅ Windows Firewall

Check if Windows Firewall is blocking outbound SSH.

**Solution:**

```powershell
# Run PowerShell as Administrator
New-NetFirewallRule -DisplayName "Allow SSH Outbound" -Direction Outbound -Protocol TCP -LocalPort 22 -Action Allow
```

---

## Quick Diagnostic Steps

### Step 1: Check Basic Connectivity

```powershell
# Ping droplet
ping 157.245.8.131

# Test SSH port (should show "TcpTestSucceeded : True")
Test-NetConnection -ComputerName 157.245.8.131 -Port 22
```

### Step 2: Try SSH with Verbose Output

```powershell
ssh -vvv root@157.245.8.131
```

Look for error messages in the output.

### Step 3: Check DigitalOcean Console

1. Login to DigitalOcean
2. Go to droplet → **"Access"** → **"Launch Droplet Console"**
3. This works even if SSH is blocked
4. Check firewall and SSH service status

---

## Working Solutions

### Once You Can Connect

**Test upload:**

```powershell
# Create test file
echo "test" > test.txt

# Upload with SCP
scp test.txt root@157.245.8.131:/root/

# Verify
ssh root@157.245.8.131 "ls -la /root/test.txt"
```

**Upload your deployment archive:**

```powershell
# Create archive if not exists
$ProjectPath = "C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform"
$ArchivePath = "C:\Users\mucha.DESKTOP-H7T9NPM\advancia-deploy.zip"
Compress-Archive -Path "$ProjectPath\*" -DestinationPath $ArchivePath -Force

# Upload to droplet
scp $ArchivePath root@157.245.8.131:/root/
```

---

## Alternative Upload Methods (If SSH Doesn't Work)

### Method 1: Use DigitalOcean Spaces + wget

1. Upload files to DigitalOcean Spaces (S3-compatible storage)
2. Download from droplet:

```bash
# On droplet
wget https://your-space-url.digitaloceanspaces.com/advancia-deploy.zip
```

### Method 2: GitHub Deploy

1. Push your code to GitHub
2. On droplet, pull from GitHub:

```bash
cd /var/www
git clone https://github.com/your-username/your-repo.git
```

### Method 3: DigitalOcean Agent Upload

Use the droplet console to paste small files directly.

---

## Prevention

Once SSH works, ensure it stays working:

```bash
# Configure firewall properly
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status

# Ensure SSH starts on boot
sudo systemctl enable sshd

# Backup SSH configuration
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
```

---

## Next Steps After Connection Works

1. ✅ Upload deployment files
2. ✅ Run deployment script
3. ✅ Configure services (Nginx, PM2, PostgreSQL)
4. ✅ Set up SSL with Let's Encrypt
5. ✅ Configure automated deployments

See: `DIGITALOCEAN_DROPLET_DEPLOYMENT.md` for full deployment guide.

---

## Get Help

If still having issues:

1. Share output of:
   - `Test-NetConnection -ComputerName 157.245.8.131 -Port 22`
   - `ssh -vvv root@157.245.8.131`
2. Check DigitalOcean droplet status
3. Try accessing via DigitalOcean console first
