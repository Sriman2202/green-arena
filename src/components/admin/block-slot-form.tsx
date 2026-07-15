"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { blockSlot } from "@/actions/admin-blocked-slots";
import { generateSlotStarts, minutesToLabel, todayDateString } from "@/lib/slots";

interface TurfOption {
  id: string;
  name: string;
  openTimeMinutes: number;
  closeTimeMinutes: number;
  slotDurationMinutes: number;
}

export function BlockSlotForm({
  turfs,
  defaultTurfId,
}: {
  turfs: TurfOption[];
  defaultTurfId?: string;
}) {
  const [turfId, setTurfId] = useState(defaultTurfId ?? turfs[0]?.id ?? "");
  const [date, setDate] = useState(todayDateString());
  const [startMinutes, setStartMinutes] = useState<number | null>(null);
  const [endMinutes, setEndMinutes] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedTurf = turfs.find((turf) => turf.id === turfId);

  const startOptions = useMemo(() => {
    if (!selectedTurf) return [];
    return generateSlotStarts(selectedTurf);
  }, [selectedTurf]);

  const endOptions = useMemo(() => {
    if (!selectedTurf || startMinutes == null) return [];
    const options: number[] = [];
    for (
      let end = startMinutes + selectedTurf.slotDurationMinutes;
      end <= selectedTurf.closeTimeMinutes;
      end += selectedTurf.slotDurationMinutes
    ) {
      options.push(end);
    }
    return options;
  }, [selectedTurf, startMinutes]);

  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (startMinutes == null || endMinutes == null) {
          toast.error("Choose a start and end time.");
          return;
        }
        const formData = new FormData();
        formData.set("turfId", turfId);
        formData.set("date", date);
        formData.set("startMinutes", String(startMinutes));
        formData.set("endMinutes", String(endMinutes));
        if (reason) formData.set("reason", reason);

        startTransition(async () => {
          const result = await blockSlot({}, formData);
          if (result.error) {
            toast.error(result.error);
          } else {
            toast.success("Slot blocked.");
            setStartMinutes(null);
            setEndMinutes(null);
            setReason("");
          }
        });
      }}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="block-turf" className="text-xs font-medium text-muted-foreground">
          Turf
        </label>
        <select
          id="block-turf"
          value={turfId}
          onChange={(event) => {
            setTurfId(event.target.value);
            setStartMinutes(null);
            setEndMinutes(null);
          }}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          {turfs.map((turf) => (
            <option key={turf.id} value={turf.id}>
              {turf.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="block-date" className="text-xs font-medium text-muted-foreground">
          Date
        </label>
        <input
          id="block-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="block-start" className="text-xs font-medium text-muted-foreground">
          Start
        </label>
        <select
          id="block-start"
          value={startMinutes ?? ""}
          onChange={(event) => {
            const value = event.target.value ? Number(event.target.value) : null;
            setStartMinutes(value);
            setEndMinutes(null);
          }}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">Select start</option>
          {startOptions.map((start) => (
            <option key={start} value={start}>
              {minutesToLabel(start)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="block-end" className="text-xs font-medium text-muted-foreground">
          End
        </label>
        <select
          id="block-end"
          value={endMinutes ?? ""}
          onChange={(event) =>
            setEndMinutes(event.target.value ? Number(event.target.value) : null)
          }
          disabled={startMinutes == null}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">Select end</option>
          {endOptions.map((end) => (
            <option key={end} value={end}>
              {minutesToLabel(end)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="block-reason" className="text-xs font-medium text-muted-foreground">
          Reason (optional)
        </label>
        <input
          id="block-reason"
          type="text"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Maintenance"
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Blocking..." : "Block slot"}
      </Button>
    </form>
  );
}
