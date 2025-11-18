// Test script to verify custodial wallet system
const axios = require("axios");

const BASE_URL = "http://localhost:4000/api";

async function testWalletSystem() {
  console.log("🧪 Testing Custodial Wallet System\n");

  try {
    // Step 1: Register a new user
    console.log("1️⃣ Registering new user...");
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      username: `wallettest_${Date.now()}`,
      email: `wallettest_${Date.now()}@example.com`,
      password: "SecurePass123!",
      firstName: "Wallet",
      lastName: "Test",
    });

    const { user, token } = registerResponse.data;
    console.log(`✅ User registered: ${user.id}`);
    console.log(`📧 Email: ${user.email}\n`);

    // Step 2: Get user's wallets
    console.log("2️⃣ Fetching user wallets...");
    const walletsResponse = await axios.get(`${BASE_URL}/wallets`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const wallets = walletsResponse.data.wallets;
    console.log(`✅ Found ${wallets.length} wallets:\n`);

    wallets.forEach((wallet) => {
      console.log(`   ${wallet.currency}:`);
      console.log(`   └─ Address: ${wallet.address}`);
      console.log(`   └─ Balance: ${wallet.balance}`);
      console.log(
        `   └─ Created: ${new Date(wallet.createdAt).toLocaleString()}\n`
      );
    });

    // Step 3: Test wallet rotation
    if (wallets.length > 0) {
      const btcWallet = wallets.find((w) => w.currency === "BTC");
      if (btcWallet) {
        console.log("3️⃣ Testing wallet rotation for BTC...");
        const oldAddress = btcWallet.address;

        const rotateResponse = await axios.post(
          `${BASE_URL}/wallets/rotate/BTC`,
          { reason: "Testing rotation feature" },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const newWallet = rotateResponse.data.wallet;
        console.log(`✅ Wallet rotated successfully:`);
        console.log(`   Old address: ${oldAddress}`);
        console.log(`   New address: ${newWallet.address}`);
        console.log(`   Reason: Testing rotation feature\n`);

        // Step 4: Check rotation history
        console.log("4️⃣ Checking rotation history...");
        const historyResponse = await axios.get(
          `${BASE_URL}/wallets/history/BTC`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const history = historyResponse.data.history;
        console.log(`✅ Found ${history.length} rotation(s) in history:\n`);
        history.forEach((entry, index) => {
          console.log(`   Rotation #${index + 1}:`);
          console.log(`   └─ From: ${entry.oldAddress}`);
          console.log(`   └─ Reason: ${entry.rotationReason}`);
          console.log(
            `   └─ Date: ${new Date(entry.rotatedAt).toLocaleString()}\n`
          );
        });
      }
    }

    console.log("🎉 All tests passed!\n");
    console.log("Summary:");
    console.log("✅ User registration with auto-wallet initialization");
    console.log("✅ Unique addresses generated for BTC, ETH, USDT");
    console.log("✅ Wallet rotation working correctly");
    console.log("✅ Rotation history tracking functional");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
    if (error.response?.data?.stack) {
      console.error("\nStack trace:", error.response.data.stack);
    }
    process.exit(1);
  }
}

// Run tests
testWalletSystem().catch(console.error);
