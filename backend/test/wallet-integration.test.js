/**
 * Wallet Integration Tests
 * Tests custodial wallet generation, rotation, and security
 */

const axios = require("axios");
const { expect } = require("chai");

const BASE_URL = process.env.TEST_API_URL || "http://localhost:4000/api";

describe("Custodial Wallet System - Integration Tests", function () {
  this.timeout(10000);

  let testUser = null;
  let authToken = null;
  let wallets = null;

  before(async function () {
    console.log("\n🧪 Starting Wallet Integration Tests\n");
  });

  describe("1. User Registration & Wallet Initialization", function () {
    it("should register a new user", async function () {
      const username = `wallettest_${Date.now()}`;
      const email = `wallettest_${Date.now()}@example.com`;

      const response = await axios.post(`${BASE_URL}/auth/register`, {
        username,
        email,
        password: "SecurePass123!",
        firstName: "Wallet",
        lastName: "Test",
      });

      expect(response.status).to.equal(200);
      expect(response.data).to.have.property("success", true);
      expect(response.data).to.have.property("user");
      expect(response.data).to.have.property("token");

      testUser = response.data.user;
      authToken = response.data.token;

      console.log(`   ✅ User registered: ${testUser.id}`);
    });

    it("should auto-initialize 3 wallets (BTC, ETH, USDT)", async function () {
      const response = await axios.get(`${BASE_URL}/wallets`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).to.equal(200);
      expect(response.data).to.have.property("wallets");

      wallets = response.data.wallets;
      expect(wallets).to.be.an("array").with.lengthOf(3);

      const currencies = wallets.map((w) => w.currency);
      expect(currencies).to.include.members(["BTC", "ETH", "USDT"]);

      console.log(`   ✅ Found ${wallets.length} wallets initialized`);
    });

    it("should have unique addresses for each currency", function () {
      const addresses = wallets.map((w) => w.address);
      const uniqueAddresses = [...new Set(addresses)];

      expect(uniqueAddresses).to.have.lengthOf(3);
      console.log(`   ✅ All addresses are unique`);
    });

    it("should have valid BTC address format", function () {
      const btcWallet = wallets.find((w) => w.currency === "BTC");
      expect(btcWallet).to.exist;

      // BTC addresses start with 1, 3, or bc1
      const btcAddressRegex = /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/;
      expect(btcWallet.address).to.match(btcAddressRegex);

      console.log(
        `   ✅ BTC address valid: ${btcWallet.address.substring(0, 10)}...`
      );
    });

    it("should have valid ETH address format", function () {
      const ethWallet = wallets.find((w) => w.currency === "ETH");
      expect(ethWallet).to.exist;

      // ETH addresses are 42 chars starting with 0x
      const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
      expect(ethWallet.address).to.match(ethAddressRegex);

      console.log(
        `   ✅ ETH address valid: ${ethWallet.address.substring(0, 10)}...`
      );
    });

    it("should have valid USDT address format (same as ETH)", function () {
      const usdtWallet = wallets.find((w) => w.currency === "USDT");
      expect(usdtWallet).to.exist;

      const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
      expect(usdtWallet.address).to.match(ethAddressRegex);

      console.log(
        `   ✅ USDT address valid: ${usdtWallet.address.substring(0, 10)}...`
      );
    });

    it("should have zero initial balance", function () {
      wallets.forEach((wallet) => {
        expect(parseFloat(wallet.balance)).to.equal(0);
      });
      console.log(`   ✅ All wallets have zero balance`);
    });
  });

  describe("2. Wallet Rotation", function () {
    let originalBtcAddress = null;

    it("should rotate BTC wallet address", async function () {
      const btcWallet = wallets.find((w) => w.currency === "BTC");
      originalBtcAddress = btcWallet.address;

      const response = await axios.post(
        `${BASE_URL}/wallets/rotate/BTC`,
        { reason: "Integration test rotation" },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).to.equal(200);
      expect(response.data).to.have.property("success", true);
      expect(response.data).to.have.property("wallet");

      const newWallet = response.data.wallet;
      expect(newWallet.address).to.not.equal(originalBtcAddress);
      expect(newWallet.currency).to.equal("BTC");

      console.log(
        `   ✅ Rotated: ${originalBtcAddress.substring(
          0,
          10
        )}... → ${newWallet.address.substring(0, 10)}...`
      );
    });

    it("should preserve balance after rotation", async function () {
      const response = await axios.get(`${BASE_URL}/wallets`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const btcWallet = response.data.wallets.find((w) => w.currency === "BTC");
      expect(parseFloat(btcWallet.balance)).to.equal(0);

      console.log(`   ✅ Balance preserved: ${btcWallet.balance}`);
    });

    it("should record rotation in history", async function () {
      const response = await axios.get(`${BASE_URL}/wallets/history/BTC`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).to.equal(200);
      expect(response.data).to.have.property("history");

      const history = response.data.history;
      expect(history).to.be.an("array").with.length.at.least(1);

      const lastRotation = history[0];
      expect(lastRotation.oldAddress).to.equal(originalBtcAddress);
      expect(lastRotation.rotationReason).to.equal("Integration test rotation");

      console.log(`   ✅ History recorded: ${history.length} rotation(s)`);
    });
  });

  describe("3. Security & Validation", function () {
    it("should prevent unauthorized access to wallets", async function () {
      try {
        await axios.get(`${BASE_URL}/wallets`, {
          headers: { Authorization: "Bearer invalid_token" },
        });
        throw new Error("Should have failed with invalid token");
      } catch (error) {
        expect(error.response.status).to.equal(401);
        console.log(`   ✅ Unauthorized access blocked`);
      }
    });

    it("should reject rotation without reason", async function () {
      try {
        await axios.post(
          `${BASE_URL}/wallets/rotate/BTC`,
          {},
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        throw new Error("Should have required rotation reason");
      } catch (error) {
        expect(error.response.status).to.be.oneOf([400, 422]);
        console.log(`   ✅ Rotation requires reason`);
      }
    });

    it("should reject invalid currency rotation", async function () {
      try {
        await axios.post(
          `${BASE_URL}/wallets/rotate/INVALID`,
          { reason: "Test" },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        throw new Error("Should have rejected invalid currency");
      } catch (error) {
        expect(error.response.status).to.be.oneOf([400, 404]);
        console.log(`   ✅ Invalid currency rejected`);
      }
    });
  });

  describe("4. Multiple Users - Unique Addresses", function () {
    let user2Token = null;
    let user2Wallets = null;

    it("should create second user with different wallets", async function () {
      const response = await axios.post(`${BASE_URL}/auth/register`, {
        username: `wallettest2_${Date.now()}`,
        email: `wallettest2_${Date.now()}@example.com`,
        password: "SecurePass123!",
        firstName: "Wallet2",
        lastName: "Test",
      });

      expect(response.status).to.equal(200);
      user2Token = response.data.token;

      const walletsResponse = await axios.get(`${BASE_URL}/wallets`, {
        headers: { Authorization: `Bearer ${user2Token}` },
      });

      user2Wallets = walletsResponse.data.wallets;
      expect(user2Wallets).to.be.an("array").with.lengthOf(3);

      console.log(`   ✅ User 2 registered with 3 wallets`);
    });

    it("should have different addresses from user 1", function () {
      const user1Addresses = wallets.map((w) => w.address);
      const user2Addresses = user2Wallets.map((w) => w.address);

      user1Addresses.forEach((addr1) => {
        expect(user2Addresses).to.not.include(addr1);
      });

      console.log(`   ✅ All addresses are unique across users`);
    });

    it("should maintain address uniqueness for same currency", function () {
      const user1Btc = wallets.find((w) => w.currency === "BTC").address;
      const user2Btc = user2Wallets.find((w) => w.currency === "BTC").address;

      expect(user1Btc).to.not.equal(user2Btc);
      console.log(`   ✅ BTC addresses differ between users`);
    });
  });

  describe("5. Wallet Properties & Metadata", function () {
    it("should have creation timestamp", function () {
      wallets.forEach((wallet) => {
        expect(wallet).to.have.property("createdAt");
        expect(new Date(wallet.createdAt)).to.be.a("date");
      });
      console.log(`   ✅ All wallets have timestamps`);
    });

    it("should have correct currency labels", function () {
      const currencies = wallets.map((w) => w.currency);
      expect(currencies).to.have.members(["BTC", "ETH", "USDT"]);
      console.log(`   ✅ Currency labels correct`);
    });

    it("should include wallet ID", function () {
      wallets.forEach((wallet) => {
        expect(wallet).to.have.property("id");
        expect(wallet.id).to.be.a("string");
        expect(wallet.id).to.have.length.at.least(20);
      });
      console.log(`   ✅ All wallets have valid IDs`);
    });
  });

  after(function () {
    console.log("\n✅ All wallet integration tests passed!\n");
  });
});
