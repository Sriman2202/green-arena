"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cancelBooking } from "@/actions/bookings";
import { CURRENCY_SYMBOL, formatBookingReference } from "@/lib/constants";

export function CancelBookingButton({
  bookingId,
  bookingNumber,
  turfName,
  dateLabel,
  timeLabel,
  price,
  disabled,
}: {
  bookingId: string;
  bookingNumber: number;
  turfName: string;
  dateLabel: string;
  timeLabel: string;
  price: number;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || isPending}
        onClick={() => setOpen(true)}
      >
        Cancel
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this booking?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Booking ID</dt>
            <dd className="text-right font-mono font-medium">
              {formatBookingReference(bookingNumber)}
            </dd>
            <dt className="text-muted-foreground">Turf</dt>
            <dd className="text-right font-medium">{turfName}</dd>
            <dt className="text-muted-foreground">Date</dt>
            <dd className="text-right font-medium">{dateLabel}</dd>
            <dt className="text-muted-foreground">Time</dt>
            <dd className="text-right font-medium">{timeLabel}</dd>
            <dt className="text-muted-foreground">Amount</dt>
            <dd className="text-right font-semibold">
              {CURRENCY_SYMBOL}
              {price}
            </dd>
          </dl>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Keep booking
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const result = await cancelBooking(bookingId);
                  if (result.error) {
                    toast.error(result.error);
                  } else {
                    toast.success("Booking cancelled.");
                    setOpen(false);
                  }
                });
              }}
            >
              {isPending ? "Cancelling..." : "Cancel booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
