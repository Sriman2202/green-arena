"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { BookingStatus } from "@/generated/prisma/client";

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus
): Promise<{ error?: string }> {
  const user = await requireAdmin();

  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { turf: true } });
  if (!booking) {
    return { error: "Booking not found." };
  }
  if (user.role === "ADMIN" && booking.turf.ownerId !== user.id) {
    return { error: "You don't have access to this booking." };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status,
      ...(status === "CANCELLED" ? { cancelledAt: new Date() } : {}),
    },
  });

  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  return {};
}
