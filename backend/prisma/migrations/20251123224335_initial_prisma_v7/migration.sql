-- CreateTable
CREATE TABLE "FailedJob" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "data" TEXT NOT NULL,
    "error" TEXT NOT NULL,
    "stackTrace" TEXT,
    "attempts" INTEGER NOT NULL,
    "failedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FailedJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FailedJob_type_idx" ON "FailedJob"("type");

-- CreateIndex
CREATE INDEX "FailedJob_priority_idx" ON "FailedJob"("priority");

-- CreateIndex
CREATE INDEX "FailedJob_failedAt_idx" ON "FailedJob"("failedAt");
