# Cloudflare DNS Plan (Zero-Downtime)

## Targets

-   Frontend (Vercel): apex/root `your-domain.com` and `www` → Vercel
-   Backend API (Render): `api.your-domain.com` → Render custom domain

## Records

-   Apex/root: follow Vercel DNS wizard (CNAME flattening to Vercel)
-   `CNAME` `www` → your Vercel project domain
-   `CNAME` `api` → your Render service custom domain

## SSL & Security

-   SSL/TLS: Full (strict)
-   HSTS: enable with preload after validation
-   WAF: enable core rules; add rate limiting to `/api/auth/*` and `/api/payments/*`

## Cutover Steps

-   Validate apps on provider subdomains (Vercel + Render)
-   Set DNS TTL to 120s (low) for apex/www/api
-   Point apex/www to Vercel and `api` to Render
-   Verify: `/api/health`, end-to-end flows, Stripe webhook test event
-   Raise TTL to 30m after stability

## Proxy & Redirect Strategy

### Enable Cloudflare Proxy (Orange Cloud)

| Record   | Proxy | Notes                                                    |
| -------- | ----- | -------------------------------------------------------- |
| Apex (@) | ON    | Uses CNAME flattening to Vercel for better caching & WAF |
| www      | ON    | Primary canonical host (SEO + consistency)               |
| api      | ON    | Protect backend (WAF, DDoS, caching headers)             |

After enabling, confirm CF headers:

```bash
curl -I https://www.your-domain.com | grep -i cf-cache-status
curl -I https://api.your-domain.com | grep -i cf-ray
```

### Apex → www 301 Redirect

Use one of the following (prefer Redirect Rule if available):

1. Cloudflare Redirect Rule (Rules > Redirect Rules):
   -   Expression: `(http.host eq "your-domain.com")`
   -   Destination: `https://www.your-domain.com/$1` (Preserves path/query)
   -   Status: 301

2. Page Rule (legacy):
   -   URL: `your-domain.com/*`
   -   Setting: Forwarding URL (301) → `https://www.your-domain.com/$1`

3. Transform Rule (only if normalization needed): rewrite host before request to origin.

Validation:

```bash
curl -I https://your-domain.com
# Expect: HTTP/1.1 301 Moved Permanently
# Location: https://www.your-domain.com/
```

### Cache Considerations

-   Keep API responses `Cache-Control: no-store` unless explicitly safe.
-   Static assets on frontend (Vercel) already optimized; CF will layer additional caching.
-   Consider a Cloudflare Cache Rule to extend caching for immutable assets (`/_next/static/*`).

### Security Enhancements

-   WAF custom rule: Block suspicious POST to `/api/auth/*` with high anomaly score.
-   Rate limiting rule example: 200 requests per 60s per IP on `/api/payments/*`.
-   Bot Fight Mode: evaluate (can affect legitimate API clients).

### Observability After Cutover

Monitor:

| Metric                            | Expected                                 |
| --------------------------------- | ---------------------------------------- |
| CF 5xx                            | Near zero; otherwise inspect origin logs |
| Latency (p95)                     | Slight improvement vs direct origin      |
| Cache hit ratio (frontend static) | >70% after warmup                        |
| WAF events                        | Logged but low false positives           |

### Rollback Plan

-   Disable proxy (grey cloud) for affected record if persistent errors.
-   Remove redirect rule if causing loops; test again.
-   Keep a bypass host `origin.your-domain.com` (unproxied) for emergency diagnostics.

### Automation (Optional)

Add script using Cloudflare API token (zone + DNS + rules) to:

-   Verify required DNS records
-   Assert proxy status
-   Ensure redirect rule present

Pseudo-script outline:

```bash
ZONE_ID=xxxxx
AUTH_HEADER="Authorization: Bearer $CF_API_TOKEN"

# List DNS records
curl -s -H "$AUTH_HEADER" "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" | jq '.result[] | {name, proxied, type}'
```

---

Last updated: Add Cloudflare Workers plan if advanced edge rewrites required.

Pseudo-script outline:

```bash
ZONE_ID=xxxxx
AUTH_HEADER="Authorization: Bearer $CF_API_TOKEN"

# List DNS records
curl -s -H "$AUTH_HEADER" "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" | jq '.result[] | {name, proxied, type}'
```

---

Last updated: Add Cloudflare Workers plan if advanced edge rewrites required.
