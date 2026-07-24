"use client";

import { useEffect, useRef, useState } from "react";
import { ClockIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function parseValue(value: string): [number, number] | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  return [Number(match[1]), Number(match[2])];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export function TimePicker({
  id,
  value,
  onChange,
  className,
  disabled,
  minMinutes,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  /** Minutes-since-midnight before which hours/minutes are disabled (e.g. the current time). */
  minMinutes?: number;
}) {
  const [open, setOpen] = useState(false);
  const minuteListRef = useRef<HTMLDivElement>(null);
  const selectedHourRef = useRef<HTMLButtonElement>(null);

  const parsed = parseValue(value);
  const [hour, minute] = parsed ?? [null, null];

  const minHour = minMinutes != null ? Math.floor(minMinutes / 60) : null;
  const minMinute = minMinutes != null ? minMinutes % 60 : null;
  const isHourDisabled = (h: number) => minHour != null && h < minHour;
  const isMinuteDisabled = (m: number) => {
    if (minHour == null || minMinute == null || hour == null) return false;
    if (hour > minHour) return false;
    if (hour < minHour) return true;
    return m < minMinute;
  };

  // The hour column's scroll position is handled by initialFocus (focusing
  // the selected hour button scrolls it into view natively). Doing it manually
  // here as well would race with that focus call and reset the scroll to 0.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const container = minuteListRef.current;
      const selected = container?.querySelector<HTMLButtonElement>("[data-selected=true]");
      if (!container || !selected) return;
      container.scrollTop =
        selected.offsetTop - container.clientHeight / 2 + selected.clientHeight / 2;
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        className={cn(
          "flex h-9 items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <span>{parsed ? `${pad(hour!)}:${pad(minute!)}` : "--:--"}</span>
        <ClockIcon className="h-4 w-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" initialFocus={selectedHourRef}>
        <div className="flex gap-1">
          <div className="flex max-h-56 w-14 flex-col gap-0.5 overflow-y-auto">
            {HOURS.map((h) => {
              const hourDisabled = isHourDisabled(h);
              return (
                <button
                  key={h}
                  type="button"
                  ref={h === hour ? selectedHourRef : undefined}
                  data-selected={h === hour}
                  disabled={hourDisabled}
                  onClick={() => onChange(`${pad(h)}:${pad(minute ?? 0)}`)}
                  className={cn(
                    "rounded-md px-2 py-1 text-center text-sm transition-colors",
                    hourDisabled
                      ? "cursor-not-allowed text-muted-foreground/40"
                      : h === hour
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                  )}
                >
                  {pad(h)}
                </button>
              );
            })}
          </div>
          <div ref={minuteListRef} className="flex max-h-56 w-14 flex-col gap-0.5 overflow-y-auto">
            {MINUTES.map((m) => {
              const minuteDisabled = isMinuteDisabled(m);
              return (
                <button
                  key={m}
                  type="button"
                  data-selected={m === minute}
                  disabled={minuteDisabled}
                  onClick={() => onChange(`${pad(hour ?? 0)}:${pad(m)}`)}
                  className={cn(
                    "rounded-md px-2 py-1 text-center text-sm transition-colors",
                    minuteDisabled
                      ? "cursor-not-allowed text-muted-foreground/40"
                      : m === minute
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                  )}
                >
                  {pad(m)}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
