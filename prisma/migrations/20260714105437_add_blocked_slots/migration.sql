-- CreateTable
CREATE TABLE "BlockedSlot" (
    "id" TEXT NOT NULL,
    "turfId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startMinutes" INTEGER NOT NULL,
    "endMinutes" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlockedSlot_turfId_date_idx" ON "BlockedSlot"("turfId", "date");

-- AddForeignKey
ALTER TABLE "BlockedSlot" ADD CONSTRAINT "BlockedSlot_turfId_fkey" FOREIGN KEY ("turfId") REFERENCES "Turf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
