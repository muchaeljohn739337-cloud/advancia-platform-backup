/**
 * Stripe live webhook test helper.
 * Generates a minimal event payload and signs it with STRIPE_WEBHOOK_SECRET using Stripe's CLI-compatible scheme.
 * Intended for post-deploy manual `curl` or programmatic POST.
 * NOTE: This does not call Stripe API; it constructs a deterministic signature header.
 */
import crypto from "crypto";

interface Result {
  step: string;
  success: boolean;
  detail?: string;
}

function main() {
  const results: Result[] = [];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    results.push({
      step: "env",
      success: false,
      detail: "STRIPE_WEBHOOK_SECRET missing",
    });
    dump(results);
    process.exit(1);
    return;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify({
    id: "evt_test_liveHarness",
    object: "event",
    type: "charge.succeeded",
    created: timestamp,
    livemode: true,
    data: {
      object: {
        id: "ch_testHarness",
        object: "charge",
        amount: 100,
        currency: "usd",
      },
    },
  });

  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");
  const header = `t=${timestamp},v1=${signature}`;
  results.push({ step: "signature", success: true, detail: header });

  console.log("\nStripe Webhook Live Test Helper".padEnd(50, "="));
  console.log("Payload (first 120 chars):", payload.slice(0, 120));
  console.log("Signature Header:", header);
  console.log("Curl Example:\n");
  console.log(
    `curl -X POST "$BACKEND_URL/api/payments/webhook" \\\n+  -H "Stripe-Signature: ${header}" \\\n+  -H "Content-Type: application/json" \\\n+  --data '${payload.replace(
      /'/g,
      "'\\''",
    )}'`,
  );
}

function dump(list: Result[]) {
  for (const r of list)
    console.log(
      `${r.success ? "[PASS]" : "[FAIL]"} ${r.step} - ${r.detail || ""}`,
    );
}

main();
