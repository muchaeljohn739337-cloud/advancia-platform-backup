# Proxy Configuration Guide

## Overview

This guide covers proxy configuration for the Advancia Pay Ledger platform, including SOCKS proxies, HTTP/HTTPS proxies, and residential proxy integration for development, testing, and security purposes.

---

## 🌐 Use Cases

### Development & Testing

-   **Local development** behind corporate firewalls
-   **API testing** from different geographic locations
-   **Load testing** with distributed IPs
-   **Geolocation testing** for regional features

### Security & Privacy

-   **Penetration testing** with rotating IPs
-   **Security scans** without exposing origin IP
-   **Scraping protection** testing
-   **Rate limiting** validation

### Production Operations

-   **Webhook delivery** through proxies
-   **External API calls** with IP whitelisting
-   **Compliance testing** in different regions

---

## 1️⃣ SOCKS Proxy Configuration

### Browser Configuration (Manual)

#### Chrome/Edge

```
1. Open Settings → System → Open proxy settings
2. Manual proxy configuration:
   - SOCKS Host: 127.0.0.1
   - Port: 1080
   - SOCKS v5: ✓
3. Bypass proxy for: localhost,127.0.0.1
```

#### Firefox

```
1. Settings → General → Network Settings
2. Manual proxy configuration:
   - SOCKS Host: 127.0.0.1
   - Port: 1080
   - SOCKS v5: ✓
   - Proxy DNS when using SOCKS v5: ✓
3. No proxy for: localhost,127.0.0.1
```

### Browser Extension (Recommended)

**FoxyProxy (Chrome/Firefox)**

```json
{
  "name": "Advancia Dev SOCKS",
  "type": "socks5",
  "hostname": "127.0.0.1",
  "port": 1080,
  "username": "",
  "password": "",
  "patternExists": false
}
```

**Install:**

-   Chrome: <https://chrome.google.com/webstore> (search "FoxyProxy")
-   Firefox: <https://addons.mozilla.org/firefox/addon/foxyproxy-standard/>

### System-Wide SOCKS Proxy (Windows)

**PowerShell Script:**

```powershell
# Enable SOCKS proxy
$proxyServer = "socks=127.0.0.1:1080"
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" -Name ProxyEnable -Value 1
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" -Name ProxyServer -Value $proxyServer

# Disable proxy
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" -Name ProxyEnable -Value 0
```

---

## 2️⃣ Residential Proxy Clients

### Option 1: Bright Data (Luminati) - Enterprise

**Installation:**

```powershell
# Download Bright Data Proxy Manager
Invoke-WebRequest -Uri "https://brightdata.com/static/lpm/luminati-proxy-latest-win.exe" -OutFile "$env:TEMP\luminati-proxy.exe"
Start-Process "$env:TEMP\luminati-proxy.exe" -Wait
```

**Configuration:**

```json
{
  "proxy_type": "residential",
  "zone": "residential1",
  "country": "us",
  "state": "ny",
  "city": "newyork",
  "session": true,
  "rotate_session": true
}
```

**Cost:** ~$500/month for 40GB

### Option 2: Oxylabs - Professional

**Installation:**

```powershell
# Install Oxylabs Proxy Client
npm install -g oxylabs-proxy-client
```

**Configuration:**

```javascript
// backend/src/config/proxy.ts
export const oxyLabsConfig = {
  host: "pr.oxylabs.io",
  port: 7777,
  username: process.env.OXYLABS_USERNAME,
  password: process.env.OXYLABS_PASSWORD,
  country: "us",
  sessionId: crypto.randomBytes(8).toString("hex"),
};
```

**Cost:** ~$300/month for 25GB

### Option 3: Smartproxy - Budget-Friendly

**Installation:**

```powershell
# No client needed - HTTP/SOCKS5 endpoints
# Just configure proxy settings
```

**Configuration:**

