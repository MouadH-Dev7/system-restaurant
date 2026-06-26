ALTER TYPE "PaymentMethod" RENAME VALUE 'ONLINE' TO 'BANK_TRANSFER';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'MOBILE_PAYMENT';

ALTER TABLE "audit_logs"
ADD COLUMN "details" JSONB;

ALTER TABLE "restaurant_settings"
ADD COLUMN "contactEmail" TEXT,
ADD COLUMN "receiptLogoUrl" TEXT,
ADD COLUMN "receiptFooterMessage" TEXT;
