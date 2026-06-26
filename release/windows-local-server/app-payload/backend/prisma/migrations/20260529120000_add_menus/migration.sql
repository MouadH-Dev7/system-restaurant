-- CreateTable
CREATE TABLE "menus" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "restaurantId" UUID NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "menus_restaurantId_idx" ON "menus"("restaurantId");

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Default menu for existing items
INSERT INTO "menus" ("id", "name", "description", "sortOrder", "active", "restaurantId")
SELECT
    gen_random_uuid(),
    'المنيو الرئيسي',
    'جميع الأصناف',
    0,
    true,
    "restaurantId"
FROM "menu_items"
GROUP BY "restaurantId";

-- Add menuId column (nullable first)
ALTER TABLE "menu_items" ADD COLUMN "menuId" UUID;

-- Link existing items to their restaurant default menu
UPDATE "menu_items" AS mi
SET "menuId" = m."id"
FROM "menus" AS m
WHERE mi."restaurantId" = m."restaurantId"
  AND m."name" = 'المنيو الرئيسي';

ALTER TABLE "menu_items" ALTER COLUMN "menuId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "menu_items_menuId_idx" ON "menu_items"("menuId");

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
