-- CreateSequence
CREATE SEQUENCE "Booking_bookingNumber_seq" AS INTEGER START WITH 1 INCREMENT BY 1;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "bookingNumber" INTEGER NOT NULL DEFAULT nextval('"Booking_bookingNumber_seq"');

-- AddOwnership
ALTER SEQUENCE "Booking_bookingNumber_seq" OWNED BY "Booking"."bookingNumber";

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingNumber_key" ON "Booking"("bookingNumber");
