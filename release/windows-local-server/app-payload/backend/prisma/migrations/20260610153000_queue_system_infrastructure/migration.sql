-- CreateEnum
CREATE TYPE "QueueName" AS ENUM ('PRINTING', 'NOTIFICATIONS', 'ANALYTICS', 'EXPORTS', 'BACKUPS', 'FAILED_PRINT_JOBS');

-- CreateEnum
CREATE TYPE "QueueJobStatus" AS ENUM ('WAITING', 'ACTIVE', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "QueueJobType" AS ENUM (
    'PRINT_RECEIPT',
    'PRINT_KITCHEN_TICKET',
    'PRINT_ORDER_UPDATE_TICKET',
    'PRINT_TEST_PAGE',
    'NOTIFY_ORDER_CREATED',
    'NOTIFY_ORDER_PREPARING',
    'NOTIFY_ORDER_READY',
    'NOTIFY_ORDER_DELIVERED',
    'NOTIFY_ORDER_PAID',
    'ANALYTICS_SALES_AGGREGATION',
    'ANALYTICS_DAILY_METRICS',
    'ANALYTICS_DASHBOARD_CALCULATION',
    'EXPORT_SALES_REPORT',
    'EXPORT_INVENTORY',
    'EXPORT_CUSTOMERS',
    'BACKUP_DATABASE',
    'BACKUP_REPORTS',
    'BACKUP_SETTINGS'
);

ALTER TYPE "PrintJobType" RENAME VALUE 'TEST' TO 'TEST_PAGE';
ALTER TYPE "PrintJobType" ADD VALUE IF NOT EXISTS 'ORDER_UPDATE_TICKET';
ALTER TYPE "ReportType" ADD VALUE IF NOT EXISTS 'INVENTORY';
ALTER TYPE "ReportType" ADD VALUE IF NOT EXISTS 'CUSTOMERS';
ALTER TYPE "ReportStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';

CREATE TYPE "PrintJobStatus_new" AS ENUM ('WAITING', 'ACTIVE', 'COMPLETED', 'FAILED');
ALTER TABLE "print_jobs"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "PrintJobStatus_new"
  USING (
    CASE
      WHEN "status"::text = 'PENDING' THEN 'WAITING'::"PrintJobStatus_new"
      WHEN "status"::text = 'PROCESSING' THEN 'ACTIVE'::"PrintJobStatus_new"
      ELSE "status"::text::"PrintJobStatus_new"
    END
  );
ALTER TYPE "PrintJobStatus" RENAME TO "PrintJobStatus_old";
ALTER TYPE "PrintJobStatus_new" RENAME TO "PrintJobStatus";
DROP TYPE "PrintJobStatus_old";
ALTER TABLE "print_jobs" ALTER COLUMN "status" SET DEFAULT 'WAITING';

ALTER TABLE "print_jobs"
  ADD COLUMN "jobId" VARCHAR(191),
  ADD COLUMN "restaurantId" UUID,
  ADD COLUMN "printerId" UUID,
  ADD COLUMN "queueJobId" UUID,
  ADD COLUMN "payload" JSONB,
  ADD COLUMN "result" JSONB,
  ADD COLUMN "failedReason" TEXT,
  ADD COLUMN "processedAt" TIMESTAMP(3);

UPDATE "print_jobs" pj
SET "restaurantId" = o."restaurantId"
FROM "orders" o
WHERE pj."orderId" = o."id" AND pj."restaurantId" IS NULL;

ALTER TABLE "report_export_jobs"
  ADD COLUMN "queueJobId" UUID,
  ADD COLUMN "filePath" TEXT,
  ADD COLUMN "errorMessage" TEXT,
  ADD COLUMN "startedAt" TIMESTAMP(3),
  ADD COLUMN "failedAt" TIMESTAMP(3);

CREATE TABLE "queue_jobs" (
  "id" UUID NOT NULL,
  "bullJobId" VARCHAR(191) NOT NULL,
  "queueName" "QueueName" NOT NULL,
  "jobType" "QueueJobType" NOT NULL,
  "restaurantId" UUID,
  "status" "QueueJobStatus" NOT NULL DEFAULT 'WAITING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "payload" JSONB NOT NULL,
  "result" JSONB,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "processedAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),

  CONSTRAINT "queue_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "failed_print_jobs" (
  "id" UUID NOT NULL,
  "queueJobId" UUID NOT NULL,
  "printJobId" UUID,
  "printerId" UUID,
  "jobId" VARCHAR(191) NOT NULL,
  "restaurantId" UUID NOT NULL,
  "payload" JSONB NOT NULL,
  "error" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL,
  "failedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "failed_print_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "print_jobs_jobId_key" ON "print_jobs"("jobId");
CREATE UNIQUE INDEX "print_jobs_queueJobId_key" ON "print_jobs"("queueJobId");
CREATE INDEX "print_jobs_restaurantId_idx" ON "print_jobs"("restaurantId");
CREATE INDEX "print_jobs_printerId_idx" ON "print_jobs"("printerId");
CREATE UNIQUE INDEX "report_export_jobs_queueJobId_key" ON "report_export_jobs"("queueJobId");
CREATE UNIQUE INDEX "queue_jobs_bullJobId_key" ON "queue_jobs"("bullJobId");
CREATE INDEX "queue_jobs_queueName_idx" ON "queue_jobs"("queueName");
CREATE INDEX "queue_jobs_jobType_idx" ON "queue_jobs"("jobType");
CREATE INDEX "queue_jobs_restaurantId_idx" ON "queue_jobs"("restaurantId");
CREATE INDEX "queue_jobs_status_idx" ON "queue_jobs"("status");
CREATE UNIQUE INDEX "failed_print_jobs_queueJobId_key" ON "failed_print_jobs"("queueJobId");
CREATE UNIQUE INDEX "failed_print_jobs_printJobId_key" ON "failed_print_jobs"("printJobId");
CREATE INDEX "failed_print_jobs_printerId_idx" ON "failed_print_jobs"("printerId");
CREATE INDEX "failed_print_jobs_restaurantId_idx" ON "failed_print_jobs"("restaurantId");
CREATE INDEX "failed_print_jobs_failedAt_idx" ON "failed_print_jobs"("failedAt");

ALTER TABLE "print_jobs"
  ADD CONSTRAINT "print_jobs_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "print_jobs_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "printer_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "print_jobs_queueJobId_fkey" FOREIGN KEY ("queueJobId") REFERENCES "queue_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "report_export_jobs"
  ADD CONSTRAINT "report_export_jobs_queueJobId_fkey" FOREIGN KEY ("queueJobId") REFERENCES "queue_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "queue_jobs"
  ADD CONSTRAINT "queue_jobs_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "failed_print_jobs"
  ADD CONSTRAINT "failed_print_jobs_queueJobId_fkey" FOREIGN KEY ("queueJobId") REFERENCES "queue_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "failed_print_jobs_printJobId_fkey" FOREIGN KEY ("printJobId") REFERENCES "print_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "failed_print_jobs_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "printer_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "failed_print_jobs_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
