#!/usr/bin/env pwsh
# Quick Proxy Setup Script
# Installs and configures SOCKS5 proxy for development

param(
    [ValidateSet("docker", "manual", "residential")]
    [string]$Method = "docker",
    [int]$Port = 1080
)

$ErrorActionPreference = "Stop"

Write-Host "`n🚀 Proxy Setup Wizard" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Method: $Method" -ForegroundColor Yellow
Write-Host "Port: $Port`n" -ForegroundColor Yellow

## Method 1: Docker SOCKS5 Proxy (Easiest)
if ($Method -eq "docker") {
    Write-Host "📦 Setting up SOCKS5 proxy with Docker..." -ForegroundColor Magenta
    
    # Check if Docker is running
    try {
        docker ps | Out-Null
        Write-Host "✅ Docker is running" -ForegroundColor Green
    } catch {
        Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
        Write-Host "   Download: https://www.docker.com/products/docker-desktop/" -ForegroundColor Gray
        exit 1
    }
    
    # Stop existing proxy container if running
    Write-Host "`nStopping existing proxy containers..." -ForegroundColor Yellow
    docker stop socks5-proxy 2>$null
    docker rm socks5-proxy 2>$null
    
    # Run SOCKS5 proxy container
    Write-Host "`nStarting SOCKS5 proxy on port $Port..." -ForegroundColor Yellow
    docker run -d `
        --name socks5-proxy `
        --restart unless-stopped `
        -p ${Port}:1080 `
        serjs/go-socks5-proxy
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SOCKS5 proxy started successfully!" -ForegroundColor Green
        Write-Host "`nProxy Details:" -ForegroundColor Cyan
        Write-Host "  Type: SOCKS5" -ForegroundColor White
        Write-Host "  Host: 127.0.0.1" -ForegroundColor White
        Write-Host "  Port: $Port" -ForegroundColor White
        Write-Host "  Auth: None (no authentication required)" -ForegroundColor White
        
        # Update .env file
        Write-Host "`nUpdating .env files..." -ForegroundColor Yellow
        $envContent = @"

# Proxy Configuration (Auto-configured by setup-proxy.ps1)
PROXY_ENABLED=true
PROXY_TYPE=socks5
PROXY_HOST=127.0.0.1
PROXY_PORT=$Port
# PROXY_USERNAME=
# PROXY_PASSWORD=
PROXY_BYPASS=localhost,127.0.0.1
"@
        
        $backendEnvPath = "backend\.env"
        if (Test-Path $backendEnvPath) {
            # Remove existing proxy config
            $content = Get-Content $backendEnvPath -Raw
            $content = $content -replace "(?ms)^# Proxy Configuration.*?PROXY_BYPASS=.*?$", ""
            $content = $content.Trim()
            $content + "`n" + $envContent | Set-Content $backendEnvPath
            Write-Host "✅ Updated $backendEnvPath" -ForegroundColor Green
        } else {
            Write-Host "⚠️ backend\.env not found, creating..." -ForegroundColor Yellow
            $envContent | Set-Content $backendEnvPath
            Write-Host "✅ Created $backendEnvPath" -ForegroundColor Green
        }
        
        # Test the proxy
        Write-Host "`n🧪 Testing proxy connection..." -ForegroundColor Magenta
        Start-Sleep -Seconds 2
        & "$PSScriptRoot\test-proxy.ps1" -ProxyHost "127.0.0.1" -ProxyPort $Port -ProxyType "socks5"
        
    } else {
        Write-Host "❌ Failed to start proxy container" -ForegroundColor Red
        exit 1
    }
}

## Method 2: Manual Installation
elseif ($Method -eq "manual") {
    Write-Host "📝 Manual Setup Instructions" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "Option A: 3proxy (Windows)" -ForegroundColor Cyan
    Write-Host "------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "1. Download: https://github.com/3proxy/3proxy/releases" -ForegroundColor White
    Write-Host "2. Extract to C:\3proxy\" -ForegroundColor White
    Write-Host "3. Create C:\3proxy\3proxy.cfg:" -ForegroundColor White
    Write-Host @"
    nserver 8.8.8.8
    nscache 65536
    timeouts 1 5 30 60 180 1800 15 60
    log
    socks -p$Port
"@ -ForegroundColor Gray
    Write-Host "4. Run: C:\3proxy\3proxy.exe C:\3proxy\3proxy.cfg" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Option B: Dante (Linux/WSL)" -ForegroundColor Cyan
    Write-Host "------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "1. Install: sudo apt-get install dante-server" -ForegroundColor White
    Write-Host "2. Configure /etc/danted.conf" -ForegroundColor White
    Write-Host "3. Start: sudo systemctl start danted" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Option C: SSH Tunnel (Any OS)" -ForegroundColor Cyan
    Write-Host "------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "ssh -D $Port -N -f user@remote-server.com" -ForegroundColor White
    Write-Host ""
}