```bash
# HTTP/HTTPS Proxy
Host: gate.smartproxy.com
Port: 7000
Username: user-YOUR_USERNAME
Password: YOUR_PASSWORD

# SOCKS5 Proxy
Host: gate.smartproxy.com
Port: 10000
Username: user-YOUR_USERNAME
Password: YOUR_PASSWORD
```

**Cost:** ~$75/month for 8GB

### Option 4: IPRoyal - Most Affordable

**Installation:**

```powershell
# Download IPRoyal Pawns client (for residential proxies)
Invoke-WebRequest -Uri "https://iproyal.com/pawns/download?platform=windows" -OutFile "$env:TEMP\iproyal-pawns.exe"
Start-Process "$env:TEMP\iproyal-pawns.exe" -Wait
```

**Configuration:**

```
Host: geo.iproyal.com
Port: 12321
Username: YOUR_USERNAME
Password: YOUR_PASSWORD
Format: username-session-RANDOM:password
```

**Cost:** ~$14/month for 2GB (cheapest option)

---

## 3️⃣ Backend Proxy Integration

### Axios Proxy Configuration

```typescript
// backend/src/utils/proxyClient.ts
import axios, { AxiosInstance } from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";

interface ProxyConfig {
  type: "http" | "https" | "socks4" | "socks5";
  host: string;
  port: number;
  auth?: {
    username: string;
    password: string;
  };
}

export class ProxyClient {
  private axiosInstance: AxiosInstance;

  constructor(proxyConfig: ProxyConfig) {
    const proxyUrl = this.buildProxyUrl(proxyConfig);
    const agent = this.createProxyAgent(proxyConfig, proxyUrl);

    this.axiosInstance = axios.create({
      httpAgent: agent,
      httpsAgent: agent,
      timeout: 30000,
    });
  }

  private buildProxyUrl(config: ProxyConfig): string {
    const auth = config.auth ? `${config.auth.username}:${config.auth.password}@` : "";
    return `${config.type}://${auth}${config.host}:${config.port}`;
  }

  private createProxyAgent(config: ProxyConfig, proxyUrl: string) {
    if (config.type.startsWith("socks")) {
      return new SocksProxyAgent(proxyUrl);
    } else {
      return new HttpsProxyAgent(proxyUrl);
    }
  }

  async get(url: string, options = {}) {
    return this.axiosInstance.get(url, options);
  }

  async post(url: string, data: any, options = {}) {
    return this.axiosInstance.post(url, data, options);
  }
}

// Usage example
export const createProxyClient = () => {
  const proxyConfig: ProxyConfig = {
    type: (process.env.PROXY_TYPE as any) || "socks5",
    host: process.env.PROXY_HOST || "127.0.0.1",
    port: parseInt(process.env.PROXY_PORT || "1080"),
    auth: process.env.PROXY_USERNAME
      ? {
          username: process.env.PROXY_USERNAME,
          password: process.env.PROXY_PASSWORD || "",
        }
      : undefined,
  };

  return new ProxyClient(proxyConfig);
};
```

### Environment Variables

```bash
# backend/.env

# SOCKS5 Proxy (Local)
PROXY_ENABLED=true
PROXY_TYPE=socks5
PROXY_HOST=127.0.0.1
PROXY_PORT=1080

# HTTP/HTTPS Proxy (Residential)
# PROXY_TYPE=https
# PROXY_HOST=gate.smartproxy.com
# PROXY_PORT=7000
# PROXY_USERNAME=user-YOUR_USERNAME
# PROXY_PASSWORD=YOUR_PASSWORD

# Bright Data
# PROXY_TYPE=https
# PROXY_HOST=brd.superproxy.io
# PROXY_PORT=33335
# PROXY_USERNAME=brd-customer-YOUR_CUSTOMER_ID-zone-residential
# PROXY_PASSWORD=YOUR_PASSWORD

