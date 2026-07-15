export const SPORT_TYPES = [
  "Football",
  "Cricket",
  "Box Cricket",
  "Badminton",
  "Basketball",
  "Tennis",
  "Futsal",
  "Volleyball",
] as const;

export const CITIES = [
  "Bengaluru",
  "Mumbai",
  "Delhi NCR",
  "Hyderabad",
  "Pune",
  "Chennai",
] as const;

export const CANCELLATION_CUTOFF_HOURS = 1;

export const MAX_BOOKING_HOURS = 3;

export const CURRENCY_SYMBOL = "₹";

export function formatBookingReference(bookingNumber: number): string {
  return `GA-${bookingNumber.toString().padStart(6, "0")}`;
}
