# Basic User workflow

## Who this is
Anyone who signs up to book a turf. Default role (`Role.USER`).

## What they can do

1. **Sign up / log in** — email + password (`/signup`, `/login`). Already implemented, unchanged.
2. **Discover turfs**
   - Browse `/turfs`, optionally filter by sport/city/search.
   - The browser's geolocation permission prompt fires automatically on page load; if allowed, the list is sorted by distance (haversine against each turf's `lat`/`lng`). A "Use my location" button remains as a manual retry if they dismissed/denied it.
3. **Book a turf**
   - Pick a turf → pick a date (next 7 days) → pick a **start** slot.
   - Pick an **end** slot to book multiple contiguous hours in one booking, capped at `MAX_BOOKING_HOURS` (3 hours). Only contiguous, available slots are offered as end options.
   - Price is `pricePerHour × hours booked`, shown before and in the confirm dialog. Payment is "pay at venue" (no online payment integration).
   - A slot that's already booked (by anyone) or blocked by the turf's admin is unavailable — shown disabled, no strikethrough.
4. **Manage bookings**
   - `/bookings` lists their own bookings (all turfs, past and upcoming).
   - Can cancel a `CONFIRMED` booking, subject to the existing cancellation cutoff (`CANCELLATION_CUTOFF_HOURS = 1` — cannot cancel within 1 hour of the slot's start). **Unchanged per your instruction.**
5. **See the turf's contact number** once a booking is confirmed — shown on `/bookings` for each booking, so they can call the venue if needed.
6. **No admin access** — `/admin/*` redirects them to `/`.
