-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "Turf" ADD COLUMN     "ownerId" TEXT;

-- CreateIndex
CREATE INDEX "Turf_ownerId_idx" ON "Turf"("ownerId");

-- AddForeignKey
ALTER TABLE "Turf" ADD CONSTRAINT "Turf_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
