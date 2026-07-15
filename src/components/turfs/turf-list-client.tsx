"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TurfCard } from "@/components/turfs/turf-card";
import { haversineDistanceKm } from "@/lib/geo";
import type { TurfListItem } from "@/lib/types";

export function TurfListClient({ turfs }: { turfs: TurfListItem[] }) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      toast.error("Geolocation isn't supported in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        toast.error("Couldn't access your location. Check your browser permissions.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  useEffect(() => {
    const timer = setTimeout(() => handleUseMyLocation(), 0);
    return () => clearTimeout(timer);
  }, []);

  const sortedTurfs = useMemo(() => {
    if (!userLocation) return turfs.map((turf) => ({ turf, distanceKm: undefined as number | undefined }));

    const withDistance = turfs.map((turf) => ({
      turf,
      distanceKm:
        turf.lat != null && turf.lng != null
          ? haversineDistanceKm(userLocation, { lat: turf.lat, lng: turf.lng })
          : undefined,
    }));

    return withDistance.sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }, [turfs, userLocation]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {turfs.length} {turfs.length === 1 ? "turf" : "turfs"} found
        </p>
        <Button variant="outline" size="sm" onClick={handleUseMyLocation} disabled={locating}>
          {locating ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <MapPin />
          )}
          {userLocation ? "Sorted by distance" : "Use my location"}
        </Button>
      </div>

      {turfs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No turfs match your filters. Try widening your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTurfs.map(({ turf, distanceKm }) => (
            <TurfCard key={turf.id} turf={turf} distanceKm={distanceKm} />
          ))}
        </div>
      )}
    </div>
  );
}
