import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CityCombobox } from "@/components/turfs/city-combobox";
import { CITIES, SPORT_TYPES } from "@/lib/constants";

export interface TurfFiltersValue {
  city?: string;
  sport?: string;
  minPrice?: string;
  maxPrice?: string;
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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="minPrice" className="text-xs font-medium text-muted-foreground">
          Min &#8377;/hr
        </label>
        <input
          id="minPrice"
          name="minPrice"
          type="number"
          min={0}
          defaultValue={filters.minPrice ?? ""}
          className="h-9 w-24 rounded-lg border border-input bg-background px-3 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="maxPrice" className="text-xs font-medium text-muted-foreground">
          Max &#8377;/hr
        </label>
        <input
          id="maxPrice"
          name="maxPrice"
          type="number"
          min={0}
          defaultValue={filters.maxPrice ?? ""}
          className="h-9 w-24 rounded-lg border border-input bg-background px-3 text-sm"
        />
      </div>

      <Button type="submit" size="sm">
        Apply filters
      </Button>
      {(filters.city || filters.sport || filters.minPrice || filters.maxPrice) && (
        <Button variant="ghost" size="sm" render={<Link href="/turfs" />}>
          Clear
        </Button>
      )}
    </form>
  );
}
