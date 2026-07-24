"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { addDays, format, isSameDay } from "date-fns";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
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
import { BOOKING_STEP_MINUTES, CURRENCY_SYMBOL, MIN_BOOKING_MINUTES } from "@/lib/constants";
import { minutesToLabel, minutesToTimeValue, timeValueToMinutes } from "@/lib/slots";

interface MinuteRange {
  startMinutes: number;
  endMinutes: number;
}

interface UnavailableForDate {
  date: string;
  ranges: MinuteRange[];
}

interface ConfirmTarget {
  startMinutes: number;
  endMinutes: number;
}

const DAYS_AHEAD = 7;
const initialState: BookingFormState = {};

function hasConflict(ranges: MinuteRange[], startMinutes: number, endMinutes: number): boolean {
  return ranges.some((r) => startMinutes < r.endMinutes && endMinutes > r.startMinutes);
}

function formatDuration(minutes: number): string {
  const hours = minutes / 60;
  const label = Number.isInteger(hours) ? `${hours}` : hours.toFixed(1);
  return `${label} hr${hours === 1 ? "" : "s"}`;
}

function computeDurationOptions(
  startMinutes: number,
  closeTimeMinutes: number,
  unavailable: MinuteRange[]
): number[] {
  const options: number[] = [];
  for (
    let duration = MIN_BOOKING_MINUTES;
    startMinutes + duration <= closeTimeMinutes;
    duration += BOOKING_STEP_MINUTES
  ) {
    if (hasConflict(unavailable, startMinutes, startMinutes + duration)) break;
    options.push(duration);
  }
  return options;
}

export function SlotPicker({
  turfId,
  turfName,
  pricePerHour,
  openTimeMinutes,
  closeTimeMinutes,
  isAuthenticated,
  loginUrl,
  contactNumber,
}: {
  turfId: string;
  turfName: string;
  pricePerHour: number;
  openTimeMinutes: number;
  closeTimeMinutes: number;
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
  const [unavailableForDate, setUnavailableForDate] = useState<UnavailableForDate | null>(null);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeStartDefaultsKey, setRangeStartDefaultsKey] = useState("");
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [durationResetKey, setDurationResetKey] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createBooking, initialState);

  const dateStr = format(date, "yyyy-MM-dd");
  const isToday = isSameDay(date, new Date());
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  // Derived (not stored) so we never need to setState synchronously in the effect below.
  const loadingSlots = unavailableForDate?.date !== dateStr;
  const unavailable = loadingSlots ? [] : unavailableForDate.ranges;

  if (dateStr !== rangeStartDefaultsKey) {
    const start = isToday ? Math.max(openTimeMinutes, nowMinutes) : openTimeMinutes;
    setRangeStartDefaultsKey(dateStr);
    setRangeStart(minutesToTimeValue(start));
  }

  const startMinutes = timeValueToMinutes(rangeStart);
  const durationOptions =
    startMinutes != null && !loadingSlots
      ? computeDurationOptions(startMinutes, closeTimeMinutes, unavailable)
      : [];

  const durationKey = `${dateStr}|${rangeStart}`;
  if (durationKey !== durationResetKey) {
    setDurationResetKey(durationKey);
    setSelectedDuration(null);
  } else if (selectedDuration == null && durationOptions.length > 0) {
    setSelectedDuration(durationOptions[0]);
  }

  const durationIndex = selectedDuration != null ? durationOptions.indexOf(selectedDuration) : -1;
  const canDecreaseDuration = durationIndex > 0;
  const canIncreaseDuration = durationIndex !== -1 && durationIndex < durationOptions.length - 1;

  const livePrice =
    selectedDuration != null ? pricePerHour * (selectedDuration / 60) : null;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/turfs/${turfId}/availability?date=${dateStr}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setUnavailableForDate({ date: dateStr, ranges: data.unavailable ?? [] });
      });
    return () => {
      cancelled = true;
    };
  }, [turfId, dateStr]);

  function decreaseDuration() {
    if (durationIndex > 0) setSelectedDuration(durationOptions[durationIndex - 1]);
  }

  function increaseDuration() {
    if (durationIndex !== -1 && durationIndex < durationOptions.length - 1) {
      setSelectedDuration(durationOptions[durationIndex + 1]);
    }
  }

  function handleBookClick() {
    if (startMinutes == null) {
      toast.error("Enter a valid start time.");
      return;
    }
    if (selectedDuration == null) {
      toast.error("Select a duration.");
      return;
    }
    const endMinutes = startMinutes + selectedDuration;
    if (startMinutes < openTimeMinutes || endMinutes > closeTimeMinutes) {
      toast.error("Selected time is outside turf hours.");
      return;
    }
    if (isToday && startMinutes < nowMinutes) {
      toast.error("This time has already passed.");
      return;
    }
    if (!loadingSlots && hasConflict(unavailable, startMinutes, endMinutes)) {
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
        <div className="flex flex-col gap-1.5">
          <label htmlFor="slot-start" className="text-xs font-medium text-muted-foreground">
            Start time
          </label>
          <TimePicker
            id="slot-start"
            value={rangeStart}
            onChange={setRangeStart}
            className="h-10 w-32"
            minMinutes={isToday ? nowMinutes : undefined}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Turf hours: {minutesToLabel(openTimeMinutes)} – {minutesToLabel(closeTimeMinutes)}
        </p>

        <h3 className="mb-3 mt-5 font-heading text-lg font-semibold">Duration</h3>
        {startMinutes == null ? (
          <p className="text-sm text-muted-foreground">Enter a start time to see durations.</p>
        ) : loadingSlots ? (
          <p className="text-sm text-muted-foreground">Loading availability...</p>
        ) : durationOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No available duration from this start time.</p>
        ) : (
          <div className="flex items-center gap-4">
            <button
              type="button"
              disabled={!canDecreaseDuration}
              onClick={decreaseDuration}
              aria-label="Decrease duration"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-16 text-center text-sm font-semibold">
              {selectedDuration != null ? formatDuration(selectedDuration) : "—"}
            </span>
            <button
              type="button"
              disabled={!canIncreaseDuration}
              onClick={increaseDuration}
              aria-label="Increase duration"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}

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
