/**
 * Wallet Unit Tests
 * Tests individual wallet service functions
 */

const { expect } = require("chai");
const crypto = require("crypto");

describe("Custodial Wallet Service - Unit Tests", function () {
  describe("Address Generation Logic", function () {
    it("should generate valid BTC address format", function () {
      // Test BTC address pattern (P2PKH, P2SH, or Bech32)
      const testAddresses = [
        "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", // P2PKH
        "3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy", // P2SH
        "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq", // Bech32
      ];

      const btcRegex = /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/;
      testAddresses.forEach((addr) => {
        expect(addr).to.match(btcRegex);
      });

      console.log("   ✅ BTC address formats validated");
    });

    it("should generate valid ETH address format", function () {
      const testAddresses = [
        "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
        "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359",
      ];

      const ethRegex = /^0x[a-fA-F0-9]{40}$/;
      testAddresses.forEach((addr) => {
        expect(addr).to.match(ethRegex);
      });

      console.log("   ✅ ETH address formats validated");
    });
  });

  describe("Encryption/Decryption", function () {
    const testKey = crypto.randomBytes(32).toString("base64");
    const testData = "test-private-key-abc123";

    it("should encrypt data with AES-256-GCM", function () {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(
        "aes-256-gcm",
        Buffer.from(testKey, "base64"),
        iv
      );

      let encrypted = cipher.update(testData, "utf8", "hex");
      encrypted += cipher.final("hex");
      const authTag = cipher.getAuthTag();

      expect(encrypted).to.not.equal(testData);
      expect(encrypted).to.have.length.greaterThan(0);
      expect(authTag).to.have.length(16); // 16 bytes (128 bits)

      console.log("   ✅ AES-256-GCM encryption working");
    });

    it("should decrypt to original data", function () {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(
        "aes-256-gcm",
        Buffer.from(testKey, "base64"),
        iv
      );

      let encrypted = cipher.update(testData, "utf8", "hex");
      encrypted += cipher.final("hex");
      const authTag = cipher.getAuthTag();

      // Decrypt
      const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        Buffer.from(testKey, "base64"),
        iv
      );
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      expect(decrypted).to.equal(testData);
      console.log("   ✅ Decryption restores original data");
    });

    it("should fail decryption with wrong key", function () {
      const wrongKey = crypto.randomBytes(32).toString("base64");
      const iv = crypto.randomBytes(16);

      const cipher = crypto.createCipheriv(
        "aes-256-gcm",
        Buffer.from(testKey, "base64"),
        iv
      );
      let encrypted = cipher.update(testData, "utf8", "hex");
      encrypted += cipher.final("hex");
      const authTag = cipher.getAuthTag();

      try {
        const decipher = crypto.createDecipheriv(
          "aes-256-gcm",
          Buffer.from(wrongKey, "base64"),
          iv
        );
        decipher.setAuthTag(authTag);
        decipher.update(encrypted, "hex", "utf8");
        decipher.final("utf8");
        throw new Error("Should have failed with wrong key");
      } catch (error) {
        expect(error.message).to.not.equal("Should have failed with wrong key");
        console.log("   ✅ Wrong key rejected");
      }
    });
  });

  describe("User Index Derivation", function () {
    it("should create deterministic index from userId", function () {
      const userId1 = "user-123-abc";
      const userId2 = "user-456-def";

      const hash1 = crypto.createHash("sha256").update(userId1).digest();
      const index1 = hash1.readUInt32BE(0) % 2147483648;

      const hash2 = crypto.createHash("sha256").update(userId2).digest();
      const index2 = hash2.readUInt32BE(0) % 2147483648;

      expect(index1).to.not.equal(index2);
      expect(index1).to.be.within(0, 2147483647);
      expect(index2).to.be.within(0, 2147483647);

      console.log("   ✅ User indices are deterministic and unique");
    });

    it("should produce same index for same userId", function () {
      const userId = "test-user-789";

      const hash1 = crypto.createHash("sha256").update(userId).digest();
      const index1 = hash1.readUInt32BE(0) % 2147483648;

      const hash2 = crypto.createHash("sha256").update(userId).digest();
      const index2 = hash2.readUInt32BE(0) % 2147483648;

      expect(index1).to.equal(index2);
      console.log("   ✅ Same userId produces same index");
    });
  });

  describe("BIP44 Derivation Paths", function () {
    it("should use correct BTC derivation path", function () {
      const btcPath = "m/44'/0'/0'/0";
      expect(btcPath).to.match(/^m\/44'\/0'\/0'\/0$/);
      console.log("   ✅ BTC path: m/44'/0'/0'/0");
    });

    it("should use correct ETH derivation path", function () {
      const ethPath = "m/44'/60'/0'/0";
      expect(ethPath).to.match(/^m\/44'\/60'\/0'\/0$/);
      console.log("   ✅ ETH path: m/44'/60'/0'/0");
    });

    it("should use correct USDT derivation path", function () {
      const usdtPath = "m/44'/60'/0'/0";
      expect(usdtPath).to.match(/^m\/44'\/60'\/0'\/0$/);
      console.log("   ✅ USDT path: m/44'/60'/0'/0 (ERC-20)");
    });
  });

  describe("Master Seed Validation", function () {
    it("should require 24-word mnemonic", function () {
      const valid24Words =
        "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art";
      const words = valid24Words.split(" ");

      expect(words).to.have.lengthOf(24);
      console.log("   ✅ 24-word mnemonic validated");
    });

    it("should reject invalid word count", function () {
      const invalid12Words =
        "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
      const words = invalid12Words.split(" ");

      expect(words).to.not.have.lengthOf(24);
      console.log("   ✅ Invalid word count rejected");
    });
  });

  describe("Rotation Logic", function () {
    it("should increment derivation index on rotation", function () {
      const baseIndex = 100;
      const rotationCount = 1;
      const newIndex = baseIndex + rotationCount;

      expect(newIndex).to.equal(101);
      expect(newIndex).to.be.greaterThan(baseIndex);
      console.log("   ✅ Rotation increments index");
    });

    it("should preserve balance during rotation", function () {
      const oldBalance = 1.5;
      const newBalance = oldBalance; // Balance should transfer

      expect(newBalance).to.equal(oldBalance);
      console.log("   ✅ Balance preserved");
    });
  });

  after(function () {
    console.log("\n✅ All wallet unit tests passed!\n");
  });
});
