# Install Dependencies - Windows Recovery Guide

Your system has corrupted PowerShell and WSL. Follow these steps in order:

## Step 1: Restart Computer

**This fixes 60% of WSL/PowerShell issues**

-   Save work, reboot Windows
-   After restart, try `wsl` command again

## Step 2: Install Node.js (Windows Native)

**Download and run installer:**

-   Go to: <https://nodejs.org/en/download/>
-   Download "Windows Installer (.msi)" - LTS version
-   Run installer with default options
-   Restart VS Code after installation
-   Test: Open new PowerShell and run `node --version`

## Step 3: Install Git (Windows Native)

**Download and run installer:**

-   Go to: <https://git-scm.com/download/win>
-   Download 64-bit Git for Windows Setup
-   Run installer with default options (keep "Git Bash" option)
-   Restart VS Code
-   Test: Run `git --version`

## Step 4: Install Docker Desktop

**Download and run installer:**

-   Go to: <https://www.docker.com/products/docker-desktop/>
-   Download Docker Desktop for Windows
-   Run installer (requires restart)
-   Docker will automatically fix WSL kernel during installation
-   After restart, open Docker Desktop to complete setup

## Step 5: Fix WSL (if still broken)

**Run in Command Prompt as Administrator:**

```cmd
wsl --shutdown
wsl --update --web-download
wsl --set-default-version 2
```

**If that fails, reinstall WSL components:**

```cmd
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

Then restart computer.

## Step 6: Verify Everything Works

**In new terminal (PowerShell or CMD):**

```bash
node --version
npm --version
git --version
docker --version
wsl echo "WSL works"
```

## Alternative: Use Git Bash

After installing Git, you can use **Git Bash** terminal instead of PowerShell:

-   In VS Code: Terminal → New Terminal → Select "Git Bash" from dropdown
-   This bypasses PowerShell corruption entirely

## Quick Start After Installation

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Run verification
cd ../backend && npm run verify:production

# Start development
npm run dev
```

All installations are **free** and from official sources.
