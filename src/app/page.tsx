import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { TurfCard } from "@/components/turfs/turf-card";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { SPORT_TYPES, CURRENCY_SYMBOL } from "@/lib/constants";
import type { TurfListItem } from "@/lib/types";

const SPORT_STYLES: Partial<Record<(typeof SPORT_TYPES)[number], string>> = {
  Football: "bg-[#dcfce7] text-[#15803d]",
  Cricket: "bg-[#fef3c7] text-[#b45309]",
  Badminton: "bg-[#e0f2fe] text-[#0369a1]",
  "Box Cricket": "bg-[#ede9fe] text-[#6d28d9]",
  Basketball: "bg-[#ffe4e6] text-[#be123c]",
  Tennis: "bg-[#fef9c3] text-[#a16207]",
  Futsal: "bg-[#cffafe] text-[#0e7490]",
  Volleyball: "bg-[#fae8ff] text-[#a21caf]",
};

function sportInitials(sport: string) {
  return sport
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function greetingForTime(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function HomePage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0];

  const turfs = await prisma.turf.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const turfItems: TurfListItem[] = turfs.map((turf) => ({
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

  const popularTurfs = turfItems.slice(0, 4);
  const moreTurfs = turfItems.slice(4, 8);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Greeting + search */}
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {greetingForTime(new Date().getHours())}
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold sm:text-4xl">
            {firstName ? `${firstName}, ready to play?` : "Ready to play?"}
          </h1>
        </div>
        <Link
          href="/turfs"
          className="flex w-full items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 sm:w-80"
        >
          <Search className="size-4" />
          Search turfs, sports, areas
        </Link>
      </div>

      {/* Book by sport */}
      <section className="mt-10">
        <h2 className="mb-4 font-heading text-xl font-bold">Book by sport</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SPORT_TYPES.map((sport) => (
            <Link
              key={sport}
              href={`/turfs?sport=${encodeURIComponent(sport)}`}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <div
                className={cn(
                  "flex size-11 items-center justify-center rounded-xl font-heading text-lg font-bold",
                  SPORT_STYLES[sport] ?? "bg-primary/10 text-primary"
                )}
              >
                {sportInitials(sport)}
              </div>
              <span className="font-semibold">{sport}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular turfs */}
      {popularTurfs.length > 0 && (
        <section className="mt-14">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-heading text-xl font-bold">Popular near you</h2>
            <Link href="/turfs" className="text-sm font-semibold text-primary">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {popularTurfs.map((turf) => (
              <TurfCard key={turf.id} turf={turf} />
            ))}
          </div>
        </section>
      )}

      {/* More turfs, list rows */}
      {moreTurfs.length > 0 && (
        <section className="mb-10 mt-14">
          <h2 className="mb-4 font-heading text-xl font-bold">More turfs to explore</h2>
          <div className="flex flex-col gap-3">
            {moreTurfs.map((turf) => (
              <Link
                key={turf.id}
                href={`/turfs/${turf.id}`}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/50"
              >
                <div className="relative size-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                  {turf.images[0] && (
                    <Image
                      src={turf.images[0]}
                      alt={turf.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{turf.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {turf.sportType} · {turf.area ? `${turf.area}, ` : ""}
                    {turf.city}
                  </p>
                </div>
                <p className="font-heading font-bold">
                  {CURRENCY_SYMBOL}
                  {turf.pricePerHour}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">/hr</span>
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {turfItems.length === 0 && (
        <p className="mt-14 text-center text-muted-foreground">
          No turfs available yet. Check back soon.
        </p>
      )}
    </div>
  );
}
