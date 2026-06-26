-- Add OrderType enum and persisted orderType column to orders.
CREATE TYPE "OrderType" AS ENUM ('DINE_IN', 'TAKEAWAY', 'DELIVERY');

ALTER TABLE "orders"
ADD COLUMN "orderType" "OrderType";

UPDATE "orders" AS o
SET "orderType" = CASE
  WHEN t."number" = 99 OR o."tableId" = 'c9999999-9999-4999-8999-999999999999' THEN 'TAKEAWAY'::"OrderType"
  ELSE 'DINE_IN'::"OrderType"
END
FROM "tables" AS t
WHERE o."tableId" = t."id";

UPDATE "orders"
SET "orderType" = 'DINE_IN'::"OrderType"
WHERE "orderType" IS NULL;

ALTER TABLE "orders"
ALTER COLUMN "orderType" SET NOT NULL,
ALTER COLUMN "orderType" SET DEFAULT 'DINE_IN';
