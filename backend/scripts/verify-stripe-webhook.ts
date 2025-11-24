import crypto from "crypto";
import "dotenv/config";

/**
 * Stripe Webhook Verification:
 * - Ensures STRIPE_WEBHOOK_SECRET present and format valid
 * - Simulates signature header construction for a dummy payload
 * Does NOT send a real HTTP request; focuses on local readiness.
 */

const secret = process.env.STRIPE_WEBHOOK_SECRET;
if (!secret) {
  console.error("❌ Missing STRIPE_WEBHOOK_SECRET");
  process.exit(1);
}
if (!secret.startsWith("whsec_")) {
  console.error(
    "❌ STRIPE_WEBHOOK_SECRET format invalid (should start with whsec_)",
  );
  process.exit(1);
}
console.log("✅ Webhook secret present & format looks correct");

// Simulate Stripe signature building
const payload = JSON.stringify({
  type: "payment_intent.succeeded",
  id: "evt_test_123",
});
const timestamp = Math.floor(Date.now() / 1000);
const sigPayload = `${timestamp}.${payload}`;
const expected = crypto
  .createHmac("sha256", secret)
  .update(sigPayload, "utf8")
  .digest("hex");
const signatureHeader = `t=${timestamp},v1=${expected}`;
console.log(
  "✅ Simulated signature header:",
  signatureHeader.slice(0, 40) + "...",
);

// Provide instructions for live test
console.log("\nNext live test (after deploy):");
console.log("1. Install Stripe CLI: https://stripe.com/docs/stripe-cli");
console.log(
  "2. Run: stripe listen --forward-to https://<backend-domain>/api/payments/webhook",
);
console.log("3. Trigger: stripe trigger payment_intent.succeeded");
console.log("4. Confirm server logs show successful verification.");
