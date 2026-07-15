# Admin (turf owner) workflow

## Who this is
A turf owner/manager (`Role.ADMIN`). Created inline by a super admin while onboarding a turf (no self-signup path). Scoped to the turf(s) where `Turf.ownerId` equals their user id — never anyone else's.

## What they can do

1. **Log in** at `/login` → redirected to `/admin` (their scoped dashboard).
2. **Edit their own turf's profile** (`/admin/turfs/[id]/edit`, only reachable for a turf they own — direct-URL attempts on another admin's turf id redirect to `/admin/turfs`):
   - Name, description, address/city/area, sport type, price/hour, opening/closing time, slot length, amenities, photos, and a contact number (shown to users on their `/bookings` page after they book).
   - Cannot change who owns the turf (owner reassignment is super-admin-only), cannot deactivate/reactivate it (offboarding is super-admin-only, see below), and cannot change the turf's platform commission rate (super-admin-only, set at onboarding).
3. **Cannot onboard new turfs** — `/admin/turfs/new` redirects them to `/admin`; no "Add turf" button shown on `/admin/turfs`.
4. **Block/unblock slots on their own turf** (`/admin/bookings`), for maintenance, private events, etc.:
   - Pick a date + time range (no 3-hour cap — they can block a whole day).
   - Blocking a range that overlaps an existing `CONFIRMED` booking is rejected; they'd need to cancel that booking first (see next point).
   - Users see blocked slots as simply unavailable — no distinction from an already-booked slot.
5. **Manage bookings on their own turf**: change a booking's status (`CONFIRMED` / `COMPLETED` / `CANCELLED`) from `/admin/bookings`. Scoped server-side — even a crafted `?turfId=<someone-else's-turf>` URL returns nothing.
6. **Dashboard** (`/admin`): revenue (gross, what they collect at the venue), total bookings, and active-turf count, all scoped to only the turf(s) they own. Same for the turf filter dropdown on both `/admin` and `/admin/bookings` — it only lists their own turf(s). This view does not show the platform's commission cut — that's super-admin-only (see `super-admin.md`).

## What they cannot do
- See, edit, block slots for, or view bookings/stats of any turf they don't own.
- Onboard (create) or offboard (deactivate) any turf, including their own.
