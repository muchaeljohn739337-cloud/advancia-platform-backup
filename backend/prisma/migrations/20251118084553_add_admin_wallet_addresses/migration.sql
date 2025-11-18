/*
  Warnings:

  - A unique constraint covering the columns `[orderId]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AlertMode" AS ENUM ('IMMEDIATE', 'BATCHED', 'MIXED');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPERADMIN';

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "orderId" TEXT,
ADD COLUMN     "provider" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "gpt5Enabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "admin_wallets" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalIn" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalOut" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "walletAddress" TEXT,
    "walletProvider" TEXT,
    "walletNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_wallet_transactions" (
    "id" TEXT NOT NULL,
    "adminWalletId" TEXT NOT NULL,
    "userId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_policies" (
    "id" TEXT NOT NULL,
    "routeGroup" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "cooldown" INTEGER NOT NULL DEFAULT 300000,
    "mode" "AlertMode" NOT NULL DEFAULT 'IMMEDIATE',
    "batchIntervalMs" INTEGER,
    "channels" TEXT[],
    "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "alert_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_audit_logs" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "changesBefore" JSONB,
    "changesAfter" JSONB NOT NULL,
    "reason" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entryHash" TEXT,
    "prevHash" TEXT,
    "signature" TEXT,

    CONSTRAINT "policy_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_sessions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" TEXT NOT NULL,
    "provider" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "redirectUrl" TEXT,
    "callbackUrl" TEXT,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "failedReason" TEXT,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kycLevel" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "firstName" TEXT,
    "lastName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT,
    "idDocumentType" TEXT,
    "idDocumentNumber" TEXT,
    "idDocumentFront" TEXT,
    "idDocumentBack" TEXT,
    "selfieImage" TEXT,
    "addressProof" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "phoneNumber" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3),
    "dailyWithdrawLimit" DECIMAL(65,30) NOT NULL DEFAULT 100,
    "monthlyWithdrawLimit" DECIMAL(65,30) NOT NULL DEFAULT 1000,
    "lifetimeLimit" DECIMAL(65,30) NOT NULL DEFAULT 10000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "actionTaken" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ip_reputations" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "isVPN" BOOLEAN NOT NULL DEFAULT false,
    "isProxy" BOOLEAN NOT NULL DEFAULT false,
    "isTor" BOOLEAN NOT NULL DEFAULT false,
    "isHosting" BOOLEAN NOT NULL DEFAULT false,
    "country" TEXT,
    "city" TEXT,
    "isp" TEXT,
    "blacklisted" BOOLEAN NOT NULL DEFAULT false,
    "whitelisted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ip_reputations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_fees" (
    "id" TEXT NOT NULL,
    "feeType" TEXT NOT NULL,
    "currency" TEXT,
    "feePercent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "flatFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "minFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "maxFee" DECIMAL(65,30),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "transaction_fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_revenues" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL,
    "baseAmount" DECIMAL(65,30) NOT NULL,
    "feePercent" DECIMAL(65,30) NOT NULL,
    "flatFee" DECIMAL(65,30) NOT NULL,
    "totalFee" DECIMAL(65,30) NOT NULL,
    "netAmount" DECIMAL(65,30) NOT NULL,
    "revenueUSD" DECIMAL(65,30) NOT NULL,
    "feeRuleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_revenues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_messages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromAdminId" TEXT NOT NULL,
    "fromAdmin" TEXT NOT NULL,
    "toUserId" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "attachments" JSONB,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "category" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "repliedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawal_queue" (
    "id" TEXT NOT NULL,
    "withdrawalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cryptoType" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "assignedTo" TEXT,
    "estimatedTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawal_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_wallets_currency_key" ON "admin_wallets"("currency");

-- CreateIndex
CREATE INDEX "admin_wallet_transactions_adminWalletId_idx" ON "admin_wallet_transactions"("adminWalletId");

-- CreateIndex
CREATE INDEX "admin_wallet_transactions_userId_idx" ON "admin_wallet_transactions"("userId");

-- CreateIndex
CREATE INDEX "admin_wallet_transactions_type_idx" ON "admin_wallet_transactions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "alert_policies_routeGroup_key" ON "alert_policies"("routeGroup");

-- CreateIndex
CREATE INDEX "alert_policies_routeGroup_idx" ON "alert_policies"("routeGroup");

-- CreateIndex
CREATE INDEX "policy_audit_logs_policyId_idx" ON "policy_audit_logs"("policyId");

-- CreateIndex
CREATE INDEX "policy_audit_logs_changedBy_idx" ON "policy_audit_logs"("changedBy");

-- CreateIndex
CREATE INDEX "policy_audit_logs_timestamp_idx" ON "policy_audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "policy_audit_logs_entryHash_idx" ON "policy_audit_logs"("entryHash");

-- CreateIndex
CREATE UNIQUE INDEX "payment_sessions_sessionId_key" ON "payment_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "payment_sessions_sessionId_idx" ON "payment_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "payment_sessions_userId_idx" ON "payment_sessions"("userId");

-- CreateIndex
CREATE INDEX "payment_sessions_status_idx" ON "payment_sessions"("status");

-- CreateIndex
CREATE INDEX "payment_sessions_expiresAt_idx" ON "payment_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "payment_sessions_createdAt_idx" ON "payment_sessions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_verifications_userId_key" ON "kyc_verifications"("userId");

-- CreateIndex
CREATE INDEX "kyc_verifications_userId_idx" ON "kyc_verifications"("userId");

-- CreateIndex
CREATE INDEX "kyc_verifications_kycLevel_idx" ON "kyc_verifications"("kycLevel");

-- CreateIndex
CREATE INDEX "kyc_verifications_status_idx" ON "kyc_verifications"("status");

-- CreateIndex
CREATE INDEX "kyc_verifications_verifiedAt_idx" ON "kyc_verifications"("verifiedAt");

-- CreateIndex
CREATE INDEX "fraud_alerts_userId_idx" ON "fraud_alerts"("userId");

-- CreateIndex
CREATE INDEX "fraud_alerts_alertType_idx" ON "fraud_alerts"("alertType");

-- CreateIndex
CREATE INDEX "fraud_alerts_severity_idx" ON "fraud_alerts"("severity");

-- CreateIndex
CREATE INDEX "fraud_alerts_resolved_idx" ON "fraud_alerts"("resolved");

-- CreateIndex
CREATE INDEX "fraud_alerts_createdAt_idx" ON "fraud_alerts"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ip_reputations_ipAddress_key" ON "ip_reputations"("ipAddress");

-- CreateIndex
CREATE INDEX "ip_reputations_ipAddress_idx" ON "ip_reputations"("ipAddress");

-- CreateIndex
CREATE INDEX "ip_reputations_blacklisted_idx" ON "ip_reputations"("blacklisted");

-- CreateIndex
CREATE INDEX "ip_reputations_riskScore_idx" ON "ip_reputations"("riskScore");

-- CreateIndex
CREATE INDEX "transaction_fees_feeType_idx" ON "transaction_fees"("feeType");

-- CreateIndex
CREATE INDEX "transaction_fees_currency_idx" ON "transaction_fees"("currency");

-- CreateIndex
CREATE INDEX "transaction_fees_active_idx" ON "transaction_fees"("active");

-- CreateIndex
CREATE INDEX "transaction_fees_priority_idx" ON "transaction_fees"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "fee_revenues_transactionId_key" ON "fee_revenues"("transactionId");

-- CreateIndex
CREATE INDEX "fee_revenues_userId_idx" ON "fee_revenues"("userId");

-- CreateIndex
CREATE INDEX "fee_revenues_transactionType_idx" ON "fee_revenues"("transactionType");

-- CreateIndex
CREATE INDEX "fee_revenues_createdAt_idx" ON "fee_revenues"("createdAt");

-- CreateIndex
CREATE INDEX "fee_revenues_baseCurrency_idx" ON "fee_revenues"("baseCurrency");

-- CreateIndex
CREATE INDEX "admin_messages_userId_idx" ON "admin_messages"("userId");

-- CreateIndex
CREATE INDEX "admin_messages_fromAdminId_idx" ON "admin_messages"("fromAdminId");

-- CreateIndex
CREATE INDEX "admin_messages_isRead_idx" ON "admin_messages"("isRead");

-- CreateIndex
CREATE INDEX "admin_messages_createdAt_idx" ON "admin_messages"("createdAt");

-- CreateIndex
CREATE INDEX "admin_messages_repliedTo_idx" ON "admin_messages"("repliedTo");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawal_queue_withdrawalId_key" ON "withdrawal_queue"("withdrawalId");

-- CreateIndex
CREATE INDEX "withdrawal_queue_withdrawalId_idx" ON "withdrawal_queue"("withdrawalId");

-- CreateIndex
CREATE INDEX "withdrawal_queue_userId_idx" ON "withdrawal_queue"("userId");

-- CreateIndex
CREATE INDEX "withdrawal_queue_status_idx" ON "withdrawal_queue"("status");

-- CreateIndex
CREATE INDEX "withdrawal_queue_priority_idx" ON "withdrawal_queue"("priority");

-- CreateIndex
CREATE INDEX "withdrawal_queue_estimatedTime_idx" ON "withdrawal_queue"("estimatedTime");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_orderId_key" ON "transactions"("orderId");

-- CreateIndex
CREATE INDEX "transactions_orderId_idx" ON "transactions"("orderId");

-- CreateIndex
CREATE INDEX "transactions_provider_idx" ON "transactions"("provider");

-- AddForeignKey
ALTER TABLE "admin_wallet_transactions" ADD CONSTRAINT "admin_wallet_transactions_adminWalletId_fkey" FOREIGN KEY ("adminWalletId") REFERENCES "admin_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_wallet_transactions" ADD CONSTRAINT "admin_wallet_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_audit_logs" ADD CONSTRAINT "policy_audit_logs_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "alert_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
