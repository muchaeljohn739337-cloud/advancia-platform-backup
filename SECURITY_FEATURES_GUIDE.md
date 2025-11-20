# Security Features - Breach Alert & IP Protection

## 🛡️ Overview

Professional security suite inspired by VeePN's security features:

1. **Breach Alert Monitoring** - Scan for email data breaches across 317+ breach databases
2. **IP Protection & Rotation** - Mask your real IP and rotate to different countries for anonymity

---

## 📁 Files Created

### 1. **Breach Alert Page**

**Location:** `frontend/src/app/security/breach-alert/page.tsx`

**Features:**

- **317 data breaches detected** banner with red alert styling
- **Email breach list** showing:
  - Email addresses with breach counts
  - Red warning icons for high-risk accounts (>5 breaches)
  - Click to view detailed breach sources
- **Breach source details** with:
  - Source website names (forum.btcsec.com, modbsolutions.com, etc.)
  - Leak counts per source
  - Breach dates
  - Source-specific icons (🔓, 💳, 📧, etc.)
- **Category tabs:**
  - Email (active, shows breach count)
  - Phone number (premium, grayed out)
  - Credit card (premium, grayed out)
  - SSN/ID (premium, grayed out)
- **24/7 Monitoring activation** - Blue "Activate" button with Shield icon
- **Protection recommendations:**
  - Change Passwords (CheckCircle icon)
  - Enable 2FA (Shield icon)
  - Monitor Activity (AlertTriangle icon)

**Design:**

- Red gradient alert banner
- Two-column layout: Email list (left) + Breach details (right)
- White cards with shadow and hover effects
- Green "24/7 Active" badge when monitoring enabled
- Blue gradient recommendations section at bottom

### 2. **IP Protection Page**

**Location:** `frontend/src/app/security/ip-protection/page.tsx`

**Features:**

- **Your IP Status card:**
  - Current IP: 197.211.52.75 (with show/hide toggle)
  - ISP: Globacom
  - Location: Lagos, Nigeria
  - Status: Unprotected → Protected (toggle)
  - Refresh button to check current IP
- **IP Rotation:**
  - Country selector dropdown (🇺🇸 US, 🇬🇧 UK, 🇩🇪 DE, 🇫🇷 FR, 🇨🇦 CA, 🇦🇺 AU, 🇯🇵 JP, 🇸🇬 SG)
  - "Rotate IP Now" button with animated spinner
  - Success message showing new masked location
- **Protection Features (3 cards):**
  - VPN Protection - Encrypts traffic through secure servers
  - Proxy Server - Masks IP through proxy network
  - Location Masking - Hides real geographical location
  - Each shows ACTIVE badge when enabled (green background)
- **Enable/Disable Protection** toggle button (top right)
- **Why IP Protection Matters** section:
  - Privacy Protection
  - Access Restrictions (bypass geo-blocks)
  - Security Enhancement (DDoS protection)
  - Anonymity Online

**Design:**

- Green (protected) / Red (unprotected) status indicator
- Two-column layout: IP Status + IP Rotation
- Three feature cards with conditional green highlighting
- Blue gradient information banner at bottom
- Font-mono for IP address display
- Eye/EyeOff icons for IP visibility toggle

### 3. **Backend API Routes**

**Location:** `backend/src/routes/security.ts`

**Endpoints:**

**GET /api/security/breach-check**

