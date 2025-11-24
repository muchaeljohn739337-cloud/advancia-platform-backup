# Frontend Security - Quick Reference Card

## 🚀 One-Time Setup

```bash
# Install dependencies
cd frontend
npm install dompurify @types/dompurify
```

```tsx
// Add to frontend/src/app/layout.tsx
import { initializeSecurity } from "@/lib/security";

useEffect(() => {
  initializeSecurity({
    allowedScriptDomains: ["vercel.live", "cdn.jsdelivr.net"],
    enableClickjackingProtection: true,
    enableTokenLeakageProtection: true,
  });
}, []);
```

---

## 🔒 Common Use Cases

### 1. Sanitize User Input (XSS Prevention)

```tsx
import { InputSecurity } from "@/lib/security";

// Text input
const safeName = InputSecurity.sanitizeInput(userInput);

// Email
const safeEmail = InputSecurity.sanitizeEmail(email);

// URL
const safeURL = InputSecurity.sanitizeURL(url);

// HTML with allowed tags
const safeHTML = InputSecurity.sanitizeHTML(html, ["p", "strong", "em"]);
```

### 2. Login & JWT Storage

```tsx
import { useAuth } from "@/hooks/useSecurity";

const { login, logout, isAuthenticated, getToken } = useAuth();

// Login
const handleLogin = async (token: string) => {
  login(token, 3600); // 3600 seconds = 1 hour
};

// Logout
const handleLogout = () => {
  logout(); // Clears all tokens securely
};

// Check auth
if (isAuthenticated) {
  // User is logged in
}
```

### 3. Secure API Calls

```tsx
import { useSecureAPI } from "@/hooks/useSecurity";

const { secureFetch } = useSecureAPI();

// Automatic token injection + URL validation
const response = await secureFetch("/api/profile");
const data = await response.json();
```

### 4. Safe HTML Rendering

```tsx
import { useSafeHTML } from "@/hooks/useSecurity";

const safeContent = useSafeHTML(userHTML, ["p", "strong", "em", "a"]);

return <div dangerouslySetInnerHTML={{ __html: safeContent }} />;
```

### 5. Safe External Links

```tsx
import { useSafeLink } from "@/hooks/useSecurity";

const { openSafeLink } = useSafeLink();

<button onClick={() => openSafeLink("https://example.com")}>Visit Site</button>;
```

---

## 🛡️ Security Features Enabled

| Feature                  | Status | Auto-Enabled     |
| ------------------------ | ------ | ---------------- |
| XSS Prevention           | ✅     | Via sanitization |
| JWT Encryption           | ✅     | Via TokenManager |
| Clickjacking Protection  | ✅     | Via init         |
| Token Leakage Prevention | ✅     | Via init         |
| CSP Headers              | ✅     | Via middleware   |
| Script Monitoring        | ✅     | Via init         |
| Frame-Busting            | ✅     | Via init         |
| URL Sanitization         | ✅     | Manual call      |

---

## 🧪 Quick Tests

```typescript
// Test XSS prevention
InputSecurity.sanitizeInput('<script>alert("xss")</script>Hello');
// Returns: "Hello"

// Test token encryption
TokenManager.setToken("test.jwt.token", 3600);
console.log(sessionStorage.getItem("__auth_token"));
// Should see encrypted value

// Test URL validation
InputSecurity.sanitizeURL('javascript:alert("xss")');
// Returns: null (blocked)
```

---

## 📊 Monitor Security Events

```tsx
import { useSecurityMonitor } from "@/hooks/useSecurity";

const { violations } = useSecurityMonitor();

// Display CSP violations
violations.map((v) => (
  <div>
    {v.type}: {v.blockedURI}
  </div>
));
```

---

## ⚠️ Common Mistakes to Avoid

❌ **DON'T:**

```tsx
// Plain localStorage for tokens
localStorage.setItem("token", jwt); // INSECURE!

// No sanitization
<div>{userInput}</div>; // XSS RISK!

// Plain fetch without token
fetch("/api/data"); // No auth!
```

✅ **DO:**

```tsx
// Use TokenManager
TokenManager.setToken(jwt, 3600); // Encrypted!

// Always sanitize
<div>{InputSecurity.sanitizeInput(userInput)}</div>; // Safe!

// Use secureFetch
secureFetch("/api/data"); // Token auto-injected!
```

---

## 🔧 Configuration

### Allow Custom Script Domain

```tsx
initializeSecurity({
  allowedScriptDomains: [
    "vercel.live",
    "cdn.jsdelivr.net",
    "your-cdn.com", // Add here
  ],
});
```

### Custom CSP

Edit `frontend/src/middleware.ts`:

```typescript
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' https://your-cdn.com",
  // Add more directives
].join("; ");
```

---

## 📚 Documentation

-   **Full Guide:** `FRONTEND_SECURITY_GUIDE.md`
-   **Implementation Summary:** `FRONTEND_SECURITY_IMPLEMENTATION.md`
-   **Example Login:** `frontend/src/components/examples/SecureLogin.tsx`
-   **Example Profile:** `frontend/src/components/examples/SafeUserProfile.tsx`

---

## 🆘 Quick Troubleshooting

| Problem              | Solution                     |
| -------------------- | ---------------------------- |
| DOMPurify error      | `npm install dompurify`      |
| CSP blocking scripts | Add domain to whitelist      |
| Token not persisting | Check SessionStorage enabled |
| Iframe blocked       | Update CSP `frame-ancestors` |

---

## ✅ Pre-Deploy Checklist

-   [ ] DOMPurify installed
-   [ ] `initializeSecurity()` in app root
-   [ ] All inputs sanitized
-   [ ] Using `TokenManager` for auth
-   [ ] Using `secureFetch` for APIs
-   [ ] Tested XSS prevention
-   [ ] Tested clickjacking protection
-   [ ] CSP headers verified
-   [ ] No secrets in localStorage

---

**🔒 Security is now fully configured and ready!**

Keep this card handy for quick reference during development.
