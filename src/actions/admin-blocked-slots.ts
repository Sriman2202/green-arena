"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { blockSlotSchema } from "@/lib/validations/blocked-slot";

export interface BlockSlotFormState {
  error?: string;
}

export async function blockSlot(
  _prevState: BlockSlotFormState,
  formData: FormData
): Promise<BlockSlotFormState> {
  const user = await requireAdmin();

  const parsed = blockSlotSchema.safeParse({
    turfId: formData.get("turfId"),
    date: formData.get("date"),
    startMinutes: formData.get("startMinutes"),
    endMinutes: formData.get("endMinutes"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) {
    return { error: "Invalid block request." };
  }
  const { turfId, date, startMinutes, endMinutes, reason } = parsed.data;
  if (endMinutes <= startMinutes) {
    return { error: "End time must be after start time." };
  }

  const turf = await prisma.turf.findUnique({ where: { id: turfId } });
  if (!turf) {
    return { error: "Turf not found." };
  }
  if (user.role === "ADMIN" && turf.ownerId !== user.id) {
    return { error: "You don't have access to this turf." };
  }
  if (startMinutes < turf.openTimeMinutes || endMinutes > turf.closeTimeMinutes) {
    return { error: "Time range is outside turf hours." };
  }

  const overlappingBooking = await prisma.booking.findFirst({
    where: {
      turfId,
      date,
      status: "CONFIRMED",
      startMinutes: { lt: endMinutes },
      endMinutes: { gt: startMinutes },
    },
  });
  if (overlappingBooking) {
    return { error: "This time range has an existing booking." };
  }

  await prisma.blockedSlot.create({ data: { turfId, date, startMinutes, endMinutes, reason } });
  revalidatePath("/admin/bookings");
  return {};
}

export async function unblockSlot(id: string): Promise<{ error?: string }> {
  const user = await requireAdmin();
  const blockedSlot = await prisma.blockedSlot.findUnique({ where: { id }, include: { turf: true } });
  if (!blockedSlot) {
    return { error: "Not found." };
  }
  if (user.role === "ADMIN" && blockedSlot.turf.ownerId !== user.id) {
    return { error: "You don't have access to this turf." };
  }
  await prisma.blockedSlot.delete({ where: { id } });
  revalidatePath("/admin/bookings");
  return {};
}
