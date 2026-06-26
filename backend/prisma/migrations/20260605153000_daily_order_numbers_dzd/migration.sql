ALTER TABLE "orders"
ADD COLUMN "businessDate" DATE,
ADD COLUMN "dailyOrderNumber" INTEGER;

WITH ranked_orders AS (
  SELECT
    id,
    DATE("createdAt") AS business_date,
    ROW_NUMBER() OVER (
      PARTITION BY "restaurantId", DATE("createdAt")
      ORDER BY "createdAt" ASC, id ASC
    ) AS daily_number
  FROM "orders"
)
UPDATE "orders" AS orders
SET
  "businessDate" = ranked_orders.business_date,
  "dailyOrderNumber" = ranked_orders.daily_number
FROM ranked_orders
WHERE orders.id = ranked_orders.id;

ALTER TABLE "orders"
ALTER COLUMN "businessDate" SET NOT NULL,
ALTER COLUMN "dailyOrderNumber" SET NOT NULL;

CREATE UNIQUE INDEX "orders_restaurantId_businessDate_dailyOrderNumber_key"
ON "orders"("restaurantId", "businessDate", "dailyOrderNumber");
