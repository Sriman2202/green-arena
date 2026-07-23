import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CityCombobox } from "@/components/turfs/city-combobox";
import { CITIES, SPORT_TYPES } from "@/lib/constants";

export interface TurfFiltersValue {
  city?: string;
  sport?: string;
}

export function TurfFilters({ filters }: { filters: TurfFiltersValue }) {
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4"
    >
      <CityCombobox cities={CITIES} defaultValue={filters.city} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="sport" className="text-xs font-medium text-muted-foreground">
          Sport
        </label>
        <select
          id="sport"
          name="sport"
          defaultValue={filters.sport ?? ""}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">All sports</option>
          {SPORT_TYPES.map((sport) => (
            <option key={sport} value={sport}>
              {sport}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" size="sm">
        Apply filters
      </Button>
      {(filters.city || filters.sport) && (
        <Button variant="ghost" size="sm" render={<Link href="/turfs" />}>
          Clear
        </Button>
      )}
    </form>
  );
}
