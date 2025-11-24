/**
 * Custodial Wallet Service
 *
 * Each user gets unique crypto addresses derived from master seed.
 * Platform controls private keys (custodial model).
 * Supports BTC, ETH, USDT with rotation capability.
 */

import { BIP32Factory } from "bip32";
import * as bip39 from "bip39";
import * as bitcoin from "bitcoinjs-lib";
import crypto from "crypto";
import { ethers } from "ethers";
import * as ecc from "tiny-secp256k1";
import prisma from "../prismaClient.js";

const bip32 = BIP32Factory(ecc);

// BIP44 Derivation Paths
// m / purpose' / coin_type' / account' / change / address_index
const DERIVATION_PATHS = {
  BTC: "m/44'/0'/0'/0", // Bitcoin mainnet
  ETH: "m/44'/60'/0'/0", // Ethereum
  USDT: "m/44'/60'/0'/0", // USDT on Ethereum (ERC-20)
};

/**
 * WARNING: Store MASTER_SEED securely!
 * - Use AWS KMS, Azure Key Vault, or HashiCorp Vault
 * - Never commit to git
 * - Rotate quarterly
 */
const MASTER_SEED = process.env.WALLET_MASTER_SEED || "";
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || "";

if (!MASTER_SEED) {
  console.error("⚠️ WALLET_MASTER_SEED not set. Wallet generation disabled.");
}

/**
 * Generate unique crypto address for a user
 */
