-- CreateEnum
CREATE TYPE "WaiterNotificationType" AS ENUM ('CALL_WAITER', 'ORDER_READY_FOR_DELIVERY');

-- CreateEnum
CREATE TYPE "WaiterNotificationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'RESOLVED');

-- AlterEnum
ALTER TYPE "AuditLogModule" ADD VALUE IF NOT EXISTS 'WAITER_NOTIFICATIONS';

-- CreateTable
CREATE TABLE "waiter_notifications" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "tableId" UUID NOT NULL,
    "orderId" UUID,
    "acceptedByUserId" UUID,
    "type" "WaiterNotificationType" NOT NULL,
    "status" "WaiterNotificationStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "waiter_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "waiter_notifications_restaurantId_status_createdAt_idx" ON "waiter_notifications"("restaurantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "waiter_notifications_tableId_status_idx" ON "waiter_notifications"("tableId", "status");

-- CreateIndex
CREATE INDEX "waiter_notifications_orderId_idx" ON "waiter_notifications"("orderId");

-- CreateIndex
CREATE INDEX "waiter_notifications_acceptedByUserId_idx" ON "waiter_notifications"("acceptedByUserId");

-- AddForeignKey
ALTER TABLE "waiter_notifications" ADD CONSTRAINT "waiter_notifications_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiter_notifications" ADD CONSTRAINT "waiter_notifications_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiter_notifications" ADD CONSTRAINT "waiter_notifications_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiter_notifications" ADD CONSTRAINT "waiter_notifications_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
