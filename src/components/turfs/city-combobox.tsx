"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function CityCombobox({
  cities,
  defaultValue,
}: {
  cities: readonly string[];
  defaultValue?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(defaultValue ?? "");

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="city-trigger" className="text-xs font-medium text-muted-foreground">
        City
      </label>
      <input type="hidden" name="city" value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id="city-trigger"
              type="button"
              variant="outline"
              className="h-9 w-44 justify-between px-3 font-normal"
            >
              <span className={cn("truncate", !value && "text-muted-foreground")}>
                {value || "All cities"}
              </span>
              <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
            </Button>
          }
        />
        <PopoverContent className="w-44 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search city..." />
            <CommandList>
              <CommandEmpty>No city found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="All cities"
                  onSelect={() => {
                    setValue("");
                    setOpen(false);
                  }}
                >
                  <Check className={cn("size-4", value ? "opacity-0" : "opacity-100")} />
                  All cities
                </CommandItem>
                {cities.map((city) => (
                  <CommandItem
                    key={city}
                    value={city}
                    onSelect={() => {
                      setValue(city);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("size-4", value === city ? "opacity-100" : "opacity-0")} />
                    {city}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