export async function generateUserWallet(
  userId: string,
  currency: "BTC" | "ETH" | "USDT",
) {
  if (!MASTER_SEED) {
    throw new Error("Wallet master seed not configured");
  }

  // Derive unique index from userId (deterministic)
  const userIndex = getUserIndex(userId);

  let address: string;
  let encryptedPrivateKey: string;

  if (currency === "BTC") {
    const { address: btcAddress, privateKey } = deriveBitcoinAddress(userIndex);
    address = btcAddress;
    encryptedPrivateKey = encryptPrivateKey(privateKey);
  } else if (currency === "ETH" || currency === "USDT") {
    const { address: ethAddress, privateKey } =
      deriveEthereumAddress(userIndex);
    address = ethAddress;
    encryptedPrivateKey = encryptPrivateKey(privateKey);
  } else {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  // Store in database
  const wallet = await prisma.cryptoWallet.upsert({
    where: {
      userId_currency: { userId, currency },
    },
    update: {
      address,
      updatedAt: new Date(),
    },
    create: {
      userId,
      currency,
      balance: 0,
      address,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Store encrypted private key separately (secure table with restricted access)
  await prisma.$executeRaw`
    INSERT INTO crypto_wallet_keys (wallet_id, encrypted_private_key, created_at)
    VALUES (${wallet.id}, ${encryptedPrivateKey}, NOW())
    ON CONFLICT (wallet_id) DO UPDATE SET 
      encrypted_private_key = ${encryptedPrivateKey},
      rotated_at = NOW()
  `;

  return {
    userId,
    currency,
    address,
    balance: wallet.balance.toString(),
    createdAt: wallet.createdAt,
  };
}

/**
 * Derive Bitcoin address from master seed
 */
function deriveBitcoinAddress(index: number): {
  address: string;
  privateKey: string;
} {
  const seed = bip39.mnemonicToSeedSync(MASTER_SEED);
  const root = bip32.fromSeed(seed);
  const path = `${DERIVATION_PATHS.BTC}/${index}`;
  const child = root.derivePath(path);

  const { address } = bitcoin.payments.p2pkh({
    pubkey: child.publicKey,
    network: bitcoin.networks.bitcoin,
  });

  if (!address) {
    throw new Error("Failed to generate Bitcoin address");
  }

  return {
    address,
    privateKey: Buffer.from(child.privateKey!).toString("hex"),
  };
}

/**
 * Derive Ethereum/USDT address from master seed
 */
function deriveEthereumAddress(index: number): {
  address: string;
  privateKey: string;
} {
  const seed = bip39.mnemonicToSeedSync(MASTER_SEED);
  const hdNode = ethers.HDNodeWallet.fromSeed(seed);
  const path = `${DERIVATION_PATHS.ETH}/${index}`;
  const wallet = hdNode.derivePath(path);

  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

/**
 * Convert userId to deterministic index (0-4294967295)
 */
function getUserIndex(userId: string): number {
  const hash = crypto.createHash("sha256").update(userId).digest();
  return hash.readUInt32BE(0);
}

/**
 * Encrypt private key with AES-256-GCM
 */
function encryptPrivateKey(privateKey: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("Wallet encryption key not configured");
  }

  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(privateKey, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encryptedData
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt private key (only for withdrawals/admin operations)
 */
function decryptPrivateKey(encryptedData: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("Wallet encryption key not configured");
  }

  const [ivHex, authTagHex, encrypted] = encryptedData.split(":");
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Rotate user's wallet address (new address, same userId)
 */
export async function rotateUserWallet(
  userId: string,
  currency: "BTC" | "ETH" | "USDT",
  reason: string,
) {
  const oldWallet = await prisma.cryptoWallet.findFirst({
    where: { userId, currency },
  });

  if (!oldWallet) {
    throw new Error(`No existing wallet for user ${userId} in ${currency}`);
  }

  // Generate new address with incremented index
  const userIndex = getUserIndex(userId) + (Date.now() % 1000); // Add timestamp for uniqueness

  let newAddress: string;
  let encryptedPrivateKey: string;

  if (currency === "BTC") {
    const { address, privateKey } = deriveBitcoinAddress(userIndex);
    newAddress = address;
    encryptedPrivateKey = encryptPrivateKey(privateKey);
  } else {
    const { address, privateKey } = deriveEthereumAddress(userIndex);
    newAddress = address;
    encryptedPrivateKey = encryptPrivateKey(privateKey);
  }

  // Update wallet with new address
  await prisma.$transaction(async (tx) => {
    // Archive old address
    await tx.$executeRaw`
      INSERT INTO crypto_wallet_history (wallet_id, old_address, rotation_reason, rotated_at)
      VALUES (${oldWallet.id}, ${oldWallet.address}, ${reason}, NOW())
    `;

    // Update to new address
    await tx.cryptoWallet.update({
      where: { id: oldWallet.id },
      data: { address: newAddress },
    });

    // Update encrypted key
    await tx.$executeRaw`
      UPDATE crypto_wallet_keys 
      SET encrypted_private_key = ${encryptedPrivateKey}, rotated_at = NOW()
      WHERE wallet_id = ${oldWallet.id}
    `;

    // Audit log
    await tx.auditLog.create({
      data: {
        userId,
        action: "WALLET_ROTATED",
        resourceType: "CRYPTO_WALLET",
        resourceId: oldWallet.id,
        details: JSON.stringify({
          currency,
          oldAddress: oldWallet.address,
          newAddress,
          reason,
        }),
        ipAddress: "system",
      },
    });
  });

  return {
    currency,
    oldAddress: oldWallet.address,
    newAddress,
    reason,
    rotatedAt: new Date(),
  };
}

/**
 * Initialize wallet for user on signup
 */
export async function initializeUserWallets(userId: string) {
  const currencies: Array<"BTC" | "ETH" | "USDT"> = ["BTC", "ETH", "USDT"];

  const wallets = await Promise.all(
    currencies.map((currency) => generateUserWallet(userId, currency)),
  );

  return wallets;
}

/**
 * Generate new master seed (ADMIN ONLY - ONE TIME SETUP)
 */
export function generateMasterSeed(): { mnemonic: string; seed: string } {
  const mnemonic = bip39.generateMnemonic(256); // 24 words
  const seed = bip39.mnemonicToSeedSync(mnemonic).toString("hex");

  return {
    mnemonic, // Store in vault (AWS KMS, etc.)
    seed, // Derive from mnemonic when needed
  };
}
