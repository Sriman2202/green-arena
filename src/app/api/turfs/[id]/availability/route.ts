import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeAvailability, todayDateString } from "@/lib/slots";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const date = request.nextUrl.searchParams.get("date") ?? todayDateString();

  const turf = await prisma.turf.findUnique({ where: { id } });
  if (!turf || !turf.isActive) {
    return NextResponse.json({ error: "Turf not found" }, { status: 404 });
  }

  const bookings = await prisma.booking.findMany({
    where: { turfId: id, date, status: "CONFIRMED" },
    select: { startMinutes: true, endMinutes: true },
  });
  const blockedSlots = await prisma.blockedSlot.findMany({
    where: { turfId: id, date },
    select: { startMinutes: true, endMinutes: true },
  });

  const slots = computeAvailability(turf, date, bookings, blockedSlots);
  const unavailable = [...bookings, ...blockedSlots];

  return NextResponse.json({ date, slots, unavailable });
}
