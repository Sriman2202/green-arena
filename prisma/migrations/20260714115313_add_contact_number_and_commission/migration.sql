-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "platformCommission" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Turf" ADD COLUMN     "commissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 10,
ADD COLUMN     "contactNumber" TEXT;
