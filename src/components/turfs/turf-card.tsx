import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import type { TurfListItem } from "@/lib/types";

export function TurfCard({
  turf,
  distanceKm,
}: {
  turf: TurfListItem;
  distanceKm?: number;
}) {
  return (
    <Link
      href={`/turfs/${turf.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {turf.images[0] ? (
          <Image
            src={turf.images[0]}
            alt={turf.name}
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No image available
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1">
          {turf.sportTypes.slice(0, 2).map((sport) => (
            <Badge key={sport} variant="secondary">
              {sport}
            </Badge>
          ))}
          {turf.sportTypes.length > 2 && (
            <Badge variant="secondary">+{turf.sportTypes.length - 2}</Badge>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="font-heading text-lg font-semibold leading-tight">
          {turf.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {turf.area ? `${turf.area}, ` : ""}
          {turf.city}
          {typeof distanceKm === "number" && (
            <span className="text-foreground"> · {distanceKm.toFixed(1)} km away</span>
          )}
        </p>
        <div className="mt-auto flex items-baseline gap-1 pt-2">
          <span className="font-heading text-xl font-bold">
            {CURRENCY_SYMBOL}
            {turf.pricePerHour}
          </span>
          <span className="text-sm text-muted-foreground">/ hour</span>
        </div>
      </div>
    </Link>
  );
}
