"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateBookingStatus } from "@/actions/admin-bookings";
import type { BookingStatus } from "@/generated/prisma/client";

const STATUSES: BookingStatus[] = ["CONFIRMED", "COMPLETED", "CANCELLED"];

export function BookingStatusSelect({
  bookingId,
  status,
}: {
  bookingId: string;
  status: BookingStatus;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      className="h-8 rounded-lg border border-input bg-background px-2 text-sm disabled:opacity-50"
      defaultValue={status}
      disabled={isPending}
      onChange={(event) => {
        const next = event.target.value as BookingStatus;
        startTransition(async () => {
          const result = await updateBookingStatus(bookingId, next);
          if (result.error) {
            toast.error(result.error);
          } else {
            toast.success("Booking status updated.");
          }
        });
      }}
    >
      {STATUSES.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
