ALTER TABLE "restaurant_settings"
ADD COLUMN IF NOT EXISTS "maxAutoDiscountPercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS "refundAlertThreshold" DOUBLE PRECISION NOT NULL DEFAULT 10000;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payments'
      AND column_name = 'method'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payments'
      AND column_name = 'paymentMethod'
  ) THEN
    ALTER TABLE "payments" RENAME COLUMN "method" TO "paymentMethod";
  END IF;
END $$;

ALTER TABLE "payments"
ADD COLUMN IF NOT EXISTS "referenceNumber" TEXT,
ADD COLUMN IF NOT EXISTS "notes" TEXT,
ADD COLUMN IF NOT EXISTS "reason" TEXT,
ADD COLUMN IF NOT EXISTS "refundedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "remainingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "createdBy" UUID,
ADD COLUMN IF NOT EXISTS "updatedBy" UUID,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "payments"
SET
  "remainingAmount" = COALESCE("amount", 0),
  "updatedAt" = COALESCE("createdAt", CURRENT_TIMESTAMP)
WHERE "remainingAmount" = 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'PaymentStatus'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'PaymentStatus_new'
  ) THEN
    CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'CANCELLED');
    ALTER TABLE "payments"
      ALTER COLUMN "status" DROP DEFAULT,
      ALTER COLUMN "status" TYPE "PaymentStatus_new"
      USING (
        CASE
          WHEN "status"::text = 'COMPLETED' THEN 'PAID'::"PaymentStatus_new"
          WHEN "status"::text = 'FAILED' THEN 'CANCELLED'::"PaymentStatus_new"
          WHEN "status"::text = 'PAID' THEN 'PAID'::"PaymentStatus_new"
          WHEN "status"::text = 'PARTIALLY_REFUNDED' THEN 'PARTIALLY_REFUNDED'::"PaymentStatus_new"
          WHEN "status"::text = 'REFUNDED' THEN 'REFUNDED'::"PaymentStatus_new"
          WHEN "status"::text = 'CANCELLED' THEN 'CANCELLED'::"PaymentStatus_new"
          ELSE 'PENDING'::"PaymentStatus_new"
        END
      );
    DROP TYPE "PaymentStatus";
    ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
    ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'PENDING';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payments_createdBy_fkey'
  ) THEN
    ALTER TABLE "payments"
    ADD CONSTRAINT "payments_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payments_updatedBy_fkey'
  ) THEN
    ALTER TABLE "payments"
    ADD CONSTRAINT "payments_updatedBy_fkey"
    FOREIGN KEY ("updatedBy") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'DiscountType'
  ) THEN
    CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'DiscountApprovalStatus'
  ) THEN
    CREATE TYPE "DiscountApprovalStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "discounts" (
  "id" UUID NOT NULL,
  "orderId" UUID NOT NULL,
  "type" "DiscountType" NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "reason" TEXT NOT NULL,
  "approvalStatus" "DiscountApprovalStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
  "approvedBy" UUID,
  "createdBy" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "discounts_orderId_idx" ON "discounts"("orderId");
CREATE INDEX IF NOT EXISTS "discounts_approvalStatus_idx" ON "discounts"("approvalStatus");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'discounts_orderId_fkey'
  ) THEN
    ALTER TABLE "discounts"
    ADD CONSTRAINT "discounts_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'discounts_approvedBy_fkey'
  ) THEN
    ALTER TABLE "discounts"
    ADD CONSTRAINT "discounts_approvedBy_fkey"
    FOREIGN KEY ("approvedBy") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'discounts_createdBy_fkey'
  ) THEN
    ALTER TABLE "discounts"
    ADD CONSTRAINT "discounts_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
