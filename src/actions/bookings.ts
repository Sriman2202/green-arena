"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createBookingSchema } from "@/lib/validations/booking";
import { slotStartDate } from "@/lib/slots";
import { SlotUnavailableError } from "@/lib/errors";
import { CANCELLATION_CUTOFF_HOURS, MAX_BOOKING_HOURS } from "@/lib/constants";

export interface BookingFormState {
  error?: string;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

export async function createBooking(
  _prevState: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const user = await requireUser();

  const parsed = createBookingSchema.safeParse({
    turfId: formData.get("turfId"),
    date: formData.get("date"),
    startMinutes: formData.get("startMinutes"),
    endMinutes: formData.get("endMinutes"),
  });
  if (!parsed.success) {
    return { error: "Invalid booking request." };
  }
  const { turfId, date, startMinutes, endMinutes } = parsed.data;

  const turf = await prisma.turf.findUnique({ where: { id: turfId } });
  if (!turf || !turf.isActive) {
    return { error: "This turf is not available." };
  }

  if (endMinutes <= startMinutes) {
    return { error: "Invalid time range." };
  }
  if (endMinutes - startMinutes > MAX_BOOKING_HOURS * 60) {
    return { error: `You can book at most ${MAX_BOOKING_HOURS} hours at a time.` };
  }
  if ((endMinutes - startMinutes) % turf.slotDurationMinutes !== 0) {
    return { error: "Invalid time range." };
  }
  if (startMinutes < turf.openTimeMinutes || endMinutes > turf.closeTimeMinutes) {
    return { error: "Invalid time slot." };
  }
  if (slotStartDate(date, startMinutes) <= new Date()) {
    return { error: "This slot has already passed." };
  }

  const pricePaid = Number(turf.pricePerHour) * ((endMinutes - startMinutes) / 60);
  const platformCommission = pricePaid * (Number(turf.commissionPercent) / 100);

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.booking.findFirst({
        where: {
          turfId,
          date,
          status: "CONFIRMED",
          startMinutes: { lt: endMinutes },
          endMinutes: { gt: startMinutes },
        },
      });
      if (existing) {
        throw new SlotUnavailableError();
      }
      const blocked = await tx.blockedSlot.findFirst({
        where: {
          turfId,
          date,
          startMinutes: { lt: endMinutes },
          endMinutes: { gt: startMinutes },
        },
      });
      if (blocked) {
        throw new SlotUnavailableError();
      }
      await tx.booking.create({
        data: {
          turfId,
          userId: user.id,
          date,
          startMinutes,
          endMinutes,
          pricePaid,
          platformCommission,
        },
      });
    });
  } catch (error) {
    if (error instanceof SlotUnavailableError || isUniqueConstraintError(error)) {
      return { error: "Sorry, this slot was just booked. Please choose another." };
    }
    throw error;
  }

  revalidatePath(`/turfs/${turfId}`);
  redirect("/bookings");
}

export async function cancelBooking(bookingId: string): Promise<{ error?: string }> {
  const user = await requireUser();

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.userId !== user.id) {
    return { error: "Booking not found." };
  }
  if (booking.status !== "CONFIRMED") {
    return { error: "This booking can no longer be cancelled." };
  }

  const slotStart = slotStartDate(booking.date, booking.startMinutes);
  const cutoff = new Date(Date.now() + CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000);
  if (slotStart <= cutoff) {
    return {
      error: `Bookings can only be cancelled at least ${CANCELLATION_CUTOFF_HOURS} hours before the slot starts.`,
    };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  revalidatePath("/bookings");
  return {};
}
