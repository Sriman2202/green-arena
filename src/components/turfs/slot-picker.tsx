"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { addDays, format, isSameDay } from "date-fns";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { createBooking, type BookingFormState } from "@/actions/bookings";
import { CURRENCY_SYMBOL, MAX_BOOKING_HOURS } from "@/lib/constants";
import { minutesToLabel } from "@/lib/slots";

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

const DAYS_AHEAD = 7;
const initialState: BookingFormState = {};

export function SlotPicker({
  turfId,
  turfName,
  pricePerHour,
  slotDurationMinutes,
  isAuthenticated,
  loginUrl,
  contactNumber,
}: {
  turfId: string;
  turfName: string;
  pricePerHour: number;
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
  const [selectedStart, setSelectedStart] = useState<number | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createBooking, initialState);

  const dateStr = format(date, "yyyy-MM-dd");

  // Derived (not stored) so we never need to setState synchronously in the effect below.
  const loadingSlots = slotsForDate?.date !== dateStr;
  const slots = loadingSlots ? [] : slotsForDate.slots;

  const startIndex = slots.findIndex((slot) => slot.startMinutes === selectedStart);
  const endOptions = useMemo(() => {
    if (startIndex === -1) return [];
    const options: { endMinutes: number; hours: number }[] = [];
    for (let idx = startIndex; idx < slots.length; idx++) {
      const slot = slots[idx];
      if (!slot.available) break;
      if (idx > startIndex && slot.startMinutes !== slots[idx - 1].endMinutes) break;
      const duration = slot.endMinutes - (selectedStart as number);
      if (duration > MAX_BOOKING_HOURS * 60) break;
      options.push({ endMinutes: slot.endMinutes, hours: duration / 60 });
    }
    return options;
  }, [slots, startIndex, selectedStart]);

  const selectionValid =
    selectedStart != null &&
    selectedEnd != null &&
    endOptions.some((option) => option.endMinutes === selectedEnd);
  const totalPrice =
    selectedStart != null && selectedEnd != null
      ? pricePerHour * ((selectedEnd - selectedStart) / 60)
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
                onClick={() => {
                  setDate(day);
                  setSelectedStart(null);
                  setSelectedEnd(null);
                }}
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

        <h3 className="mb-3 mt-5 font-heading text-lg font-semibold">Available slots</h3>
        {loadingSlots ? (
          <div className="flex h-24 items-center justify-center text-muted-foreground">
            <LoaderCircle className="animate-spin" />
          </div>
        ) : slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">No slots configured for this turf.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {slots.map((slot) => (
              <button
                key={slot.startMinutes}
                type="button"
                disabled={!slot.available}
                title={slot.label}
                onClick={() => {
                  setSelectedStart(slot.startMinutes);
                  setSelectedEnd(slot.endMinutes);
                }}
                className={cn(
                  "rounded-xl border px-2 py-2.5 text-center text-xs font-semibold transition-colors",
                  selectedStart === slot.startMinutes
                    ? "border-primary bg-primary text-primary-foreground"
                    : slot.available
                      ? "cursor-pointer border-border text-foreground hover:border-primary/50 hover:bg-muted"
                      : "cursor-not-allowed border-border/50 text-muted-foreground/50"
                )}
              >
                {minutesToLabel(slot.startMinutes)}
              </button>
            ))}
          </div>
        )}

        {selectedStart != null && endOptions.length > 0 && (
          <>
            <h3 className="mb-3 mt-5 font-heading text-lg font-semibold">Book until</h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {endOptions.map((option) => (
                <button
                  key={option.endMinutes}
                  type="button"
                  onClick={() => setSelectedEnd(option.endMinutes)}
                  className={cn(
                    "rounded-xl border px-2 py-2.5 text-center text-xs font-semibold transition-colors",
                    selectedEnd === option.endMinutes
                      ? "border-primary bg-primary text-primary-foreground"
                      : "cursor-pointer border-border text-foreground hover:border-primary/50 hover:bg-muted"
                  )}
                >
                  {minutesToLabel(option.endMinutes)} ({option.hours} hr{option.hours > 1 ? "s" : ""})
                </button>
              ))}
            </div>
          </>
        )}

        <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total · Pay at venue</p>
            <p className="font-heading text-xl font-bold">
              {selectionValid && totalPrice != null ? `${CURRENCY_SYMBOL}${totalPrice}` : "—"}
            </p>
          </div>

          {isAuthenticated ? (
            <Button
              type="button"
              disabled={!selectionValid}
              onClick={() => setConfirmOpen(true)}
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
              {selectedStart != null && selectedEnd != null
                ? `${minutesToLabel(selectedStart)} – ${minutesToLabel(selectedEnd)}`
                : ""}
            </dd>
            <dt className="text-muted-foreground">Payment</dt>
            <dd className="text-right font-medium">Pay at venue</dd>
            <dt className="text-muted-foreground">Total</dt>
            <dd className="text-right font-semibold">
              {CURRENCY_SYMBOL}
              {totalPrice ?? 0}
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
            <input type="hidden" name="startMinutes" value={selectedStart ?? ""} />
            <input type="hidden" name="endMinutes" value={selectedEnd ?? ""} />
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
