import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { SlotPicker } from "@/components/turfs/slot-picker";
import { TurfGallery } from "@/components/turfs/turf-gallery";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { minutesToLabel } from "@/lib/slots";

export default async function TurfDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const turf = await prisma.turf.findUnique({ where: { id } });
  if (!turf || !turf.isActive) {
    notFound();
  }

  const session = await auth();
  const loginUrl = `/login?callbackUrl=${encodeURIComponent(`/turfs/${id}`)}`;
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <TurfGallery images={turf.images} turfName={turf.name} />

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {turf.sportTypes.map((sport) => (
                <Badge key={sport} variant="secondary">
                  {sport}
                </Badge>
              ))}
              {!turf.isActive && <Badge variant="destructive">Unavailable</Badge>}
            </div>
            <h1 className="font-heading text-3xl font-bold">{turf.name}</h1>
            <p className="text-muted-foreground">
              {turf.address}
              {turf.area ? `, ${turf.area}` : ""}, {turf.city}
            </p>
          </div>

          <p className="leading-relaxed text-foreground/90">{turf.description}</p>

          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">Hours</p>
              <p className="font-medium">
                {minutesToLabel(turf.openTimeMinutes)} – {minutesToLabel(turf.closeTimeMinutes)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Slot length</p>
              <p className="font-medium">{turf.slotDurationMinutes} min</p>
            </div>
            <div>
              <p className="text-muted-foreground">Price</p>
              <p className="font-medium">
                {CURRENCY_SYMBOL}
                {Number(turf.pricePerHour)} / hour
              </p>
            </div>
          </div>

          {turf.amenities.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {turf.amenities.map((amenity) => (
                  <Badge key={amenity} variant="outline">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isAdmin ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-heading text-lg font-semibold">Admins can&apos;t book turfs.</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage this turf&apos;s availability from the admin bookings page.
          </p>
          <Link
            href={`/admin/bookings?turfId=${turf.id}`}
            className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
          >
            Manage blocked slots for this turf →
          </Link>
        </div>
      ) : (
        <SlotPicker
          turfId={turf.id}
          turfName={turf.name}
          pricePerHour={Number(turf.pricePerHour)}
          slotDurationMinutes={turf.slotDurationMinutes}
          isAuthenticated={!!session?.user}
          loginUrl={loginUrl}
          contactNumber={turf.contactNumber}
        />
      )}
    </div>
  );
}