# Oxylabs
# PROXY_TYPE=https
# PROXY_HOST=pr.oxylabs.io
# PROXY_PORT=7777
# PROXY_USERNAME=customer-YOUR_USERNAME-cc-us-sessid-RANDOM
# PROXY_PASSWORD=YOUR_PASSWORD
```

---

## 4️⃣ Frontend Proxy Configuration

### Development Server Proxy

```javascript
// frontend/next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.PROXY_ENABLED === "true" ? "https://advanciapayledger.com/api/:path*" : "http://localhost:4000/api/:path*",
      },
    ];
  },

  // Configure proxy for external requests
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Forwarded-For",
            value: process.env.PROXY_IP || "127.0.0.1",
          },
        ],
      },
    ];
  },
};
```

### Browser Fetch with Proxy

```typescript
// frontend/src/utils/proxyFetch.ts
export const proxyFetch = async (url: string, options: RequestInit = {}) => {
  const proxyEnabled = process.env.NEXT_PUBLIC_PROXY_ENABLED === "true";

  if (proxyEnabled && typeof window !== "undefined") {
    // Browser-based proxy detection
    // Note: Browsers don't expose proxy settings to JavaScript
    // This relies on system/browser proxy being configured
    console.log("Using system proxy configuration");
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "X-Proxy-Request": proxyEnabled ? "true" : "false",
    },
  });
};
```

---

## 5️⃣ Testing Proxy Configuration

### Test Script (PowerShell)

```powershell
# scripts/test-proxy.ps1
param(
    [string]$ProxyHost = "127.0.0.1",
    [int]$ProxyPort = 1080,
    [string]$ProxyType = "socks5"
)

Write-Host "🔍 Testing Proxy Configuration" -ForegroundColor Cyan
Write-Host "Proxy: $ProxyType://$ProxyHost:$ProxyPort`n" -ForegroundColor Yellow

# Test 1: Check proxy connectivity
Write-Host "Test 1: Proxy Connectivity" -ForegroundColor Magenta
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect($ProxyHost, $ProxyPort)
    Write-Host "✅ Proxy is reachable" -ForegroundColor Green
    $tcpClient.Close()
} catch {
    Write-Host "❌ Cannot connect to proxy: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Check IP address through proxy
Write-Host "`nTest 2: IP Address Check" -ForegroundColor Magenta
try {
    $env:HTTP_PROXY = "http://$ProxyHost:$ProxyPort"
    $env:HTTPS_PROXY = "http://$ProxyHost:$ProxyPort"

    $response = Invoke-RestMethod -Uri "https://api.ipify.org?format=json"
    Write-Host "✅ Public IP: $($response.ip)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to fetch IP: $_" -ForegroundColor Red
}

# Test 3: Test backend API through proxy
Write-Host "`nTest 3: Backend API Test" -ForegroundColor Magenta
try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/health"
    Write-Host "✅ Backend reachable: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend not reachable: $_" -ForegroundColor Red
}

# Test 4: Geolocation test
Write-Host "`nTest 4: Geolocation Test" -ForegroundColor Magenta
try {
    $response = Invoke-RestMethod -Uri "https://ipapi.co/json/"
    Write-Host "✅ Location: $($response.city), $($response.region), $($response.country_name)" -ForegroundColor Green
    Write-Host "   ISP: $($response.org)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Geolocation check failed: $_" -ForegroundColor Red
}

Write-Host "`n✅ Proxy testing complete!" -ForegroundColor Green
```

### Node.js Test Script

```javascript
// scripts/test-proxy.js
const axios = require("axios");
const { SocksProxyAgent } = require("socks-proxy-agent");

const proxyConfig = {
  host: process.env.PROXY_HOST || "127.0.0.1",
  port: parseInt(process.env.PROXY_PORT || "1080"),
  type: process.env.PROXY_TYPE || "socks5",
};

