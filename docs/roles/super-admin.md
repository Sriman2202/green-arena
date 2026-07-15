# Super Admin workflow

## Who this is
Runs the platform itself (`Role.SUPER_ADMIN`). Seeded account: `admin@greenarena.app`. Only one tier above `ADMIN`; sees and can touch every turf on the platform.

## What they can do

1. **Log in** → redirected to `/admin`.
2. **Onboard a turf** (`/admin/turfs/new`, super-admin only):
   - Fill in the turf's profile (same fields an admin can edit, see `admin.md`), plus a **platform commission rate** (%) for this specific turf — turfs can be onboarded at different rates.
   - Assign an owner inline, in the same form: either pick an existing `ADMIN` from a dropdown, or create a brand-new `ADMIN` account (name/email/password) on the spot. No separate "manage admins" screen — this is the only place admin accounts get created.
   - A turf can also be left "Unassigned" (no owner yet) and assigned later by editing it.
3. **See every turf on the platform** (`/admin/turfs`): full list regardless of owner, with "Owner" and "Commission %" columns. Existing turfs from before this feature start out unowned, defaulted to a standard commission rate.
4. **Offboard a turf**: the existing Activate/Deactivate toggle, now restricted to super admins only. Deactivating hides a turf from public listings/booking but keeps its history (bookings, blocked slots) intact — it's not a hard delete, and can be reversed by reactivating.
5. **Edit any turf**, including reassigning its owner and changing its commission rate — both super-admin-only fields, invisible/uneditable to the owning admin.
6. **See and manage every turf's bookings and blocked slots**, unscoped, on `/admin/bookings`.
7. **Platform-wide dashboard** (`/admin`): existing gross revenue/bookings/active-turf stats aggregated across every turf, **plus a new "Platform Revenue" figure** — the sum of each booking's stored commission amount (`pricePaid × that turf's commission rate at the time of booking`). Commission is calculated and stored per booking at booking time, so a later change to a turf's rate doesn't retroactively change past bookings' figures. This is the platform's actual "income," distinct from the gross totals turf owners see on their own scoped dashboard.

## What's deliberately out of scope (per your call in this session)
- No turf deletion, only deactivate/reactivate.
- No email invites/verification for newly-created admin accounts — they're created directly, ready to log in immediately with the password the super admin set.
- No separate admin-management page — admin accounts are only created through the turf-onboarding flow.
