/*
  Warnings:

  - You are about to alter the column `amount` on the `transactions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to drop the column `avatar` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `coverImage` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `dateOfBirth` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `investmentGoals` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `linkedinUrl` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `notifications` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `occupation` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `riskTolerance` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `totalDeposits` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `totalTrades` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `totalWithdrawals` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `twitterHandle` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the `crypto_payments` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[emailSignupToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeCustomerId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "invoice_items" ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "user_profiles" DROP COLUMN "avatar",
DROP COLUMN "coverImage",
DROP COLUMN "currency",
DROP COLUMN "dateOfBirth",
DROP COLUMN "investmentGoals",
DROP COLUMN "language",
DROP COLUMN "linkedinUrl",
DROP COLUMN "notifications",
DROP COLUMN "occupation",
DROP COLUMN "riskTolerance",
DROP COLUMN "timezone",
DROP COLUMN "totalDeposits",
DROP COLUMN "totalTrades",
DROP COLUMN "totalWithdrawals",
DROP COLUMN "twitterHandle",
ALTER COLUMN "createdAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "emailSignupToken" TEXT,
ADD COLUMN     "emailSignupTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "firstLoginCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "signupMethod" TEXT NOT NULL DEFAULT 'password',
ADD COLUMN     "stripeCustomerId" TEXT;

-- DropTable
DROP TABLE "public"."crypto_payments";

-- CreateTable
CREATE TABLE "crypto_wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crypto_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CryptoPayments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payment_url" TEXT,
    "order_id" TEXT,
    "description" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "CryptoPayments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "adminViewed" BOOLEAN NOT NULL DEFAULT false,
    "adminViewedBy" TEXT,
    "adminViewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "successful" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_user_notes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "noteType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "tags" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_user_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "eventName" TEXT NOT NULL,
    "eventProperties" JSONB,
    "userProperties" JSONB,
    "deviceInfo" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "url" TEXT,
    "platform" TEXT,
    "appVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crypto_wallets_address_key" ON "crypto_wallets"("address");

-- CreateIndex
CREATE INDEX "crypto_wallets_userId_idx" ON "crypto_wallets"("userId");

-- CreateIndex
CREATE INDEX "crypto_wallets_currency_idx" ON "crypto_wallets"("currency");

-- CreateIndex
CREATE UNIQUE INDEX "crypto_wallets_userId_currency_key" ON "crypto_wallets"("userId", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_requests_token_key" ON "password_reset_requests"("token");

-- CreateIndex
CREATE INDEX "password_reset_requests_userId_idx" ON "password_reset_requests"("userId");

-- CreateIndex
CREATE INDEX "password_reset_requests_email_idx" ON "password_reset_requests"("email");

-- CreateIndex
CREATE INDEX "password_reset_requests_token_idx" ON "password_reset_requests"("token");

-- CreateIndex
CREATE INDEX "password_reset_requests_createdAt_idx" ON "password_reset_requests"("createdAt");

-- CreateIndex
CREATE INDEX "user_activities_userId_idx" ON "user_activities"("userId");

-- CreateIndex
CREATE INDEX "user_activities_email_idx" ON "user_activities"("email");

-- CreateIndex
CREATE INDEX "user_activities_action_idx" ON "user_activities"("action");

-- CreateIndex
CREATE INDEX "user_activities_createdAt_idx" ON "user_activities"("createdAt");

-- CreateIndex
CREATE INDEX "admin_user_notes_userId_idx" ON "admin_user_notes"("userId");

-- CreateIndex
CREATE INDEX "admin_user_notes_adminId_idx" ON "admin_user_notes"("adminId");

-- CreateIndex
CREATE INDEX "admin_user_notes_noteType_idx" ON "admin_user_notes"("noteType");

-- CreateIndex
CREATE INDEX "admin_user_notes_createdAt_idx" ON "admin_user_notes"("createdAt");

-- CreateIndex
CREATE INDEX "analytics_events_userId_idx" ON "analytics_events"("userId");

-- CreateIndex
CREATE INDEX "analytics_events_eventName_idx" ON "analytics_events"("eventName");

-- CreateIndex
CREATE INDEX "analytics_events_timestamp_idx" ON "analytics_events"("timestamp");

-- CreateIndex
CREATE INDEX "analytics_events_sessionId_idx" ON "analytics_events"("sessionId");

-- CreateIndex
CREATE INDEX "analytics_events_createdAt_idx" ON "analytics_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_emailSignupToken_key" ON "users"("emailSignupToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripeCustomerId_key" ON "users"("stripeCustomerId");

-- AddForeignKey
ALTER TABLE "crypto_wallets" ADD CONSTRAINT "crypto_wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
