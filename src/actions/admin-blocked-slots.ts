"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { blockSlotSchema } from "@/lib/validations/blocked-slot";
import { todayDateString } from "@/lib/slots";

export interface BlockSlotFormState {
  error?: string;
}

function currentMinutesOfDay(now: Date = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
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

  const todayStr = todayDateString();
  if (date < todayStr) {
    return { error: "Cannot block a past date." };
  }
  if (date === todayStr && startMinutes < currentMinutesOfDay()) {
    return { error: "Cannot block a time that has already passed." };
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

  const overlappingBlocked = await prisma.blockedSlot.findFirst({
    where: {
      turfId,
      date,
      startMinutes: { lt: endMinutes },
      endMinutes: { gt: startMinutes },
    },
  });
  if (overlappingBlocked) {
    return { error: "This time range overlaps an already blocked slot." };
  }

  await prisma.blockedSlot.create({ data: { turfId, date, startMinutes, endMinutes, reason } });
  revalidatePath("/admin/bookings");
  return {};
}

export async function unblockSlots(ids: string[]): Promise<{ error?: string }> {
  const user = await requireAdmin();
  const blockedSlots = await prisma.blockedSlot.findMany({
    where: { id: { in: ids } },
    include: { turf: true },
  });
  if (blockedSlots.length !== ids.length) {
    return { error: "Not found." };
  }
  if (user.role === "ADMIN" && blockedSlots.some((slot) => slot.turf.ownerId !== user.id)) {
    return { error: "You don't have access to this turf." };
  }
  await prisma.blockedSlot.deleteMany({ where: { id: { in: ids } } });
  revalidatePath("/admin/bookings");
  return {};
}
