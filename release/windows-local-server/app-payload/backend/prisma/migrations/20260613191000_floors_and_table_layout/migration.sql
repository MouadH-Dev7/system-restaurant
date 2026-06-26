CREATE TABLE "floors" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "restaurantId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "floors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "floors_restaurantId_name_key" ON "floors"("restaurantId", "name");
CREATE INDEX "floors_restaurantId_idx" ON "floors"("restaurantId");

ALTER TABLE "tables"
ADD COLUMN "floorId" UUID,
ADD COLUMN "posX" DOUBLE PRECISION,
ADD COLUMN "posY" DOUBLE PRECISION,
ADD COLUMN "shape" VARCHAR(16);

CREATE INDEX "tables_floorId_idx" ON "tables"("floorId");

ALTER TABLE "floors"
ADD CONSTRAINT "floors_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tables"
ADD CONSTRAINT "tables_floorId_fkey"
FOREIGN KEY ("floorId") REFERENCES "floors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