async function testProxy() {
  console.log("🔍 Testing Proxy Configuration\n");
  console.log(`Proxy: ${proxyConfig.type}://${proxyConfig.host}:${proxyConfig.port}\n`);

  // Create proxy agent
  const proxyUrl = `${proxyConfig.type}://${proxyConfig.host}:${proxyConfig.port}`;
  const agent = new SocksProxyAgent(proxyUrl);

  try {
    // Test 1: IP Address Check
    console.log("Test 1: IP Address Check");
    const ipResponse = await axios.get("https://api.ipify.org?format=json", {
      httpAgent: agent,
      httpsAgent: agent,
    });
    console.log(`✅ Public IP: ${ipResponse.data.ip}\n`);

    // Test 2: Geolocation Check
    console.log("Test 2: Geolocation Check");
    const geoResponse = await axios.get("https://ipapi.co/json/", {
      httpAgent: agent,
      httpsAgent: agent,
    });
    console.log(`✅ Location: ${geoResponse.data.city}, ${geoResponse.data.country_name}`);
    console.log(`   ISP: ${geoResponse.data.org}\n`);

    // Test 3: Backend API Test
    console.log("Test 3: Backend API Test");
    const apiResponse = await axios.get("http://localhost:4000/api/health", {
      httpAgent: agent,
      httpsAgent: agent,
    });
    console.log(`✅ Backend Status: ${apiResponse.data.status}\n`);

    console.log("✅ All proxy tests passed!");
  } catch (error) {
    console.error("❌ Proxy test failed:", error.message);
    process.exit(1);
  }
}

testProxy();
```

---

## 6️⃣ Docker with Proxy

### Dockerfile with Proxy Support

```dockerfile
# backend/Dockerfile.proxy
FROM node:20-alpine

# Proxy build arguments
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY=localhost,127.0.0.1

# Set proxy environment variables
ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}
ENV NO_PROXY=${NO_PROXY}

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies through proxy
RUN npm config set proxy ${HTTP_PROXY} && \
    npm config set https-proxy ${HTTPS_PROXY} && \
    npm install --production

# Copy application files
COPY . .

# Build TypeScript
RUN npm run build

# Unset proxy for runtime (optional)
ENV HTTP_PROXY=
ENV HTTPS_PROXY=

EXPOSE 4000
CMD ["node", "dist/index.js"]
```

### Docker Compose with Proxy

```yaml
# docker-compose.proxy.yml
version: "3.8"

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.proxy
      args:
        HTTP_PROXY: ${HTTP_PROXY:-}
        HTTPS_PROXY: ${HTTPS_PROXY:-}
    environment:
      - PROXY_ENABLED=${PROXY_ENABLED:-false}
      - PROXY_TYPE=${PROXY_TYPE:-socks5}
      - PROXY_HOST=${PROXY_HOST:-host.docker.internal}
      - PROXY_PORT=${PROXY_PORT:-1080}
      - PROXY_USERNAME=${PROXY_USERNAME:-}
      - PROXY_PASSWORD=${PROXY_PASSWORD:-}
    ports:
      - "4000:4000"
    networks:
      - advancia-network

  # SOCKS5 Proxy (Optional - for testing)
  socks-proxy:
    image: serjs/go-socks5-proxy
    ports:
      - "1080:1080"
    networks:
      - advancia-network

networks:
  advancia-network:
    driver: bridge
```

**Build with proxy:**

```powershell
# Set proxy environment variables
$env:HTTP_PROXY = "http://proxy.company.com:8080"
$env:HTTPS_PROXY = "http://proxy.company.com:8080"

# Build and run
docker-compose -f docker-compose.proxy.yml up --build
```

---

## 7️⃣ Security Testing with Proxies

### Rotating Proxy for Security Scans

```typescript
// scripts/security-scan-with-proxy.ts
import { ProxyClient } from "../backend/src/utils/proxyClient";

const proxies = [
  { type: "socks5", host: "127.0.0.1", port: 1080 },
  {
    type: "https",
    host: "gate.smartproxy.com",
    port: 7000,
    auth: { username: "user-xxx", password: "xxx" },
  },
];

let currentProxyIndex = 0;

function getNextProxy() {
  const proxy = proxies[currentProxyIndex];
  currentProxyIndex = (currentProxyIndex + 1) % proxies.length;
  return new ProxyClient(proxy as any);
}

