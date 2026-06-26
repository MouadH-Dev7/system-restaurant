-- Allow external/takeaway orders to exist without a linked table.
ALTER TABLE "orders"
ALTER COLUMN "tableId" DROP NOT NULL;
