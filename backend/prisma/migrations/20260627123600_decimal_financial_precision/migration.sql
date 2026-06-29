-- AlterTable
ALTER TABLE "customer_profiles" ALTER COLUMN "totalSpent" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "discounts" ALTER COLUMN "value" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "inventory_items" ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "menu_items" ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "modifier_options" ALTER COLUMN "priceDelta" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "order_item_modifiers" ALTER COLUMN "priceDelta" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "order_items" ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "total" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "refundedAmount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "remainingAmount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "restaurant_settings" ALTER COLUMN "salesTax" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "maxAutoDiscountPercent" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "refundAlertThreshold" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "salaryAmount" SET DATA TYPE DECIMAL(12,2);
