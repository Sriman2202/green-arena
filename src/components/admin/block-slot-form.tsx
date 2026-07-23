"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimePicker } from "@/components/ui/time-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { blockSlot } from "@/actions/admin-blocked-slots";
import { minutesToLabel, minutesToTimeValue, timeValueToMinutes } from "@/lib/slots";

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
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<PendingBlock | null>(null);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [rangeDefaultsKey, setRangeDefaultsKey] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const selectedTurf = turfs.find((turf) => turf.id === turfId);
  const dateStr = format(date, "yyyy-MM-dd");
  const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const fullDayStart = selectedTurf
    ? isToday
      ? Math.max(selectedTurf.openTimeMinutes, nowMinutes)
      : selectedTurf.openTimeMinutes
    : 0;
  const fullDayDisabled = !selectedTurf || isPending || fullDayStart >= (selectedTurf?.closeTimeMinutes ?? 0);

  const defaultsKey = `${turfId}|${dateStr}`;
  if (selectedTurf && defaultsKey !== rangeDefaultsKey) {
    const start = fullDayStart;
    const end = Math.min(start + selectedTurf.slotDurationMinutes, selectedTurf.closeTimeMinutes);
    setRangeDefaultsKey(defaultsKey);
    setRangeStart(minutesToTimeValue(start));
    setRangeEnd(minutesToTimeValue(Math.max(end, start)));
  }

  function openConfirm(pending: PendingBlock) {
    setReason("");
    setConfirmTarget(pending);
  }

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
      }
      setPendingKey(null);
      setConfirmTarget(null);
    });
  }

  function handleBlockRangeClick() {
    if (!selectedTurf) return;
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
    if (startMinutes < selectedTurf.openTimeMinutes || endMinutes > selectedTurf.closeTimeMinutes) {
      toast.error("Time range is outside turf hours.");
      return;
    }
    if (isToday && startMinutes < nowMinutes) {
      toast.error("Cannot block a time that has already passed.");
      return;
    }
    openConfirm({ key: `custom-${startMinutes}-${endMinutes}`, startMinutes, endMinutes });
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

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Date</label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger className="flex h-9 w-40 items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm">
              <span>{format(date, "dd-MM-yyyy")}</span>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(value) => {
                  if (value) {
                    setDate(value);
                    setCalendarOpen(false);
                  }
                }}
                disabled={{ before: startOfToday() }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <h3 className="font-heading text-lg font-semibold">
            {format(date, "EEEE, MMMM d, yyyy")}
          </h3>

          <div className="flex flex-wrap items-end gap-3">
            <Button
              type="button"
              disabled={fullDayDisabled}
              onClick={() =>
                selectedTurf &&
                openConfirm({
                  key: "full-day",
                  startMinutes: fullDayStart,
                  endMinutes: selectedTurf.closeTimeMinutes,
                })
              }
            >
              {pendingKey === "full-day" ? "Blocking..." : "Block Full Day"}
            </Button>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="range-start" className="text-xs font-medium text-muted-foreground">
                Start time
              </label>
              <TimePicker id="range-start" value={rangeStart} onChange={setRangeStart} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="range-end" className="text-xs font-medium text-muted-foreground">
                End time
              </label>
              <TimePicker id="range-end" value={rangeEnd} onChange={setRangeEnd} />
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={!selectedTurf || isPending}
              onClick={handleBlockRangeClick}
            >
              Block range
            </Button>
          </div>
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
            <div className="space-y-4">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Turf</dt>
                <dd className="text-right font-medium">{selectedTurf?.name}</dd>
                <dt className="text-muted-foreground">Date</dt>
                <dd className="text-right font-medium">{format(date, "EEEE, MMMM d, yyyy")}</dd>
                <dt className="text-muted-foreground">Time</dt>
                <dd className="text-right font-medium">
                  {minutesToLabel(confirmTarget.startMinutes)} – {minutesToLabel(confirmTarget.endMinutes)}
                </dd>
              </dl>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="block-reason" className="text-xs font-medium text-muted-foreground">
                  Reason (optional)
                </label>
                <Input
                  id="block-reason"
                  placeholder="e.g. Maintenance"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              </div>
            </div>
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
