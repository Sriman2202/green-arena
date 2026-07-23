"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { addDays, format, isSameDay } from "date-fns";
import Link from "next/link";
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
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";
import { createBooking, type BookingFormState } from "@/actions/bookings";
import { CURRENCY_SYMBOL, MAX_BOOKING_HOURS } from "@/lib/constants";
import { minutesToLabel, minutesToTimeValue, timeValueToMinutes } from "@/lib/slots";

interface SlotInfo {
  startMinutes: number;
  endMinutes: number;
  label: string;
  available: boolean;
}

interface SlotsForDate {
  date: string;
  slots: SlotInfo[];
}

interface ConfirmTarget {
  startMinutes: number;
  endMinutes: number;
}

const DAYS_AHEAD = 7;
const initialState: BookingFormState = {};

function hasConflict(slots: SlotInfo[], startMinutes: number, endMinutes: number): boolean {
  return slots.some(
    (slot) => !slot.available && startMinutes < slot.endMinutes && endMinutes > slot.startMinutes
  );
}

export function SlotPicker({
  turfId,
  turfName,
  pricePerHour,
  openTimeMinutes,
  closeTimeMinutes,
  slotDurationMinutes,
  isAuthenticated,
  loginUrl,
  contactNumber,
}: {
  turfId: string;
  turfName: string;
  pricePerHour: number;
  openTimeMinutes: number;
  closeTimeMinutes: number;
  slotDurationMinutes: number;
  isAuthenticated: boolean;
  loginUrl: string;
  contactNumber?: string | null;
}) {
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: DAYS_AHEAD }, (_, index) => addDays(today, index));
  }, []);

  const [date, setDate] = useState<Date>(days[0]);
  const [slotsForDate, setSlotsForDate] = useState<SlotsForDate | null>(null);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [rangeDefaultsKey, setRangeDefaultsKey] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createBooking, initialState);

  const dateStr = format(date, "yyyy-MM-dd");
  const isToday = isSameDay(date, new Date());
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  // Derived (not stored) so we never need to setState synchronously in the effect below.
  const loadingSlots = slotsForDate?.date !== dateStr;
  const slots = loadingSlots ? [] : slotsForDate.slots;

  if (dateStr !== rangeDefaultsKey) {
    const start = isToday ? Math.max(openTimeMinutes, nowMinutes) : openTimeMinutes;
    const end = Math.min(start + slotDurationMinutes, closeTimeMinutes);
    setRangeDefaultsKey(dateStr);
    setRangeStart(minutesToTimeValue(start));
    setRangeEnd(minutesToTimeValue(Math.max(end, start)));
  }

  const liveStart = timeValueToMinutes(rangeStart);
  const liveEnd = timeValueToMinutes(rangeEnd);
  const livePrice =
    liveStart != null && liveEnd != null && liveEnd > liveStart
      ? pricePerHour * ((liveEnd - liveStart) / 60)
      : null;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/turfs/${turfId}/availability?date=${dateStr}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSlotsForDate({ date: dateStr, slots: data.slots ?? [] });
      });
    return () => {
      cancelled = true;
    };
  }, [turfId, dateStr]);

  function handleBookClick() {
    const startMinutes = timeValueToMinutes(rangeStart);
    const endMinutes = timeValueToMinutes(rangeEnd);
    if (startMinutes == null || endMinutes == null) {
      toast.error("Enter a valid start and end time.");
      return;
    }
    if (endMinutes <= startMinutes) {
      toast.error("End time must be after start time.");
      return;
    }
    if ((endMinutes - startMinutes) % slotDurationMinutes !== 0) {
      toast.error(`Duration must be a multiple of ${slotDurationMinutes} minutes.`);
      return;
    }
    if (endMinutes - startMinutes > MAX_BOOKING_HOURS * 60) {
      toast.error(`You can book at most ${MAX_BOOKING_HOURS} hours at a time.`);
      return;
    }
    if (startMinutes < openTimeMinutes || endMinutes > closeTimeMinutes) {
      toast.error("Selected time is outside turf hours.");
      return;
    }
    if (isToday && startMinutes < nowMinutes) {
      toast.error("This time has already passed.");
      return;
    }
    if (!loadingSlots && hasConflict(slots, startMinutes, endMinutes)) {
      toast.error("This time overlaps an unavailable slot. Please choose another.");
      return;
    }
    setConfirmTarget({ startMinutes, endMinutes });
    setConfirmOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h3 className="font-heading text-lg font-semibold">Select date</h3>
        <div className="mt-3 flex gap-2 overflow-x-auto sm:grid sm:grid-cols-7">
          {days.map((day) => {
            const active = isSameDay(day, date);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setDate(day)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2.5 text-center transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-foreground hover:border-primary/50 hover:bg-muted"
                )}
              >
                <span
                  className={cn(
                    "text-[10.5px] font-semibold",
                    active ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}
                >
                  {format(day, "EEE")}
                </span>
                <span className="text-[15px] font-bold">{format(day, "d")}</span>
              </button>
            );
          })}
        </div>

        <h3 className="mb-3 mt-5 font-heading text-lg font-semibold">Select time</h3>
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="slot-start" className="text-xs font-medium text-muted-foreground">
              Start time
            </label>
            <TimePicker id="slot-start" value={rangeStart} onChange={setRangeStart} className="h-10" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="slot-end" className="text-xs font-medium text-muted-foreground">
              End time
            </label>
            <TimePicker id="slot-end" value={rangeEnd} onChange={setRangeEnd} className="h-10" />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Turf hours: {minutesToLabel(openTimeMinutes)} – {minutesToLabel(closeTimeMinutes)} · Max{" "}
          {MAX_BOOKING_HOURS} hours per booking
        </p>

        <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total · Pay at venue</p>
            <p className="font-heading text-xl font-bold">
              {livePrice != null ? `${CURRENCY_SYMBOL}${livePrice}` : "—"}
            </p>
          </div>

          {isAuthenticated ? (
            <Button
              type="button"
              disabled={livePrice == null}
              onClick={handleBookClick}
              className="w-full sm:w-auto sm:min-w-48"
            >
              Book Slot
            </Button>
          ) : (
            <Button render={<Link href={loginUrl} />} className="w-full sm:w-auto sm:min-w-48">
              Log in to book
            </Button>
          )}
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm your booking</DialogTitle>
            <DialogDescription>Review the details below before confirming.</DialogDescription>
          </DialogHeader>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Turf</dt>
            <dd className="text-right font-medium">{turfName}</dd>
            {contactNumber && (
              <>
                <dt className="text-muted-foreground">Contact</dt>
                <dd className="text-right font-medium">{contactNumber}</dd>
              </>
            )}
            <dt className="text-muted-foreground">Date</dt>
            <dd className="text-right font-medium">{format(date, "EEEE, MMMM d, yyyy")}</dd>
            <dt className="text-muted-foreground">Time</dt>
            <dd className="text-right font-medium">
              {confirmTarget
                ? `${minutesToLabel(confirmTarget.startMinutes)} – ${minutesToLabel(confirmTarget.endMinutes)}`
                : ""}
            </dd>
            <dt className="text-muted-foreground">Payment</dt>
            <dd className="text-right font-medium">Pay at venue</dd>
            <dt className="text-muted-foreground">Total</dt>
            <dd className="text-right font-semibold">
              {CURRENCY_SYMBOL}
              {confirmTarget ? pricePerHour * ((confirmTarget.endMinutes - confirmTarget.startMinutes) / 60) : 0}
            </dd>
          </dl>

          {state.error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {state.error}
            </p>
          )}

          <form action={formAction}>
            <input type="hidden" name="turfId" value={turfId} />
            <input type="hidden" name="date" value={dateStr} />
            <input type="hidden" name="startMinutes" value={confirmTarget?.startMinutes ?? ""} />
            <input type="hidden" name="endMinutes" value={confirmTarget?.endMinutes ?? ""} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Booking..." : "Confirm"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
