ALTER TABLE "menus"
ADD COLUMN "nameEn" TEXT,
ADD COLUMN "nameFr" TEXT,
ADD COLUMN "nameAr" TEXT,
ADD COLUMN "descriptionEn" TEXT,
ADD COLUMN "descriptionFr" TEXT,
ADD COLUMN "descriptionAr" TEXT,
ADD COLUMN "heroImage" TEXT,
ADD COLUMN "themeKey" VARCHAR(64);

ALTER TABLE "menu_items"
ADD COLUMN "nameEn" TEXT,
ADD COLUMN "nameFr" TEXT,
ADD COLUMN "nameAr" TEXT,
ADD COLUMN "descriptionEn" TEXT,
ADD COLUMN "descriptionFr" TEXT,
ADD COLUMN "descriptionAr" TEXT,
ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "badge" TEXT,
ADD COLUMN "badgeEn" TEXT,
ADD COLUMN "badgeFr" TEXT,
ADD COLUMN "badgeAr" TEXT,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "modifier_groups" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "nameFr" TEXT,
    "nameAr" TEXT,
    "description" TEXT,
    "descriptionEn" TEXT,
    "descriptionFr" TEXT,
    "descriptionAr" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "minSelections" INTEGER NOT NULL DEFAULT 0,
    "maxSelections" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "restaurantId" UUID NOT NULL,
    "menuItemId" UUID NOT NULL,

    CONSTRAINT "modifier_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "modifier_options" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "nameFr" TEXT,
    "nameAr" TEXT,
    "description" TEXT,
    "descriptionEn" TEXT,
    "descriptionFr" TEXT,
    "descriptionAr" TEXT,
    "priceDelta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "groupId" UUID NOT NULL,

    CONSTRAINT "modifier_options_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_item_modifiers" (
    "id" UUID NOT NULL,
    "orderItemId" UUID NOT NULL,
    "modifierOptionId" UUID,
    "groupName" TEXT NOT NULL,
    "groupNameEn" TEXT,
    "groupNameFr" TEXT,
    "groupNameAr" TEXT,
    "optionName" TEXT NOT NULL,
    "optionNameEn" TEXT,
    "optionNameFr" TEXT,
    "optionNameAr" TEXT,
    "priceDelta" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "order_item_modifiers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "modifier_groups_restaurantId_idx" ON "modifier_groups"("restaurantId");
CREATE INDEX "modifier_groups_menuItemId_idx" ON "modifier_groups"("menuItemId");
CREATE INDEX "modifier_options_groupId_idx" ON "modifier_options"("groupId");
CREATE INDEX "order_item_modifiers_orderItemId_idx" ON "order_item_modifiers"("orderItemId");
CREATE INDEX "order_item_modifiers_modifierOptionId_idx" ON "order_item_modifiers"("modifierOptionId");

ALTER TABLE "modifier_groups"
ADD CONSTRAINT "modifier_groups_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "modifier_groups"
ADD CONSTRAINT "modifier_groups_menuItemId_fkey"
FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "modifier_options"
ADD CONSTRAINT "modifier_options_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "modifier_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_item_modifiers"
ADD CONSTRAINT "order_item_modifiers_orderItemId_fkey"
FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_item_modifiers"
ADD CONSTRAINT "order_item_modifiers_modifierOptionId_fkey"
FOREIGN KEY ("modifierOptionId") REFERENCES "modifier_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;
