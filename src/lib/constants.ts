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

export const MIN_BOOKING_MINUTES = 60;

export const BOOKING_STEP_MINUTES = 30;

export const CURRENCY_SYMBOL = "₹";

export function formatBookingReference(bookingNumber: number): string {
  return `GA-${bookingNumber.toString().padStart(6, "0")}`;
}
