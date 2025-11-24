# 🔒 PR #8 Security Review Checklist - Custodial Wallet System

## ⚠️ CRITICAL SECURITY ITEMS

### 1. Private Key Management

-   [ ] **Never log private keys or mnemonics**

  ```bash
  # Run this check:
  grep -r "console.log.*privateKey\|logger.*mnemonic" backend/src --include="*.ts"
  # Expected: No matches
  ```

-   [ ] **Mnemonic stored encrypted at rest**
    -   Check: Does `wallets` table store encrypted blobs?
    -   Algorithm: Must be AES-256-GCM or better
    -   Key storage: Encryption key in separate env var `WALLET_ENCRYPTION_KEY`

-   [ ] **Environment variables for secrets**

  ```bash
  # Required in .env:
  WALLET_MNEMONIC=word1 word2 ... word12
  WALLET_ENCRYPTION_KEY=hex_64_chars
  ```

### 2. Derivation Path Compliance

-   [ ] **BIP-44 standard paths**
    -   Bitcoin: `m/44'/0'/0'/0/n`
    -   Ethereum: `m/44'/60'/0'/0/n`

  ```typescript
  // Verify in code:
  const path = `m/44'/${coin === "BTC" ? 0 : 60}'/0'/0/${index}`;
  ```

### 3. Backup & Recovery

-   [ ] **Mnemonic backup procedure documented**
    -   Where: `WALLET_BACKUP_GUIDE.md`
    -   Includes: Offline storage instructions, recovery steps

-   [ ] **Key rotation plan exists**
    -   How to migrate to new mnemonic
    -   Zero-downtime migration strategy

### 4. Access Control

-   [ ] **Withdrawal endpoints require admin approval**

  ```typescript
  router.post("/withdraw", authenticateToken, requireAdmin, async (req, res) => {
    // withdrawal logic
  });
  ```

-   [ ] **Rate limiting on crypto operations**

  ```typescript
  router.post('/withdraw',
    rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }), // 5 per 15 min
    authenticateToken,
    requireAdmin,
    async (req, res) => { ... }
  );
  ```

-   [ ] **Audit logging for all wallet operations**

  ```typescript
  await prisma.auditLog.create({
    data: {
      action: "wallet_withdrawal",
      userId: req.user.id,
      resourceType: "wallet",
      resourceId: walletAddress,
      metadata: { amount, currency, txHash },
    },
  });
  ```

### 5. Testing

-   [ ] **Unit tests for key generation**
    -   Test: Generate 1000 addresses, all unique
    -   Test: Derive same address from same index

-   [ ] **Mock blockchain in tests**
    -   Use test networks: Sepolia (ETH), Bitcoin Testnet
    -   Never test with mainnet keys

-   [ ] **Test coverage ≥ 80%**

  ```bash
  cd backend
  npm run test:coverage
  # Check: src/services/walletService.ts coverage
  ```

### 6. Monitoring

-   [ ] **Alerts for unusual activity**
    -   Large withdrawals (> $1000)
    -   Multiple withdrawal attempts
    -   Balance discrepancies

-   [ ] **Transaction monitoring**
    -   Log all on-chain transactions
    -   Compare on-chain vs database balances daily

## 📋 CODE REVIEW CHECKLIST

### Check These Files

1. `backend/src/services/walletService.ts` - Core wallet logic
2. `backend/src/routes/wallet.ts` - API endpoints
3. `backend/src/utils/crypto.ts` - Encryption helpers
4. `backend/prisma/schema.prisma` - Wallet schema

### Run These Commands

```bash
# 1. Search for security issues
cd backend
grep -r "privateKey\|mnemonic\|seed" src/ --include="*.ts" | grep -v "import\|interface\|type"

# 2. Check for console.log in production code
grep -r "console\.(log|info|debug)" src/ --include="*.ts" | grep -v "logger"

# 3. Verify encryption usage
grep -r "encrypt\|decrypt" src/utils/ --include="*.ts"

# 4. Check audit logging
grep -r "auditLog.create" src/services/walletService.ts

# 5. Run tests
npm test -- wallet
```

## ⚠️ RED FLAGS - DO NOT MERGE IF

-   [ ] Private keys appear in logs
-   [ ] No encryption on stored mnemonics
-   [ ] Missing rate limits on withdrawal endpoints
-   [ ] No audit logging
-   [ ] Test coverage < 80%
-   [ ] Hardcoded test mnemonics in production code

## ✅ APPROVAL CRITERIA

-   [ ] All security items checked
-   [ ] No red flags found
-   [ ] Tests pass with >80% coverage
-   [ ] Documentation complete
-   [ ] Manual testing on testnet successful

## 🚀 POST-MERGE ACTIONS

1. **Backup master mnemonic offline**
   -   Print on paper, store in safe
   -   Never email or Slack the mnemonic

2. **Enable monitoring**
   -   Set up Sentry alerts for wallet errors
   -   Daily balance reconciliation cron job

3. **Production deployment**
   -   Use hardware wallet for master key (Ledger/Trezor)
   -   Rotate all test keys
   -   Update `WALLET_MNEMONIC` env var in production

## 📝 REVIEWER NOTES

_Add your findings here:_

-   [ ] Reviewed by: **\*\***\_\_**\*\***
-   [ ] Date: **\*\***\_\_**\*\***
-   [ ] Approved: YES / NO / NEEDS CHANGES

---

**Questions for PR Author:**

1. How is the master mnemonic backed up?
2. What's the recovery procedure if mnemonic is lost?
3. Are withdrawal amounts capped per transaction?
4. Is there manual approval for withdrawals >$500?
5. How do you handle failed blockchain transactions?
