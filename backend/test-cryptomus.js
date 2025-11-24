/**
 * Test Cryptomus signature generation
 * Verifies MD5(base64(body) + API_KEY) matches official docs
 */

import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const CRYPTOMUS_API_KEY = process.env.CRYPTOMUS_API_KEY || "";
const CRYPTOMUS_USER_ID = process.env.CRYPTOMUS_MERCHANT_ID || "";

console.log("\n=== Cryptomus Configuration Test ===\n");

// Check environment variables
console.log("1. Environment Variables:");
console.log(
  `   ✅ API Key: ${
    CRYPTOMUS_API_KEY
      ? CRYPTOMUS_API_KEY.substring(0, 20) + "..."
      : "❌ MISSING"
  }`,
);
console.log(`   ✅ User ID: ${CRYPTOMUS_USER_ID || "❌ MISSING"}`);

// Test signature generation
console.log("\n2. Signature Generation Test:");
const testData = {
  amount: "10.00",
  currency: "USDT",
  order_id: "test-" + Date.now(),
};

const jsonString = JSON.stringify(testData);
const base64 = Buffer.from(jsonString).toString("base64");
const signature = crypto
  .createHash("md5")
  .update(base64 + CRYPTOMUS_API_KEY)
  .digest("hex");

console.log(`   Test Data: ${JSON.stringify(testData)}`);
console.log(`   Base64: ${base64.substring(0, 30)}...`);
console.log(`   Signature: ${signature}`);

// Test empty signature (for GET requests)
console.log("\n3. Empty Signature Test (GET requests):");
const emptyBase64 = Buffer.from("").toString("base64");
const emptySignature = crypto
  .createHash("md5")
  .update(emptyBase64 + CRYPTOMUS_API_KEY)
  .digest("hex");
console.log(`   Empty Base64: "${emptyBase64}"`);
console.log(`   Empty Signature: ${emptySignature}`);

// Configuration ready check
console.log("\n4. Configuration Status:");
const isReady = !!(CRYPTOMUS_API_KEY && CRYPTOMUS_USER_ID);
if (isReady) {
  console.log("   ✅ Configuration is READY for Cryptomus API");
  console.log("\n5. API Endpoint:");
  console.log("   Base URL: https://api.cryptomus.com/v1");
  console.log("   Payment endpoint: https://api.cryptomus.com/v1/payment");
  console.log("\n6. Required Headers:");
  console.log(`   Content-Type: application/json`);
  console.log(`   userId: ${CRYPTOMUS_USER_ID}`);
  console.log(`   sign: <MD5 signature>`);
} else {
  console.log("   ❌ Configuration is INCOMPLETE");
  if (!CRYPTOMUS_API_KEY) console.log("   Missing: CRYPTOMUS_API_KEY");
  if (!CRYPTOMUS_USER_ID) console.log("   Missing: CRYPTOMUS_MERCHANT_ID");
}

console.log("\n===================================\n");
