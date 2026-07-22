import { z } from "zod";

export const turfSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  contactNumber: z.string().min(7, "Enter a valid contact number").max(20, "Contact number is too long"),
  city: z.string().min(1, "City is required"),
  area: z.string().optional(),
  sportTypes: z.array(z.string().min(1)).min(1, "Select at least one sport type"),
  pricePerHour: z.coerce.number().positive("Price must be greater than 0"),
  openTimeMinutes: z.coerce.number().int().min(0).max(1439),
  closeTimeMinutes: z.coerce.number().int().min(1).max(1440),
  slotDurationMinutes: z.coerce.number().int().min(15).max(240),
  amenities: z.array(z.string().min(1)).default([]),
  images: z.array(z.string().min(1)).default([]),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  isActive: z.coerce.boolean().default(true),
}).refine((data) => data.closeTimeMinutes > data.openTimeMinutes, {
  message: "Closing time must be after opening time",
  path: ["closeTimeMinutes"],
});

export type TurfInput = z.infer<typeof turfSchema>;
