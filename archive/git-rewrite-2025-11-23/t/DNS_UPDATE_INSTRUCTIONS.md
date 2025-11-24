# DNS Record Updates Required for Resend Email

## 🔧 UPDATE REQUIRED: SPF Record

### Current SPF Record

```
Type: TXT
Name: advanciapayledger.com (@)
Value: "v=spf1 include:_spf.mx.cloudflare.net ~all"
```

### ⚠️ UPDATE TO (to include Resend)

```
Type: TXT
Name: advanciapayledger.com (@)
Value: "v=spf1 include:_spf.mx.cloudflare.net include:_spf.resend.com ~all"
```

**What changed:** Added `include:_spf.resend.com` to authorize Resend to send emails

---

## ➕ ADD NEW: Resend DKIM Record

After adding your domain to Resend (<https://resend.com/domains>), you'll get a DKIM record.

### Steps

1. Go to <https://resend.com/domains>
2. Click "Add Domain"
3. Enter: `advanciapayledger.com`
4. Copy the DKIM TXT record shown (will look like below)
5. Add to Cloudflare DNS

### Expected Record to Add

```
Type: TXT
Name: resend._domainkey
Value: [Copy from Resend dashboard - starts with "v=DKIM1; k=rsa; p=..."]
TTL: Auto
```

---

## 📝 How to Update in Cloudflare

### Update SPF Record

1. Go to Cloudflare Dashboard → DNS → Records
2. Find the TXT record with `v=spf1 include:_spf.mx.cloudflare.net ~all`
3. Click **Edit**
4. Change value to: `v=spf1 include:_spf.mx.cloudflare.net include:_spf.resend.com ~all`
5. Click **Save**

### Add Resend DKIM

1. In Cloudflare DNS → Records
2. Click **Add record**
3. Type: **TXT**
4. Name: `resend._domainkey`
5. Content: [Paste value from Resend dashboard]
6. Proxy status: **DNS only**
7. TTL: **Auto**
8. Click **Save**

---

## ✅ Current DNS Records Summary

| Record            | Current Value                                | Status                |
| ----------------- | -------------------------------------------- | --------------------- |
| A @               | 76.76.21.21                                  | ✅ Correct            |
| CNAME www         | cname.vercel-dns.com                         | ✅ Correct            |
| CNAME api         | advancia-backend-upnrf.onrender.com          | ✅ Correct (DNS only) |
| MX @              | Cloudflare Email Routing (3 records)         | ✅ Working            |
| TXT SPF           | `v=spf1 include:_spf.mx.cloudflare.net ~all` | ⚠️ Need to add Resend |
| TXT DKIM (CF)     | cf2024-1.\_domainkey                         | ✅ Cloudflare DKIM    |
| TXT DKIM (Resend) | resend.\_domainkey                           | ❌ Need to add        |
| TXT DMARC         | Cloudflare reporting                         | ✅ Working            |

---

## 🎯 Action Items

### Immediate (Required for Resend Email)

1. **Update SPF Record** (2 minutes)
   -   Edit existing TXT record
   -   Add `include:_spf.resend.com`
   -   Save changes

2. **Sign up for Resend** (5 minutes)
   -   Go to <https://resend.com>
   -   Sign up with: <advanciapayledger@gmail.com>
   -   Create API key

3. **Add Domain to Resend** (3 minutes)
   -   Resend Dashboard → Domains → Add Domain
   -   Enter: advanciapayledger.com
   -   Copy DKIM record value

4. **Add Resend DKIM to Cloudflare** (2 minutes)
   -   Add TXT record: `resend._domainkey`
   -   Paste DKIM value from Resend
   -   Save

5. **Verify Domain in Resend** (1 minute)
   -   Wait 5-15 minutes for DNS propagation
   -   Click "Verify" in Resend dashboard
   -   Should show ✅ Verified

6. **Update Render Environment** (2 minutes)
   -   Go to Render dashboard
   -   Add: `RESEND_API_KEY=re_...` (from Resend)
   -   Service will auto-redeploy

### After Setup

7. **Test Email Delivery**

   ```bash
   curl -X POST https://advancia-backend-upnrf.onrender.com/api/test/email/welcome \
     -H "Content-Type: application/json" \
     -d '{"email": "your-email@gmail.com", "username": "Test"}'
   ```

8. **Check Email Headers**
   -   Open received email in Gmail
   -   Click "Show original"
   -   Verify: SPF PASS, DKIM PASS, DMARC PASS

---

## 🔍 Verification Commands

After updating SPF and adding Resend DKIM:

```bash
# Check SPF (should show both Cloudflare and Resend)
dig TXT advanciapayledger.com +short

# Check Resend DKIM
dig TXT resend._domainkey.advanciapayledger.com +short

# Check DMARC
dig TXT _dmarc.advanciapayledger.com +short
```

**Expected SPF Result:**

```
"v=spf1 include:_spf.mx.cloudflare.net include:_spf.resend.com ~all"
```

---

## 📧 Email Routing Status

Your Cloudflare Email Routing is **already configured**! 🎉

To set up email forwarding:

1. Go to Cloudflare → Email → Email Routing
2. Destination addresses → Add your personal email
3. Routing rules → Create routes:
   -   `admin@advanciapayledger.com` → <your-personal@gmail.com>
   -   `support@advanciapayledger.com` → <your-personal@gmail.com>
   -   `noreply@advanciapayledger.com` → Discard (or forward)

---

## ⚡ Quick Update Script

Copy and paste this into Cloudflare DNS:

**SPF Record (Edit existing):**

```
v=spf1 include:_spf.mx.cloudflare.net include:_spf.resend.com ~all
```

**Resend DKIM (Add new after getting from Resend):**

```
Name: resend._domainkey
Value: [From Resend dashboard]
Type: TXT
```

---

## 🚀 Next Step

**Go to Cloudflare now and update the SPF record!** Then sign up for Resend to get the DKIM value.

Total time: ~15 minutes to complete all steps.
