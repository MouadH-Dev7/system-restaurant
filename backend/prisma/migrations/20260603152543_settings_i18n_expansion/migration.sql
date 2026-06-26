-- AlterTable
ALTER TABLE "restaurant_settings" ADD COLUMN     "dateFormat" TEXT NOT NULL DEFAULT 'dd/MM/yyyy',
ADD COLUMN     "direction" TEXT NOT NULL DEFAULT 'ltr',
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en-US';
