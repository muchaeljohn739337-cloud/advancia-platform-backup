#!/usr/bin/env bash
set -euo pipefail

FILE=".github/copilot-instructions.md"
DATE_STR="Last Updated: $(date -u +%Y-%m-%d)"

if [[ ! -f "$FILE" ]]; then
  echo "Creating $FILE from minimal template..."
  mkdir -p .github
  cat > "$FILE" <<'EOF'
## GitHub Copilot Instructions

This file guides AI code suggestions for this repository.

EOF
fi

# Ensure a Last Updated line exists near the top and is refreshed
if grep -q "^Last Updated:" "$FILE"; then
  # Replace existing line
  sed -i "s/^Last Updated:.*/$DATE_STR/" "$FILE"
else
  # Insert after the first heading line
  awk -v stamp="$DATE_STR" 'NR==1{print; print stamp; next}1' "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
fi

# Ensure the Security and Compliance section header exists
if ! grep -q "^## Security and Compliance Instructions for GitHub Copilot" "$FILE"; then
  cat >> "$FILE" <<'EOF'

---

## Security and Compliance Instructions for GitHub Copilot (Self‑Hosted Fintech)

Use these rules to guide code suggestions. Favor clarity, minimal dependencies, and auditability.

### Secure Coding Practices
- Validate and sanitize all inputs at boundaries (API, DB, external services).
- Never hardcode secrets; use env vars or secret stores. Do not print secrets in logs.
- Enforce authentication and authorization consistently via `authenticateToken` and `requireAdmin`.
- Prefer well‑maintained libraries; avoid deprecated/vulnerable packages.
- Handle errors centrally with `errorHandler`; return safe messages in production.

### Monetary and Data Handling
- Represent money with Prisma `Decimal`; serialize using `serializeDecimal*` helpers.
- Avoid floating‑point math for financial values.
- Log business‑relevant events, not PII/secrets; keep auditability in mind.
- Respect data retention and privacy (GDPR). Avoid storing unnecessary personal data.

### Vulnerability Prevention
- Guard against SQLi (Prisma ORM), XSS (sanitize outputs), and CSRF (enable when sessions/forms are used).
- Rate‑limit sensitive routes using `rateLimiter`.
- Use Helmet for security headers; keep CORS origins restricted via `config.allowedOrigins`.

### Payments and Webhooks
- Stripe: Keep raw body for `/api/payments/webhook`. Verify signatures with `STRIPE_WEBHOOK_SECRET`.
- Cryptomus: Validate payloads and verify expected fields before processing.
- On failures, prefer idempotent handling and clear error logging without leaking credentials.

### Observability and Testing
- Use Sentry for exceptions; avoid sensitive data in breadcrumbs.
- Add unit/integration tests for: auth, payments intents, transactions serialization.
- Prefer small, testable modules with explicit types and exhaustive error handling.

### Performance and Operations
- Reuse the singleton Prisma client. Avoid N+1 queries; use `select`/`include` deliberately.
- Emit Socket.IO events only after DB commits. Target `user-<id>` rooms for user‑scoped events.
- Background jobs should be idempotent and observable.

### Copilot Generation Guardrails
- Suggest tests alongside new endpoints or database mutations.
- Prefer minimal, readable code over cleverness. Explain security implications in comments where non‑obvious.
- Do not scaffold integrations to external financial services unless explicitly requested.
- Flag sections that require manual security review with a TODO comment.

### Compliance Notes
- Aim for PCI‑DSS friendly patterns: do not store raw card data; rely on Stripe tokens.
- Ensure audit logs exist for critical actions (auth changes, payment state changes, admin operations).
- Document assumptions and data flows that impact compliance in PR descriptions.

---
EOF
fi

# Exit non-zero only if there are staged changes when run locally; the workflow handles PR creation
echo "Generation complete. If changes exist, the workflow will open a PR."