- Headers: `Authorization: Bearer <token>`
- Returns: `{ breaches: DataBreach[], totalBreaches: number, monitoring: boolean }`
- **Demo mode:** Returns empty breaches for now
- **Production:** Integrate with Have I Been Pwned API (https://haveibeenpwned.com/API/v3)

**POST /api/security/activate-monitoring**

- Headers: `Authorization: Bearer <token>`
- Returns: `{ success: true, monitoring: true }`
- Enables 24/7 breach monitoring for user

**POST /api/security/rotate-ip**

- Headers: `Authorization: Bearer <token>`
- Body: `{ targetCountry: string }`
- Returns: `{ success: true, newIP: string, country: string, city: string, protected: true }`
- **Demo mode:** Generates random IP based on country prefix
- **Production:** Integrate with proxy/VPN provider API (ProxyMesh, Luminati, SmartProxy)

**GET /api/security/ip-info**

- Headers: `Authorization: Bearer <token>`
- Returns: `{ ip: string, protected: boolean }`
- Gets client IP from request headers

### 4. **Backend Integration**

**Modified:** `backend/src/index.ts`

- Added import: `import securityRouter from "./routes/security";`
- Added route: `app.use("/api/security", securityRouter);`

---

## 🎨 Design Features

### Breach Alert Page

- **Colors:**
  - Red gradient: Alert banner (from-red-50 to-orange-50)
  - Red text: Breach counts, leak numbers
  - Blue: Activate button, recommendation section gradient
  - Green: Active monitoring badge
  - Orange: Premium category badges
- **Icons:**
  - Shield (header, recommendations)
  - AlertTriangle (high-risk accounts, monitoring)
  - Mail, Phone, CreditCard, FileText (category tabs)
  - ChevronRight (navigation arrows)
  - CheckCircle (recommendations)
  - Info (monitoring notice)
- **Layout:**
  - Max-width: 1792px (7xl)
  - Grid: 2 columns on desktop, stacks on mobile
  - Card-based design with rounded-2xl corners

### IP Protection Page

- **Colors:**
  - Green: Protected status, active features (from-green-600)
  - Red: Unprotected status (from-red-600)
  - Blue: Action buttons, info banner gradient
  - Slate: Background, card borders
- **Icons:**
  - Shield/ShieldAlert (header status)
  - Globe, MapPin, Zap (IP info)
  - RefreshCw (rotate button, animated spin)
  - Power (enable/disable toggle)
  - Eye/EyeOff (IP visibility)
  - Lock (protection active message)
- **Layout:**
  - Max-width: 1280px (5xl)
  - Grid: 2 columns for status cards, 3 columns for features
  - Conditional green borders when features active

---

## 🔌 Integration Guide

### Adding to Navigation

**Option 1: Add to Dashboard Menu**

```tsx
// In dashboard layout or sidebar
<Link href="/security/breach-alert">
  <Shield className="h-5 w-5" />
  Breach Alert
</Link>

<Link href="/security/ip-protection">
  <Globe className="h-5 w-5" />
  IP Protection
</Link>
```

**Option 2: Add Security Dropdown**

```tsx
<DropdownMenu>
  <DropdownMenuTrigger>
    <Shield className="h-5 w-5" />
    Security
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem asChild>
      <Link href="/security/breach-alert">Breach Alert</Link>
    </DropdownMenuItem>
    <DropdownMenuItem asChild>
      <Link href="/security/ip-protection">IP Protection</Link>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Integrating Have I Been Pwned API

**Install axios:**

```bash
npm install axios
```

**Backend implementation:**

```typescript
import axios from "axios";

router.get("/breach-check", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Have I Been Pwned API v3
    const response = await axios.get(
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(
        user.email
      )}`,
      {
        headers: {
          "hibp-api-key": process.env.HIBP_API_KEY, // Get from https://haveibeenpwned.com/API/Key
          "User-Agent": "Advancia-Pay-Ledger",
        },
      }
    );

    const breaches = response.data.map((breach: any) => ({
      name: breach.Name,
      domain: breach.Domain,
      breachDate: breach.BreachDate,
      addedDate: breach.AddedDate,
      pwnCount: breach.PwnCount,
      description: breach.Description,
      dataClasses: breach.DataClasses, // e.g., ["Email addresses", "Passwords"]
    }));

    res.json({
      breaches: [
        {
          email: user.email,
          breachCount: breaches.length,
          sources: breaches.map((b: any) => ({
            name: b.name,
            leakCount: 1, // HIBP doesn't provide individual leak count
            date: b.breachDate,
            icon: getIconForDataClasses(b.dataClasses),
          })),
        },
      ],
      totalBreaches: breaches.length,
      monitoring: true,
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      // No breaches found
      return res.json({ breaches: [], totalBreaches: 0, monitoring: false });
    }
    console.error("HIBP API error:", error);
    res.status(500).json({ error: "Failed to check breaches" });
  }
});

function getIconForDataClasses(dataClasses: string[]): string {
  if (dataClasses.includes("Passwords")) return "🔐";
  if (dataClasses.includes("Credit cards")) return "💳";
  if (dataClasses.includes("Phone numbers")) return "📱";
  if (dataClasses.includes("Email addresses")) return "📧";
  return "🔓";
}
```

**Environment variables:**

```env
HIBP_API_KEY=your_api_key_here
```

### Integrating Proxy/VPN Provider

**Example with ProxyMesh:**

```typescript
import axios from "axios";

router.post("/rotate-ip", authenticateToken, async (req, res) => {
  try {
    const { targetCountry } = req.body;

    // ProxyMesh API (or similar)
    const proxyConfig = {
      host: "us-wa.proxymesh.com", // Change based on targetCountry
      port: 31280,
      auth: {
        username: process.env.PROXY_USERNAME,
        password: process.env.PROXY_PASSWORD,
      },
    };

    // Test proxy connection to get new IP
    const response = await axios.get("https://api.ipify.org?format=json", {
      proxy: proxyConfig,
    });

    const newIP = response.data.ip;

    res.json({
      success: true,
      newIP,
      country: targetCountry,
      city: getCityForCountry(targetCountry),
      protected: true,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Failed to rotate IP" });
  }
});
```

**Environment variables:**

```env
PROXY_USERNAME=your_username
PROXY_PASSWORD=your_password
```

---

## 🚀 Usage Examples

### Checking for Breaches

1. Navigate to `/security/breach-alert`
2. System automatically fetches breach data for logged-in user's email
3. Click on any email in the list to view detailed breach sources
4. Click "Activate" to enable 24/7 monitoring

### Rotating IP Address

1. Navigate to `/security/ip-protection`
2. View current IP, ISP, and location
3. Select target country from dropdown (e.g., United States)
4. Click "Rotate IP Now"
5. System generates new IP from that country
6. Status changes to "Protected" with green badge
7. VPN Protection, Proxy Server, and Location Masking show as ACTIVE

### Demo Mode Testing

Both pages work in demo mode without backend integration:

- Breach Alert shows sample breach data (4 emails with various breach counts)
- IP Protection simulates IP rotation with random IPs based on country

---

## 🔧 Configuration

### Breach Alert Settings

**Monitoring frequency:**

```typescript
// In backend cron job (add to index.ts)
import cron from "node-cron";

cron.schedule("0 0 * * *", async () => {
  // Daily breach check at midnight
  const usersWithMonitoring = await prisma.user.findMany({
    where: { breachMonitoring: true },
  });

  for (const user of usersWithMonitoring) {
    // Check for new breaches
    // Send email notification if found
  }
});
```

**Email notifications:**

```typescript
import nodemailer from "nodemailer";

async function notifyUserOfBreach(user: User, breachDetails: any) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "⚠️ New Data Breach Detected - Advancia Pay Alert",
    html: `
      <h2>Data Breach Alert</h2>
      <p>We detected a new data breach affecting your account:</p>
      <ul>
        <li><strong>Source:</strong> ${breachDetails.name}</li>
        <li><strong>Date:</strong> ${breachDetails.date}</li>
        <li><strong>Leaked data:</strong> ${breachDetails.dataClasses.join(
          ", "
        )}</li>
      </ul>
      <p><strong>Recommended actions:</strong></p>
      <ol>
        <li>Change your password immediately</li>
        <li>Enable two-factor authentication</li>
        <li>Monitor your account for suspicious activity</li>
      </ol>
      <a href="https://advanciapayledger.com/security/breach-alert">View Details</a>
    `,
  });
}
```

### IP Protection Settings

**Country IP ranges (for demo mode):**

```typescript
const ipRanges: Record<string, string> = {
  "United States": "104.", // Cloudflare
  "United Kingdom": "86.", // UK ISPs
  Germany: "217.", // DTAG
  France: "89.", // Orange
  Canada: "142.", // Bell Canada
  Australia: "1.", // Telstra
  Japan: "153.", // NTT
  Singapore: "103.", // StarHub
};
```

**Proxy provider configuration:**

```typescript
const proxyProviders = {
  us: "us-wa.proxymesh.com:31280",
  uk: "uk.proxymesh.com:31280",
  de: "de.proxymesh.com:31280",
  // Add more countries
};
```

---

## 📊 Database Schema (Optional)

Add to `prisma/schema.prisma`:

```prisma
model User {
  // ... existing fields

  // Breach monitoring
  breachMonitoring Boolean @default(false)
  lastBreachCheck  DateTime?
  breachCount      Int @default(0)

  // IP protection
  ipProtected      Boolean @default(false)
  maskedIP         String?
  maskedCountry    String?
  lastIPRotation   DateTime?

  breachAlerts     BreachAlert[]
  ipRotationLogs   IPRotationLog[]
}

model BreachAlert {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  email       String
  breachName  String
  breachDate  DateTime
  dataClasses String[] // e.g., ["Email", "Password"]
  pwnCount    Int      // Number of records affected
  notified    Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@map("breach_alerts")
}

model IPRotationLog {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  originalIP    String
  maskedIP      String
  targetCountry String
  city          String?
  vpnActive     Boolean  @default(false)
  proxyActive   Boolean  @default(false)
  createdAt     DateTime @default(now())

  @@map("ip_rotation_logs")
}
```

Run migration:

```bash
cd backend
npx prisma migrate dev --name add-security-features
npx prisma generate
```

---

## 🎯 Testing Checklist

### Breach Alert

- [ ] Page loads without errors
- [ ] Email list displays with breach counts
- [ ] Clicking email shows breach source details
- [ ] Category tabs display correctly (Email active, others grayed)
- [ ] "Activate" button toggles monitoring
- [ ] "24/7 Active" badge shows when monitoring enabled
- [ ] Recommendations section displays with icons
- [ ] Responsive on mobile screens
- [ ] API calls include authentication token
- [ ] Demo data loads if API fails

### IP Protection

- [ ] Current IP displays correctly
- [ ] ISP and location information shows
- [ ] Status indicator matches protection state (red/green)
- [ ] Country dropdown populates with options
- [ ] "Rotate IP Now" button triggers IP change
- [ ] Loading spinner shows during rotation
- [ ] New IP displays in correct format
- [ ] Status changes to "Protected" after rotation
- [ ] Feature cards show ACTIVE badges when enabled
- [ ] "Enable/Disable Protection" toggle works
- [ ] Eye/EyeOff toggle hides/shows IP
- [ ] Refresh button updates IP info
- [ ] Why IP Protection section displays
- [ ] Responsive on mobile screens

---

## 🚀 Deployment Notes

1. **Environment Variables:**

```env
# .env (Backend)
HIBP_API_KEY=your_hibp_api_key
PROXY_USERNAME=your_proxy_username
PROXY_PASSWORD=your_proxy_password
```

2. **API Rate Limits:**

- Have I Been Pwned: 1 request per 1.5 seconds (respect rate limits)
- Implement caching to avoid repeated API calls
- Store breach data in database and update daily

3. **Security Considerations:**

- Never log real user IPs in production
- Encrypt stored IP addresses in database
- Use HTTPS for all proxy connections
- Validate country input to prevent injection

4. **Performance:**

- Cache breach check results for 24 hours
- Lazy load breach source details
- Paginate email list if user has many addresses
- Debounce IP rotation requests

---

## 📝 Future Enhancements

- [ ] **Multi-email monitoring** - Check multiple emails per user
- [ ] **Real-time alerts** - Push notifications for new breaches
- [ ] **Password strength checker** - Analyze user passwords
- [ ] **Dark web monitoring** - Check for leaked credentials on dark web
- [ ] **Automated IP rotation** - Schedule automatic rotations
- [ ] **VPN kill switch** - Drop connection if VPN fails
- [ ] **DNS leak protection** - Prevent DNS request leaks
- [ ] **Split tunneling** - Route specific traffic through VPN
- [ ] **Connection logs** - Track all IP rotations
- [ ] **Custom proxy servers** - Let users add their own proxies
- [ ] **Geolocation spoofing** - Change browser geolocation
- [ ] **User agent rotation** - Randomize browser fingerprint

---

## 🆘 Troubleshooting

### Breach Alert Issues

**Problem:** No breaches showing

- Check if user email exists in database
- Verify HIBP API key is valid
- Check API rate limits (max 1 req per 1.5s)
- Test demo mode by removing API call

**Problem:** "Activate" button not working

- Check authentication token in localStorage
- Verify `/api/security/activate-monitoring` endpoint
- Check browser console for errors
- Ensure user is authenticated

### IP Protection Issues

**Problem:** IP not rotating

- Check proxy/VPN provider credentials
- Verify network connectivity
- Test demo mode (generates random IP)
- Check backend logs for proxy errors

**Problem:** Wrong country showing

- Verify country mapping in backend
- Check IP geolocation API response
- Update IP range prefixes if needed
- Test with different countries

**Problem:** "Protected" status not updating

- Check state management in React component
- Verify API response includes `protected: true`
- Check localStorage persistence
- Refresh page to reset state

---

## 📚 Related Documentation

- [Support Page Guide](./SUPPORT_PAGE_GUIDE.md)
- [Maintenance Mode Guide](./MAINTENANCE_MODE_GUIDE.md)
- [API Reference](./API_REFERENCE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Security Best Practices](./SECURITY_BEST_PRACTICES.md)

---

## 🔗 External Resources

- [Have I Been Pwned API](https://haveibeenpwned.com/API/v3)
- [ProxyMesh](https://proxymesh.com/)
- [IP Geolocation API](https://ipapi.co/)
- [VeePN Breach Alert](https://veepn.com/alert/)

---

_Last Updated: November 19, 2025_