## Method 3: Residential Proxy Setup
elseif ($Method -eq "residential") {
    Write-Host "🌍 Residential Proxy Setup" -ForegroundColor Magenta
    Write-Host ""
    
    Write-Host "Step 1: Choose a Provider" -ForegroundColor Cyan
    Write-Host "------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "💰 Budget Options:" -ForegroundColor Yellow
    Write-Host "  • IPRoyal: $14/month (2GB) - https://iproyal.com/" -ForegroundColor White
    Write-Host "  • Smartproxy: $75/month (8GB) - https://smartproxy.com/" -ForegroundColor White
    Write-Host ""
    Write-Host "💼 Professional Options:" -ForegroundColor Yellow
    Write-Host "  • Oxylabs: $300/month (25GB) - https://oxylabs.io/" -ForegroundColor White
    Write-Host "  • Bright Data: $500/month (40GB) - https://brightdata.com/" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Step 2: Get Your Credentials" -ForegroundColor Cyan
    Write-Host "------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "After signing up, you'll receive:" -ForegroundColor White
    Write-Host "  • Proxy Host (e.g., gate.smartproxy.com)" -ForegroundColor White
    Write-Host "  • Proxy Port (e.g., 7000)" -ForegroundColor White
    Write-Host "  • Username (e.g., user-YOUR_USERNAME)" -ForegroundColor White
    Write-Host "  • Password" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Step 3: Configure Environment Variables" -ForegroundColor Cyan
    Write-Host "------------------------------------------------------------" -ForegroundColor Gray
    
    $provider = Read-Host "Which provider? (smartproxy/oxylabs/brightdata/iproyal)"
    $username = Read-Host "Enter username"
    $password = Read-Host "Enter password" -AsSecureString
    $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
    )
    
    $proxyHost = switch ($provider) {
        "smartproxy" { "gate.smartproxy.com"; break }
        "oxylabs" { "pr.oxylabs.io"; break }
        "brightdata" { "brd.superproxy.io"; break }
        "iproyal" { "geo.iproyal.com"; break }
        default { Read-Host "Enter proxy host" }
    }
    
    $proxyPort = switch ($provider) {
        "smartproxy" { 7000; break }
        "oxylabs" { 7777; break }
        "brightdata" { 33335; break }
        "iproyal" { 12321; break }
        default { Read-Host "Enter proxy port" }
    }
    
    $envContent = @"

# Residential Proxy Configuration (Provider: $provider)
PROXY_ENABLED=true
PROXY_TYPE=https
PROXY_HOST=$proxyHost
PROXY_PORT=$proxyPort
PROXY_USERNAME=$username
PROXY_PASSWORD=$passwordPlain
PROXY_BYPASS=localhost,127.0.0.1
"@
    
    $backendEnvPath = "backend\.env"
    if (Test-Path $backendEnvPath) {
        $content = Get-Content $backendEnvPath -Raw
        $content = $content -replace "(?ms)^# .*?Proxy Configuration.*?PROXY_BYPASS=.*?$", ""
        $content = $content.Trim()
        $content + "`n" + $envContent | Set-Content $backendEnvPath
        Write-Host "`n✅ Updated $backendEnvPath" -ForegroundColor Green
    }
    
    Write-Host "`n🧪 Testing proxy connection..." -ForegroundColor Magenta
    & "$PSScriptRoot\test-proxy.ps1" -ProxyHost $proxyHost -ProxyPort $proxyPort -ProxyType "https" -ProxyUsername $username -ProxyPassword $passwordPlain
}

Write-Host "`n✅ Proxy setup complete!" -ForegroundColor Green
Write-Host "`n📚 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Restart your backend: cd backend && npm run dev" -ForegroundColor White
Write-Host "  2. Test proxy: .\scripts\test-proxy.ps1" -ForegroundColor White
Write-Host "  3. Configure browser proxy (see PROXY_CONFIGURATION_GUIDE.md)" -ForegroundColor White
Write-Host ""
