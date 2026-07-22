import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookingStatusSelect } from "@/components/admin/booking-status-select";
import { BlockSlotForm } from "@/components/admin/block-slot-form";
import { UnblockSlotButton } from "@/components/admin/unblock-slot-button";
import { minutesToLabel } from "@/lib/slots";
import { CURRENCY_SYMBOL, formatBookingReference } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { BookingStatus, Prisma } from "@/generated/prisma/client";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; status?: string }>;
}) {
  const { date, status } = await searchParams;
  const user = await requireAdmin();
  if (user.role !== "ADMIN") redirect("/admin");

  const turfs = await prisma.turf.findMany({
    where: { ownerId: user.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      openTimeMinutes: true,
      closeTimeMinutes: true,
      slotDurationMinutes: true,
    },
  });

  const where: Prisma.BookingWhereInput = {
    ...(date ? { date } : {}),
    ...(status ? { status: status as BookingStatus } : {}),
    turf: { ownerId: user.id },
  };

  const bookings = await prisma.booking.findMany({
    where,
    include: { turf: true, user: true },
    orderBy: [{ date: "desc" }, { startMinutes: "desc" }],
    take: 200,
  });

  const blockedSlotsWhere: Prisma.BlockedSlotWhereInput = {
    ...(date ? { date } : {}),
    turf: { ownerId: user.id },
  };

  const blockedSlots = await prisma.blockedSlot.findMany({
    where: blockedSlotsWhere,
    include: { turf: true },
    orderBy: [{ date: "desc" }, { startMinutes: "desc" }],
    take: 200,
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Bookings</h2>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="date" className="text-xs font-medium text-muted-foreground">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={date ?? ""}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-xs font-medium text-muted-foreground">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">All statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <Button type="submit" size="sm">
          Apply
        </Button>
        {(date || status) && (
          <Button variant="ghost" size="sm" render={<Link href="/admin/bookings" />}>
            Clear
          </Button>
        )}
      </form>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking ID</TableHead>
              <TableHead>Turf</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-mono text-xs">
                  {formatBookingReference(booking.bookingNumber)}
                </TableCell>
                <TableCell className="font-medium">{booking.turf.name}</TableCell>
                <TableCell>
                  <div>{booking.user.name}</div>
                  <div className="text-xs text-muted-foreground">{booking.user.email}</div>
                </TableCell>
                <TableCell>{booking.date}</TableCell>
                <TableCell>
                  {minutesToLabel(booking.startMinutes)} – {minutesToLabel(booking.endMinutes)}
                </TableCell>
                <TableCell>
                  {CURRENCY_SYMBOL}
                  {Number(booking.pricePaid)}
                </TableCell>
                <TableCell>
                  <BookingStatusSelect bookingId={booking.id} status={booking.status} />
                </TableCell>
              </TableRow>
            ))}
            {bookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No bookings match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <h2 className="text-xl font-semibold">Blocked slots</h2>

      <BlockSlotForm turfs={turfs} />

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Turf</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blockedSlots.map((slot) => (
              <TableRow key={slot.id}>
                <TableCell className="font-medium">{slot.turf.name}</TableCell>
                <TableCell>{slot.date}</TableCell>
                <TableCell>
                  {minutesToLabel(slot.startMinutes)} – {minutesToLabel(slot.endMinutes)}
                </TableCell>
                <TableCell>{slot.reason ?? "—"}</TableCell>
                <TableCell>
                  <UnblockSlotButton id={slot.id} />
                </TableCell>
              </TableRow>
            ))}
            {blockedSlots.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No blocked slots match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
