"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { blockSlot, getAdminDaySlots, unblockSlot, type AdminDaySlot } from "@/actions/admin-blocked-slots";
import { minutesToLabel } from "@/lib/slots";

interface PendingBlock {
  key: string;
  startMinutes: number;
  endMinutes: number;
}

interface TurfOption {
  id: string;
  name: string;
  openTimeMinutes: number;
  closeTimeMinutes: number;
  slotDurationMinutes: number;
}

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

export function BlockSlotForm({ turfs }: { turfs: TurfOption[] }) {
  const [turfId, setTurfId] = useState(turfs[0]?.id ?? "");
  const [date, setDate] = useState<Date>(startOfToday);
  const [reason, setReason] = useState("");
  const [daySlots, setDaySlots] = useState<AdminDaySlot[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<PendingBlock | null>(null);

  const selectedTurf = turfs.find((turf) => turf.id === turfId);
  const dateStr = format(date, "yyyy-MM-dd");

  function refreshSlots() {
    if (!turfId) return;
    getAdminDaySlots(turfId, dateStr).then(setDaySlots);
  }

  useEffect(() => {
    if (!turfId) return;
    let cancelled = false;
    getAdminDaySlots(turfId, dateStr).then((slots) => {
      if (!cancelled) setDaySlots(slots);
    });
    return () => {
      cancelled = true;
    };
  }, [turfId, dateStr]);

  function confirmBlock(pending: PendingBlock) {
    setPendingKey(pending.key);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("turfId", turfId);
      formData.set("date", dateStr);
      formData.set("startMinutes", String(pending.startMinutes));
      formData.set("endMinutes", String(pending.endMinutes));
      if (reason) formData.set("reason", reason);

      const result = await blockSlot({}, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Blocked.");
        refreshSlots();
      }
      setPendingKey(null);
      setConfirmTarget(null);
    });
  }

  function runUnblock(key: string, blockedSlotId: string) {
    setPendingKey(key);
    startTransition(async () => {
      const result = await unblockSlot(blockedSlotId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Slot unblocked.");
        refreshSlots();
      }
      setPendingKey(null);
    });
  }

  return (
    <div className="space-y-3">
      {turfs.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="block-turf" className="text-xs font-medium text-muted-foreground">
            Turf
          </label>
          <select
            id="block-turf"
            value={turfId}
            onChange={(event) => setTurfId(event.target.value)}
            className="h-9 w-fit rounded-lg border border-input bg-background px-3 text-sm"
          >
            {turfs.map((turf) => (
              <option key={turf.id} value={turf.id}>
                {turf.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 md:flex-row">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(value) => value && setDate(value)}
          disabled={{ before: startOfToday() }}
          className="w-fit rounded-lg border border-border"
        />

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-heading text-lg font-semibold">
              {format(date, "EEEE, MMMM d, yyyy")}
            </h3>
            <Input
              placeholder="Reason (optional)"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-48"
            />
          </div>

          <Button
            type="button"
            disabled={!selectedTurf || isPending}
            onClick={() =>
              selectedTurf &&
              setConfirmTarget({
                key: "full-day",
                startMinutes: selectedTurf.openTimeMinutes,
                endMinutes: selectedTurf.closeTimeMinutes,
              })
            }
          >
            {pendingKey === "full-day" ? "Blocking..." : "Block Full Day"}
          </Button>

          {daySlots == null ? (
            <p className="text-sm text-muted-foreground">Loading slots...</p>
          ) : daySlots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No slots configured for this turf.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {daySlots.map((slot) => {
                const key = `slot-${slot.startMinutes}`;
                const busy = isPending && pendingKey === key;
                return (
                  <button
                    key={slot.startMinutes}
                    type="button"
                    disabled={slot.status === "booked" || busy}
                    onClick={() =>
                      slot.status === "blocked" && slot.blockedSlotId
                        ? runUnblock(key, slot.blockedSlotId)
                        : setConfirmTarget({ key, startMinutes: slot.startMinutes, endMinutes: slot.endMinutes })
                    }
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-center text-xs font-semibold transition-colors",
                      slot.status === "booked"
                        ? "cursor-not-allowed border-border/50 text-muted-foreground/50"
                        : slot.status === "blocked"
                          ? "cursor-pointer border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/20"
                          : "cursor-pointer border-border text-foreground hover:border-primary/50 hover:bg-muted"
                    )}
                  >
                    {busy
                      ? "..."
                      : `${minutesToLabel(slot.startMinutes)} - ${minutesToLabel(slot.endMinutes)}`}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={confirmTarget != null} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm block</DialogTitle>
            <DialogDescription>
              Users won&apos;t be able to book this time. You can unblock it later.
            </DialogDescription>
          </DialogHeader>

          {confirmTarget && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Turf</dt>
              <dd className="text-right font-medium">{selectedTurf?.name}</dd>
              <dt className="text-muted-foreground">Date</dt>
              <dd className="text-right font-medium">{format(date, "EEEE, MMMM d, yyyy")}</dd>
              <dt className="text-muted-foreground">Time</dt>
              <dd className="text-right font-medium">
                {minutesToLabel(confirmTarget.startMinutes)} – {minutesToLabel(confirmTarget.endMinutes)}
              </dd>
              {reason && (
                <>
                  <dt className="text-muted-foreground">Reason</dt>
                  <dd className="text-right font-medium">{reason}</dd>
                </>
              )}
            </dl>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={() => confirmTarget && confirmBlock(confirmTarget)}
            >
              {isPending ? "Blocking..." : "Confirm block"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
