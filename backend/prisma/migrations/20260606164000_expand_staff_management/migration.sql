ALTER TABLE "users"
ADD COLUMN "phone" TEXT,
ADD COLUMN "nationalId" TEXT,
ADD COLUMN "birthDate" TIMESTAMP(3),
ADD COLUMN "hireDate" TIMESTAMP(3),
ADD COLUMN "address" TEXT,
ADD COLUMN "staffCode" TEXT,
ADD COLUMN "pinCode" TEXT,
ADD COLUMN "salaryType" VARCHAR(16),
ADD COLUMN "salaryAmount" DOUBLE PRECISION,
ADD COLUMN "emergencyContactName" TEXT,
ADD COLUMN "emergencyContactPhone" TEXT,
ADD COLUMN "notes" TEXT,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "users_nationalId_key" ON "users"("nationalId");
CREATE UNIQUE INDEX "users_staffCode_key" ON "users"("staffCode");
