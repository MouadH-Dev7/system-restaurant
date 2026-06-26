ALTER TABLE "orders"
ADD COLUMN "parentOrderId" UUID,
ADD COLUMN "preparationStartedAt" TIMESTAMP(3),
ADD COLUMN "readyAt" TIMESTAMP(3),
ADD COLUMN "deliveredAt" TIMESTAMP(3);

CREATE INDEX "orders_parentOrderId_idx" ON "orders"("parentOrderId");

ALTER TABLE "orders"
ADD CONSTRAINT "orders_parentOrderId_fkey"
FOREIGN KEY ("parentOrderId") REFERENCES "orders"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
