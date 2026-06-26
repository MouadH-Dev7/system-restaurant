-- AlterTable
ALTER TABLE "orders" ADD COLUMN "guestSessionId" TEXT;

-- CreateIndex
CREATE INDEX "orders_guestSessionId_idx" ON "orders"("guestSessionId");

CREATE INDEX "orders_restaurantId_tableId_idx" ON "orders"("restaurantId", "tableId");
