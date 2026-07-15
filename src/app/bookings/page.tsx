import Link from "next/link";
import { format } from "date-fns";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slotStartDate, minutesToLabel } from "@/lib/slots";
import { CANCELLATION_CUTOFF_HOURS, CURRENCY_SYMBOL, formatBookingReference } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { CancelBookingButton } from "@/components/bookings/cancel-booking-button";
import type { Booking, Turf } from "@/generated/prisma/client";

type BookingWithTurf = Booking & { turf: Turf };

function BookingRow({ booking, now }: { booking: BookingWithTurf; now: Date }) {
  const start = slotStartDate(booking.date, booking.startMinutes);
  const cutoff = new Date(now.getTime() + CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000);
  const canCancel = booking.status === "CONFIRMED" && start > cutoff;
  const isUpcoming = booking.status === "CONFIRMED" && start > now;

  const badgeVariant =
    booking.status === "CONFIRMED"
      ? "default"
      : booking.status === "CANCELLED"
        ? "destructive"
        : "secondary";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">{booking.turf.name}</p>
        <p className="text-sm text-muted-foreground">
          {booking.date} · {minutesToLabel(booking.startMinutes)} –{" "}
          {minutesToLabel(booking.endMinutes)}
        </p>
        <p className="text-sm text-muted-foreground">
          {CURRENCY_SYMBOL}
          {Number(booking.pricePaid)} · Pay at venue
        </p>
        {booking.turf.contactNumber && (
          <p className="text-sm text-muted-foreground">Turf contact: {booking.turf.contactNumber}</p>
        )}
        <p className="mt-1 font-mono text-xs text-muted-foreground/70">
          Booking ID: {formatBookingReference(booking.bookingNumber)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={badgeVariant}>{booking.status}</Badge>
        {isUpcoming && (
          <CancelBookingButton
            bookingId={booking.id}
            bookingNumber={booking.bookingNumber}
            turfName={booking.turf.name}
            dateLabel={format(start, "EEEE, MMMM d, yyyy")}
            timeLabel={`${minutesToLabel(booking.startMinutes)} – ${minutesToLabel(booking.endMinutes)}`}
            price={Number(booking.pricePaid)}
            disabled={!canCancel}
          />
        )}
      </div>
    </div>
  );
}

export default async function BookingsPage() {
  const user = await requireUser();

  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    include: { turf: true },
    orderBy: [{ date: "desc" }, { startMinutes: "desc" }],
  });

  const now = new Date();
  const upcoming = bookings.filter(
    (booking) => booking.status === "CONFIRMED" && slotStartDate(booking.date, booking.startMinutes) > now
  );
  const history = bookings.filter((booking) => !upcoming.includes(booking));

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-8 sm:px-6">
      <h1 className="font-heading text-3xl font-bold">My Bookings</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming bookings.{" "}
            <Link href="/turfs" className="font-medium text-primary hover:underline">
              Find a turf
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((booking) => (
              <BookingRow key={booking.id} booking={booking} now={now} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Past &amp; cancelled</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing here yet.</p>
        ) : (
          <div className="space-y-3">
            {history.map((booking) => (
              <BookingRow key={booking.id} booking={booking} now={now} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
