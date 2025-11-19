# Proxy Configuration - Quick Reference

## 🚀 Quick Start (3 minutes)

### Option 1: Docker SOCKS5 Proxy (Recommended for Development)

```powershell
# Run setup script
.\scripts\setup-proxy.ps1 -Method docker

# Or manually with Docker
docker run -d --name socks5-proxy -p 1080:1080 serjs/go-socks5-proxy

# Test it
.\scripts\test-proxy.ps1
```

**Configuration:**

- Type: SOCKS5
- Host: 127.0.0.1
- Port: 1080
- Auth: None
- Cost: FREE

### Option 2: Residential Proxy (For Production/Testing)

```powershell
# Run setup wizard
.\scripts\setup-proxy.ps1 -Method residential

# Follow prompts to enter credentials from your provider
```

**Recommended Providers:**

- **IPRoyal**: $14/month (2GB) - Budget option
- **Smartproxy**: $75/month (8GB) - Good balance
- **Oxylabs**: $300/month (25GB) - Professional
- **Bright Data**: $500/month (40GB) - Enterprise

---

## 📱 Browser Configuration

### Chrome/Edge (Quick Setup)

1. Install FoxyProxy extension: https://chrome.google.com/webstore
2. Add proxy configuration:
   - **Title**: Advancia Dev
   - **Type**: SOCKS5
   - **Host**: 127.0.0.1
   - **Port**: 1080

### Firefox (Quick Setup)

1. Settings → Network Settings → Manual proxy
2. **SOCKS Host**: 127.0.0.1
3. **Port**: 1080
4. **SOCKS v5**: ✓
5. **Proxy DNS**: ✓

---

## 💻 Backend Integration

### Environment Variables

```bash
# backend/.env
PROXY_ENABLED=true
PROXY_TYPE=socks5
PROXY_HOST=127.0.0.1
PROXY_PORT=1080
# PROXY_USERNAME=     # Optional for authenticated proxies
# PROXY_PASSWORD=     # Optional for authenticated proxies
PROXY_BYPASS=localhost,127.0.0.1
```

### Code Usage

```typescript
import { getProxyClient } from "./utils/proxyClient";

// Get singleton proxy client
const proxyClient = getProxyClient();

// Make requests through proxy
const ip = await proxyClient.getPublicIP();
console.log("Public IP:", ip);

const response = await proxyClient.get("https://api.example.com/data");
console.log("Response:", response);
```

---

## 🧪 Testing

```powershell
# Test proxy connection
.\scripts\test-proxy.ps1

# Test with specific proxy
.\scripts\test-proxy.ps1 -ProxyHost "127.0.0.1" -ProxyPort 1080 -ProxyType "socks5"

# Test with authentication
.\scripts\test-proxy.ps1 -ProxyUsername "user" -ProxyPassword "pass"
```

**Expected Output:**

```
✅ Proxy port is reachable
✅ Direct IP: 203.0.113.1
✅ Proxy IP: 198.51.100.1
✅ IP addresses differ - proxy is working!
✅ Location: New York, United States
✅ Average Latency: 127.45ms
```

---

## 🛠️ Troubleshooting

### Issue: "Cannot connect to proxy"

```powershell
# Check if proxy is running
netstat -ano | Select-String ":1080"

# Test connectivity
Test-NetConnection -ComputerName 127.0.0.1 -Port 1080

# Restart Docker proxy
docker restart socks5-proxy
```

### Issue: "Same IP address"

**Cause**: Proxy not routing traffic
**Solution**:

1. Check `PROXY_ENABLED=true` in `.env`
2. Restart backend
3. Verify proxy bypass list doesn't include target domain

### Issue: "Slow performance"

```powershell
# Test latency
.\scripts\test-proxy.ps1

# If >500ms, consider:
# 1. Use local proxy for development
# 2. Choose closer residential proxy location
# 3. Upgrade proxy plan
```

---

## 📚 Full Documentation

- **Complete Guide**: [PROXY_CONFIGURATION_GUIDE.md](./PROXY_CONFIGURATION_GUIDE.md)
- **Backend Code**: `backend/src/utils/proxyClient.ts`
- **Test Script**: `scripts/test-proxy.ps1`
- **Setup Script**: `scripts/setup-proxy.ps1`

---

## 🔗 Provider Links

### Free/Development

- **Docker SOCKS5**: FREE (included in setup script)
- **SSH Tunnel**: FREE (requires SSH server)

### Residential Proxies

- **IPRoyal**: https://iproyal.com/ ($14/month)
- **Smartproxy**: https://smartproxy.com/ ($75/month)
- **Oxylabs**: https://oxylabs.io/ ($300/month)
- **Bright Data**: https://brightdata.com/ ($500/month)

### Tools

- **FoxyProxy**: https://getfoxyproxy.org/
- **3proxy**: https://github.com/3proxy/3proxy
- **Dante**: http://www.inet.no/dante/

---

## ⚡ Common Commands

```powershell
# Setup local proxy (Docker)
.\scripts\setup-proxy.ps1 -Method docker

# Setup residential proxy
.\scripts\setup-proxy.ps1 -Method residential

# Test proxy
.\scripts\test-proxy.ps1

# Start backend with proxy
cd backend
npm run dev

# Check current IP (through proxy)
curl -x socks5://127.0.0.1:1080 https://api.ipify.org

# Docker proxy management
docker ps | Select-String "socks5"          # Check status
docker logs socks5-proxy                     # View logs
docker restart socks5-proxy                  # Restart
docker stop socks5-proxy                     # Stop
docker rm socks5-proxy                       # Remove
```

---

## 💡 Use Cases

### Development

- Bypass corporate firewalls
- Test API rate limiting
- Debug geolocation features

### Security Testing

- Penetration testing with rotating IPs
- Security scans without exposing origin
- Test WAF rules and rate limiting

### Production

- Webhook delivery through proxies
- External API calls with IP whitelisting
- Compliance testing in different regions

---

## ✅ Checklist

- [ ] Install Docker (for local proxy)
- [ ] Run `.\scripts\setup-proxy.ps1 -Method docker`
- [ ] Update `backend/.env` with proxy settings
- [ ] Test with `.\scripts\test-proxy.ps1`
- [ ] Configure browser proxy (FoxyProxy)
- [ ] Restart backend: `cd backend && npm run dev`
- [ ] Verify proxy working: Check IP change

---

**For detailed instructions, see [PROXY_CONFIGURATION_GUIDE.md](./PROXY_CONFIGURATION_GUIDE.md)**
