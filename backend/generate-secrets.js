#!/usr/bin/env node

/**
 * Generate secure secrets for Advancia Pay Backend
 * Run: node generate-secrets.js
 */

const crypto = require('crypto');
const bip39 = require('bip39');

console.log('\n🔐 Advancia Pay - Secret Generator\n');
console.log('=' .repeat(60));

// JWT Secrets
console.log('\n📝 JWT Secrets (64+ chars):\n');
console.log('JWT_SECRET=' + crypto.randomBytes(64).toString('hex'));
console.log('JWT_REFRESH_SECRET=' + crypto.randomBytes(64).toString('hex'));

// Wallet Master Seed (24 words = 256 bits)
console.log('\n💰 Wallet Master Seed (24 words - KEEP SECRET!):\n');
const masterSeed = bip39.generateMnemonic(256);
console.log('WALLET_MASTER_SEED=' + masterSeed);
console.log('\n⚠️  CRITICAL: Write this down on paper and store in a vault!');
console.log('⚠️  Loss of this seed = permanent loss of all user funds!');

// Wallet Encryption Key (32 bytes = 256 bits for AES-256)
console.log('\n🔒 Wallet Encryption Key (32 bytes, base64):\n');
const encryptionKey = crypto.randomBytes(32).toString('base64');
console.log('WALLET_ENCRYPTION_KEY=' + encryptionKey);
console.log('\n⚠️  Store this separately from the master seed!');

// Session Secret
console.log('\n🍪 Session Secret (64+ chars):\n');
console.log('SESSION_SECRET=' + crypto.randomBytes(64).toString('hex'));

// Webhook Secrets
console.log('\n🔗 Webhook Secrets:\n');
console.log('STRIPE_WEBHOOK_SECRET=whsec_' + crypto.randomBytes(24).toString('hex'));
console.log('CRYPTOMUS_WEBHOOK_SECRET=' + crypto.randomBytes(32).toString('hex'));

// API Keys (template)
console.log('\n🔑 API Key Format (for custom endpoints):\n');
console.log('API_KEY=' + crypto.randomBytes(32).toString('base64url'));

console.log('\n' + '=' .repeat(60));
console.log('\n✅ Secrets generated successfully!');
console.log('\n📋 Next Steps:');
console.log('1. Copy secrets to backend/.env');
console.log('2. Store master seed in secure vault (1Password, KeePass)');
console.log('3. Store encryption key separately');
console.log('4. Never commit .env files to git');
console.log('5. Use different secrets for dev/staging/production\n');

// VAPID Keys reminder
console.log('💬 For VAPID keys (web push notifications), run:');
console.log('   npx web-push generate-vapid-keys\n');
