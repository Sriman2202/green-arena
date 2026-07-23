export interface SlotGridInput {
  openTimeMinutes: number;
  closeTimeMinutes: number;
  slotDurationMinutes: number;
}

export interface SlotInfo {
  startMinutes: number;
  endMinutes: number;
  label: string;
  available: boolean;
}

export function generateSlotStarts({
  openTimeMinutes,
  closeTimeMinutes,
  slotDurationMinutes,
}: SlotGridInput): number[] {
  const starts: number[] = [];
  for (
    let start = openTimeMinutes;
    start + slotDurationMinutes <= closeTimeMinutes;
    start += slotDurationMinutes
  ) {
    starts.push(start);
  }
  return starts;
}

export function minutesToTimeValue(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export function timeValueToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function minutesToLabel(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/** Combines a "YYYY-MM-DD" date string with minutes-since-midnight into a local Date. */
export function slotStartDate(dateStr: string, startMinutes: number): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setMinutes(date.getMinutes() + startMinutes);
  return date;
}

export function todayDateString(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface MinuteRange {
  startMinutes: number;
  endMinutes: number;
}

export function computeAvailability(
  turf: SlotGridInput,
  dateStr: string,
  bookedRanges: MinuteRange[],
  blockedRanges: MinuteRange[] = [],
  now: Date = new Date()
): SlotInfo[] {
  const starts = generateSlotStarts(turf);
  const overlapsAny = (ranges: MinuteRange[], startMinutes: number, endMinutes: number) =>
    ranges.some((r) => startMinutes < r.endMinutes && endMinutes > r.startMinutes);
  return starts.map((startMinutes) => {
    const endMinutes = startMinutes + turf.slotDurationMinutes;
    const isBooked = overlapsAny(bookedRanges, startMinutes, endMinutes);
    const isBlocked = overlapsAny(blockedRanges, startMinutes, endMinutes);
    const isPast = slotStartDate(dateStr, startMinutes) <= now;
    return {
      startMinutes,
      endMinutes,
      label: `${minutesToLabel(startMinutes)} - ${minutesToLabel(endMinutes)}`,
      available: !isBooked && !isBlocked && !isPast,
    };
  });
}