async function runSecurityScanWithRotation() {
  const targets = ["https://advanciapayledger.com/api/auth/login", "https://advanciapayledger.com/api/users", "https://advanciapayledger.com/api/transactions"];

  for (const target of targets) {
    const client = getNextProxy();
    console.log(`Testing ${target} with rotated proxy...`);

    try {
      const response = await client.get(target);
      console.log(`✅ Status: ${response.status}`);
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
    }
  }
}

runSecurityScanWithRotation();
```

---

## 8️⃣ Troubleshooting

### Common Issues

**Issue 1: Connection Refused**

```powershell
# Check if proxy is running
netstat -ano | Select-String ":1080"

# Test connectivity
Test-NetConnection -ComputerName 127.0.0.1 -Port 1080
```

**Issue 2: DNS Resolution**

```powershell
# For SOCKS5, enable DNS through proxy
# Firefox: network.proxy.socks_remote_dns = true
# Chrome: Use --host-resolver-rules="MAP * ~NOTFOUND , EXCLUDE 127.0.0.1"
```

**Issue 3: Authentication Failed**

```powershell
# Verify credentials
curl -x socks5://username:password@host:port https://api.ipify.org
```

**Issue 4: Slow Performance**

```powershell
# Test proxy latency
Measure-Command {
    Invoke-RestMethod -Uri "https://api.ipify.org" -Proxy "http://127.0.0.1:1080"
}
```

---

## 9️⃣ Recommended Setup

### For Development

```powershell
# Local SOCKS5 proxy (free)
docker run -d -p 1080:1080 serjs/go-socks5-proxy

# Configure browser with FoxyProxy extension
# Set environment variables
$env:PROXY_ENABLED = "true"
$env:PROXY_TYPE = "socks5"
$env:PROXY_HOST = "127.0.0.1"
$env:PROXY_PORT = "1080"
```

### For Testing

```powershell
# Use Smartproxy (budget-friendly)
$env:PROXY_TYPE = "https"
$env:PROXY_HOST = "gate.smartproxy.com"
$env:PROXY_PORT = "7000"
$env:PROXY_USERNAME = "user-YOUR_USERNAME"
$env:PROXY_PASSWORD = "YOUR_PASSWORD"
```

### For Production

```powershell
# Use Bright Data (enterprise)
$env:PROXY_TYPE = "https"
$env:PROXY_HOST = "brd.superproxy.io"
$env:PROXY_PORT = "33335"
$env:PROXY_USERNAME = "brd-customer-YOUR_ID-zone-residential"
$env:PROXY_PASSWORD = "YOUR_PASSWORD"
```

---

## 🔟 Cost Comparison

| Provider         | Monthly Cost | Bandwidth | Type        | Best For        |
| ---------------- | ------------ | --------- | ----------- | --------------- |
| **IPRoyal**      | $14          | 2GB       | Residential | Small projects  |
| **Smartproxy**   | $75          | 8GB       | Residential | Medium projects |
| **Oxylabs**      | $300         | 25GB      | Residential | Professional    |
| **Bright Data**  | $500         | 40GB      | Residential | Enterprise      |
| **Local SOCKS5** | Free         | Unlimited | SOCKS5      | Development     |

---

## 📚 Additional Resources

-   **Proxy Protocols**: <https://en.wikipedia.org/wiki/Proxy_server>
-   **SOCKS5 RFC**: <https://tools.ietf.org/html/rfc1928>
-   **FoxyProxy Docs**: <https://getfoxyproxy.org/help/>
-   **Axios Proxy**: <https://axios-http.com/docs/req_config>
-   **Node.js Proxy Agents**: <https://www.npmjs.com/package/proxy-agent>

---

## 📧 Support

For proxy configuration issues:

-   **DevOps Team**: <devops@advanciapayledger.com>
-   **Slack**: #infrastructure (private channel)

---

**Document Version**: 1.0.0  
**Last Updated**: November 18, 2025  
**Author**: DevOps Team
