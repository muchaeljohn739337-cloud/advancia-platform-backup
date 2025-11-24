# Frontend Security Implementation Guide

## 🔒 Complete Security Setup for Advancia Pay

This guide covers implementing comprehensive frontend security including:

-   ✅ User input escaping (XSS prevention)
-   ✅ JWT management in browser (secure storage)
-   ✅ Clickjacking prevention
-   ✅ Token leakage protection
-   ✅ Third-party script abuse prevention

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Input Sanitization](#input-sanitization)
3. [JWT Token Management](#jwt-token-management)
4. [Security Headers & CSP](#security-headers--csp)
5. [React Components Examples](#react-components-examples)
6. [Testing Security](#testing-security)
7. [Monitoring & Alerts](#monitoring--alerts)

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd frontend
npm install dompurify
npm install --save-dev @types/dompurify
```

### Step 2: Initialize Security in App

**File: `frontend/src/app/layout.tsx`** (or `_app.tsx` for Pages Router)

```tsx
"use client";

import { useEffect } from "react";
import { initializeSecurity } from "@/lib/security";

export default function RootLayout({ children }) {
  useEffect(() => {
    // Initialize all security protections
    initializeSecurity({
      allowedScriptDomains: ["vercel.live", "cdn.jsdelivr.net"],
      enableClickjackingProtection: true,
      enableTokenLeakageProtection: true,
    });
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Step 3: Update Environment Variables

**File: `frontend/.env.local`**

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_ENABLE_SECURITY=true
```

---

## 🛡️ Input Sanitization

### Basic Usage

```tsx
import { InputSecurity } from "@/lib/security";

// Sanitize user input
const userInput = "<script>alert('xss')</script>Hello";
const safe = InputSecurity.sanitizeInput(userInput);
// Result: "Hello"

// Sanitize email
const email = InputSecurity.sanitizeEmail("user@example.com");

// Sanitize URL
const url = InputSecurity.sanitizeURL("https://example.com");

// Sanitize HTML (allow specific tags)
const html = InputSecurity.sanitizeHTML("<p>Hello <script>bad()</script></p>", ["p", "strong", "em"]);
// Result: "<p>Hello </p>"
```

### React Hook Usage

```tsx
import { useSafeInput } from "@/hooks/useSecurity";

function UserProfileForm() {
  const { sanitize, sanitizeEmail } = useSafeInput();
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Sanitize before sending to API
    const safeName = sanitize(name);
    const safeEmail = sanitizeEmail(email);

    // Now safe to send
    api.updateProfile({ name: safeName, email: safeEmail });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      <button type="submit">Save</button>
    </form>
  );
}
```

### Safe HTML Rendering

```tsx
import { useSafeHTML } from "@/hooks/useSecurity";

function BlogPost({ content }) {
  // Sanitize HTML content
  const safeContent = useSafeHTML(content, ["p", "strong", "em", "a", "ul", "li"]);

  return <div dangerouslySetInnerHTML={{ __html: safeContent }} />;
}
```

---

## 🔐 JWT Token Management

### Setup Authentication

```tsx
"use client";

import { useAuth } from "@/hooks/useSecurity";
import { useRouter } from "next/navigation";

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.token) {
        // Store token securely
        login(data.token, data.expiresIn || 3600);
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (isAuthenticated) {
    router.push("/dashboard");
    return null;
  }

  return <form onSubmit={handleLogin}>{/* Form fields */}</form>;
}
```

### Protected Route

```tsx
"use client";

import { useAuth } from "@/hooks/useSecurity";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      {/* Protected content */}
    </div>
  );
}
```

### Secure API Calls

```tsx
import { useSecureAPI } from "@/hooks/useSecurity";

function UserProfile() {
  const { secureFetch } = useSecureAPI();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Token automatically injected
        const response = await secureFetch("/api/users/profile");
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    };

    loadProfile();
  }, []);

  return (
    <div>
      {profile && (
        <div>
          <h2>{profile.name}</h2>
          <p>{profile.email}</p>
        </div>
      )}
    </div>
  );
}
```

### Logout

```tsx
import { useAuth } from "@/hooks/useSecurity";

function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout(); // Clears all tokens securely
    router.push("/login");
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

---

## 🛡️ Security Headers & CSP

### Content Security Policy (CSP)

The middleware in `frontend/src/middleware.ts` automatically sets:

-   ✅ **script-src**: Blocks inline scripts (except whitelisted)
-   ✅ **frame-ancestors**: Prevents clickjacking
-   ✅ **default-src**: Restricts to same-origin
-   ✅ **connect-src**: Controls API endpoints
-   ✅ **img-src**: Allows images from trusted sources

### Clickjacking Protection

Automatically enabled via:

1. **X-Frame-Options: DENY** header
2. **CSP frame-ancestors 'none'**
3. **JavaScript frame-busting** in security.ts

### Testing CSP

Open browser console and check for violations:

```javascript
// This should be blocked by CSP
const script = document.createElement("script");
script.src = "https://evil.com/malicious.js";
document.body.appendChild(script);
// ❌ Blocked: CSP violation reported
```

---

## 🧪 Testing Security

### Test XSS Prevention

```tsx
// Test component
function XSSTest() {
  const maliciousInput = `<img src=x onerror="alert('XSS')">`;
  const safe = InputSecurity.sanitizeInput(maliciousInput);

  return <div>{safe}</div>; // Safe: no script execution
}
```

### Test Token Management

```typescript
import { TokenManager } from "@/lib/security";

// Test token storage
TokenManager.setToken("test.jwt.token", 3600);
const token = TokenManager.getToken();
console.log("Token stored:", !!token);

// Test expiry
setTimeout(() => {
  console.log("Token expired:", TokenManager.isTokenExpired());
}, 3700000);

// Test token clearing
TokenManager.clearTokens();
console.log("Tokens cleared:", !TokenManager.getToken());
```

### Test Clickjacking Protection

Open your site in an iframe:

```html
<!-- test-iframe.html -->
<!DOCTYPE html>
<html>
  <body>
    <iframe src="http://localhost:3000"></iframe>
  </body>
</html>
```

Result: Your app should break out of the iframe or refuse to load.

---

## 📊 Monitoring & Alerts

### Security Dashboard Component

```tsx
"use client";

import { useSecurityMonitor } from "@/hooks/useSecurity";

function SecurityDashboard() {
  const { violations } = useSecurityMonitor();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Security Events</h2>

      {violations.length === 0 ? (
        <p className="text-green-600">✅ No security violations detected</p>
      ) : (
        <ul className="space-y-2">
          {violations.map((v, i) => (
            <li key={i} className="p-4 bg-red-50 border border-red-200 rounded">
              <strong>{v.type}:</strong> {v.directive || v.blockedURI}
              <br />
              <small className="text-gray-500">{new Date(v.timestamp).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Check Backend Logs

Security events are logged to backend:

```bash
# View security logs
cd backend
tail -f logs/combined.log | grep -i "security\|csp\|xss\|violation"
```

---

## ✅ Security Checklist

Before deploying to production:

-   [ ] CSP headers configured in `middleware.ts`
-   [ ] `initializeSecurity()` called in app root
-   [ ] All user inputs sanitized with `InputSecurity`
-   [ ] JWTs stored via `TokenManager` (not plain localStorage)
-   [ ] Protected routes check `isAuthenticated`
-   [ ] API calls use `secureFetch` hook
-   [ ] Clickjacking protection tested
-   [ ] CSP violations monitored
-   [ ] Security events logged to backend
-   [ ] DOMPurify installed for HTML sanitization
-   [ ] No secrets in frontend code or localStorage
-   [ ] HTTPS enforced in production

---

## 🔧 Advanced Configuration

### Custom CSP Policy

**File: `frontend/src/middleware.ts`**

```typescript
// Add custom domains to CSP
const cspDirectives = ["default-src 'self'", "script-src 'self' https://trusted-cdn.com", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", "img-src 'self' data: https:", "connect-src 'self' https://api.advanciapayledger.com", "frame-ancestors 'none'"].join("; ");
```

### Custom Token Encryption

**File: `frontend/src/lib/security.ts`**

```typescript
// Replace basic XOR with Web Crypto API (more secure)
private static async encryptToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);

  // Generate key from device fingerprint
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(this.getDeviceFingerprint()),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('advancia-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  return btoa(String.fromCharCode(...iv, ...new Uint8Array(encrypted)));
}
```

---

## 🆘 Troubleshooting

### Issue: CSP blocking legitimate scripts

**Solution:** Add domain to `allowedScriptDomains` in `initializeSecurity()`:

```tsx
initializeSecurity({
  allowedScriptDomains: [
    "vercel.live",
    "cdn.jsdelivr.net",
    "your-trusted-cdn.com", // Add here
  ],
});
```

### Issue: Token not persisting across refreshes

**Solution:** Use `localStorage` for refresh tokens:

```typescript
// In TokenManager class
static setRefreshToken(token: string): void {
  const encrypted = this.encryptToken(token);
  localStorage.setItem(this.REFRESH_KEY, encrypted);
}
```

### Issue: Clickjacking protection breaking legitimate iframes

**Solution:** Update CSP frame-ancestors:

```typescript
// Allow specific parent domains
"frame-ancestors 'self' https://trusted-parent.com";
```

---

## 📚 Additional Resources

-   [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
-   [Content Security Policy Reference](https://content-security-policy.com/)
-   [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
-   [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)

---

## 🎯 Next Steps

1. ✅ Review all files created
2. Install DOMPurify: `npm install dompurify`
3. Update `frontend/src/app/layout.tsx` with security init
4. Test XSS prevention with malicious inputs
5. Test clickjacking protection in iframe
6. Deploy and monitor security events
7. Set up alerts for critical violations

---

**🔒 Security is a continuous process. Regularly review and update these implementations as threats evolve.**
