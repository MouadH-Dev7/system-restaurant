ALTER TABLE "restaurant_settings" ADD COLUMN IF NOT EXISTS "kitchenPrintingEnabled" BOOLEAN NOT NULL DEFAULT true;
