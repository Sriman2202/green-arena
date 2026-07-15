import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { TurfFilters } from "@/components/turfs/turf-filters";
import { TurfListClient } from "@/components/turfs/turf-list-client";
import type { TurfListItem } from "@/lib/types";

export default async function TurfsPage({
  searchParams,
}: {
  searchParams: Promise<{
    city?: string;
    sport?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}) {
  const { city, sport, minPrice, maxPrice } = await searchParams;

  const where: Prisma.TurfWhereInput = { isActive: true };
  if (city) where.city = city;
  if (sport) where.sportType = sport;
  if (minPrice || maxPrice) {
    where.pricePerHour = {
      ...(minPrice ? { gte: Number(minPrice) } : {}),
      ...(maxPrice ? { lte: Number(maxPrice) } : {}),
    };
  }

  const turfs = await prisma.turf.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const turfListItems: TurfListItem[] = turfs.map((turf) => ({
    id: turf.id,
    name: turf.name,
    city: turf.city,
    area: turf.area,
    sportType: turf.sportType,
    pricePerHour: Number(turf.pricePerHour),
    images: turf.images,
    lat: turf.lat,
    lng: turf.lng,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="space-y-1">
        <h1 className="font-heading text-3xl font-bold">Find a turf</h1>
        <p className="text-muted-foreground">
          Browse turfs near you and book a slot in seconds.
        </p>
      </div>
      <TurfFilters filters={{ city, sport, minPrice, maxPrice }} />
      <TurfListClient turfs={turfListItems} />
    </div>
  );
}
