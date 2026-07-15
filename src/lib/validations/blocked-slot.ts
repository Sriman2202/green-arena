import { z } from "zod";

export const blockSlotSchema = z.object({
  turfId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  startMinutes: z.coerce.number().int().min(0).max(1439),
  endMinutes: z.coerce.number().int().min(0).max(1440),
  reason: z.string().max(200).optional(),
});

export type BlockSlotInput = z.infer<typeof blockSlotSchema>;
