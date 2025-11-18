/*
  Warnings:

  - You are about to drop the `crypto_wallet_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `crypto_wallet_keys` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `amount` to the `crypto_withdrawals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `crypto_withdrawals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destinationAddress` to the `crypto_withdrawals` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."crypto_wallet_history" DROP CONSTRAINT "fk_wallet_history_wallet";

-- DropForeignKey
ALTER TABLE "public"."crypto_wallet_keys" DROP CONSTRAINT "fk_wallet_keys_wallet";

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "details" JSONB;

-- AlterTable
ALTER TABLE "crypto_wallets" ADD COLUMN     "lockedBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "totalIn" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "totalOut" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "crypto_withdrawals" ADD COLUMN     "amount" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "destinationAddress" TEXT NOT NULL,
ADD COLUMN     "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "public"."crypto_wallet_history";

-- DropTable
DROP TABLE "public"."crypto_wallet_keys";

-- CreateIndex
CREATE INDEX "crypto_withdrawals_currency_idx" ON "crypto_withdrawals"("currency");

-- CreateIndex
CREATE INDEX "crypto_withdrawals_requestedAt_idx" ON "crypto_withdrawals"("requestedAt");
