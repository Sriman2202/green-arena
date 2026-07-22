"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";
import { CITIES, SPORT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TurfFormState } from "@/actions/turfs";

export interface TurfFormValues {
  name: string;
  description: string;
  address: string;
  contactNumber: string;
  city: string;
  area: string | null;
  sportTypes: string[];
  pricePerHour: number;
  openTimeMinutes: number;
  closeTimeMinutes: number;
  slotDurationMinutes: number;
  amenities: string[];
  images: string[];
  lat: number | null;
  lng: number | null;
  isActive: boolean;
  commissionPercent?: number;
}

const initialState: TurfFormState = {};

function errorList(errors?: string[]) {
  return errors?.map((message) => ({ message }));
}

function minutesToTimeValue(minutes?: number): string {
  if (minutes == null) return "";
  const clamped = Math.min(1439, Math.max(0, minutes));
  const h = Math.floor(clamped / 60).toString().padStart(2, "0");
  const m = (clamped % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function timeValueToMinutes(value: string): number | "" {
  if (!value) return "";
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function RequiredMark() {
  return (
    <span className="text-destructive" aria-hidden="true">
      {" "}
      *
    </span>
  );
}

export function TurfForm({
  action,
  defaultValues,
  submitLabel,
  ownerSection,
  showCommissionField,
  readOnlyByDefault,
}: {
  action: (prevState: TurfFormState, formData: FormData) => Promise<TurfFormState>;
  defaultValues?: Partial<TurfFormValues>;
  submitLabel: string;
  ownerSection?: React.ReactNode;
  showCommissionField?: boolean;
  readOnlyByDefault?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [readOnly, setReadOnly] = useState(!!readOnlyByDefault);

  const [openTime, setOpenTime] = useState(minutesToTimeValue(defaultValues?.openTimeMinutes ?? 360));
  const [closeTime, setCloseTime] = useState(
    minutesToTimeValue(defaultValues?.closeTimeMinutes ?? 1380)
  );

  const [keptImages, setKeptImages] = useState<string[]>(defaultValues?.images ?? []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedSports, setSelectedSports] = useState<string[]>(defaultValues?.sportTypes ?? []);

  function toggleSport(sport: string) {
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  }

  function syncFileInput(files: File[]) {
    if (!fileInputRef.current) return;
    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));
    fileInputRef.current.files = dataTransfer.files;
  }

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const combined = [...newFiles, ...Array.from(e.target.files ?? [])];
    setNewFiles(combined);
    syncFileInput(combined);
  }

  function removeKeptImage(src: string) {
    setKeptImages((prev) => prev.filter((img) => img !== src));
  }

  function removeNewFile(index: number) {
    const remaining = newFiles.filter((_, i) => i !== index);
    setNewFiles(remaining);
    syncFileInput(remaining);
  }

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <fieldset disabled={readOnly} className="contents">
      <FieldGroup>
        <Field data-invalid={!!state.fieldErrors?.name}>
          <FieldLabel htmlFor="name">
            Name
            <RequiredMark />
          </FieldLabel>
          <Input id="name" name="name" defaultValue={defaultValues?.name} required />
          <FieldError errors={errorList(state.fieldErrors?.name)} />
        </Field>

        <Field data-invalid={!!state.fieldErrors?.description}>
          <FieldLabel htmlFor="description">
            Description
            <RequiredMark />
          </FieldLabel>
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={defaultValues?.description}
            required
          />
          <FieldError errors={errorList(state.fieldErrors?.description)} />
        </Field>

        <Field data-invalid={!!state.fieldErrors?.address}>
          <FieldLabel htmlFor="address">
            Address
            <RequiredMark />
          </FieldLabel>
          <Input id="address" name="address" defaultValue={defaultValues?.address} required />
          <FieldError errors={errorList(state.fieldErrors?.address)} />
        </Field>

        <Field data-invalid={!!state.fieldErrors?.contactNumber}>
          <FieldLabel htmlFor="contactNumber">
            Contact number
            <RequiredMark />
          </FieldLabel>
          <Input
            id="contactNumber"
            name="contactNumber"
            type="tel"
            defaultValue={defaultValues?.contactNumber}
            required
          />
          <FieldError errors={errorList(state.fieldErrors?.contactNumber)} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={!!state.fieldErrors?.city}>
            <FieldLabel htmlFor="city">
              City
              <RequiredMark />
            </FieldLabel>
            <Input
              id="city"
              name="city"
              list="city-options"
              defaultValue={defaultValues?.city}
              required
            />
            <datalist id="city-options">
              {CITIES.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
            <FieldError errors={errorList(state.fieldErrors?.city)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="area">Area (optional)</FieldLabel>
            <Input id="area" name="area" defaultValue={defaultValues?.area ?? ""} />
          </Field>
        </div>

        <Field data-invalid={!!state.fieldErrors?.sportTypes}>
          <FieldLabel>
            Sport types
            <RequiredMark />
          </FieldLabel>
          <FieldDescription>Select every sport this turf supports.</FieldDescription>
          <div className="flex flex-wrap gap-2">
            {SPORT_TYPES.map((sport) => {
              const checked = selectedSports.includes(sport);
              return (
                <label
                  key={sport}
                  className={cn(
                    "select-none rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                    readOnly ? "pointer-events-none opacity-50" : "cursor-pointer",
                    checked
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  <input
                    type="checkbox"
                    name="sportTypes"
                    value={sport}
                    checked={checked}
                    onChange={() => toggleSport(sport)}
                    className="sr-only"
                  />
                  {sport}
                </label>
              );
            })}
          </div>
          <FieldError errors={errorList(state.fieldErrors?.sportTypes)} />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field data-invalid={!!state.fieldErrors?.pricePerHour}>
            <FieldLabel htmlFor="pricePerHour">
              Price / hour (₹)
              <RequiredMark />
            </FieldLabel>
            <Input
              id="pricePerHour"
              name="pricePerHour"
              type="number"
              min={0}
              step="1"
              defaultValue={defaultValues?.pricePerHour}
              required
            />
            <FieldError errors={errorList(state.fieldErrors?.pricePerHour)} />
          </Field>
          <Field data-invalid={!!state.fieldErrors?.slotDurationMinutes}>
            <FieldLabel htmlFor="slotDurationMinutes">
              Slot length (min)
              <RequiredMark />
            </FieldLabel>
            <Input
              id="slotDurationMinutes"
              name="slotDurationMinutes"
              type="number"
              min={15}
              step="15"
              defaultValue={defaultValues?.slotDurationMinutes ?? 60}
              required
            />
            <FieldError errors={errorList(state.fieldErrors?.slotDurationMinutes)} />
          </Field>
          <Field orientation="horizontal">
            <FieldLabel htmlFor="isActive">Active</FieldLabel>
            <Switch id="isActive" name="isActive" defaultChecked={defaultValues?.isActive ?? true} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={!!state.fieldErrors?.openTimeMinutes}>
            <FieldLabel htmlFor="openTime">
              Opens at
              <RequiredMark />
            </FieldLabel>
            <Input
              id="openTime"
              type="time"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              required
            />
            <input type="hidden" name="openTimeMinutes" value={timeValueToMinutes(openTime)} />
            <FieldError errors={errorList(state.fieldErrors?.openTimeMinutes)} />
          </Field>
          <Field data-invalid={!!state.fieldErrors?.closeTimeMinutes}>
            <FieldLabel htmlFor="closeTime">
              Closes at
              <RequiredMark />
            </FieldLabel>
            <Input
              id="closeTime"
              type="time"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              required
            />
            <input type="hidden" name="closeTimeMinutes" value={timeValueToMinutes(closeTime)} />
            <FieldError errors={errorList(state.fieldErrors?.closeTimeMinutes)} />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="amenitiesText">Amenities (comma-separated)</FieldLabel>
          <Input
            id="amenitiesText"
            name="amenitiesText"
            defaultValue={defaultValues?.amenities?.join(", ")}
            placeholder="Floodlights, Parking, Washroom"
          />
        </Field>

        <Field data-invalid={!!state.fieldErrors?.images}>
          <FieldLabel>Photos</FieldLabel>
          <FieldDescription>Upload photos from your device (JPG/PNG, max 5MB each).</FieldDescription>

          {keptImages.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {keptImages.map((src) => (
                <div key={src} className="relative size-20 overflow-hidden rounded-lg border border-border">
                  <Image src={src} alt="" fill sizes="80px" className="object-cover" />
                  <input type="hidden" name="existingImages" value={src} />
                  <button
                    type="button"
                    onClick={() => removeKeptImage(src)}
                    className="absolute top-0.5 right-0.5 cursor-pointer rounded-full bg-background/90 p-0.5 text-foreground ring-1 ring-foreground/10 hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remove photo"
                  >
                    <XIcon className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            id="newImages"
            name="newImages"
            type="file"
            accept="image/*"
            multiple
            ref={fileInputRef}
            onChange={handleFilesSelected}
            className="sr-only"
          />
          <label
            htmlFor="newImages"
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input bg-muted/30 px-4 py-8 text-center transition-colors",
              readOnly
                ? "pointer-events-none opacity-50"
                : "cursor-pointer hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <ImagePlusIcon className="size-6 text-muted-foreground" />
            <span className="text-sm font-medium">Click to upload photos</span>
            <span className="text-xs text-muted-foreground">JPG or PNG, up to 5MB each</span>
          </label>

          {newFiles.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {newFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="relative size-20 overflow-hidden rounded-lg border border-border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="size-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewFile(index)}
                    className="absolute top-0.5 right-0.5 cursor-pointer rounded-full bg-background/90 p-0.5 text-foreground ring-1 ring-foreground/10 hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remove selected photo"
                  >
                    <XIcon className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <FieldError errors={errorList(state.fieldErrors?.images)} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="lat">Latitude (optional)</FieldLabel>
            <Input
              id="lat"
              name="lat"
              type="number"
              step="any"
              defaultValue={defaultValues?.lat ?? undefined}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="lng">Longitude (optional)</FieldLabel>
            <Input
              id="lng"
              name="lng"
              type="number"
              step="any"
              defaultValue={defaultValues?.lng ?? undefined}
            />
          </Field>
        </div>

        {showCommissionField && (
          <Field>
            <FieldLabel htmlFor="commissionPercent">
              Platform commission (%)
              <RequiredMark />
            </FieldLabel>
            <Input
              id="commissionPercent"
              name="commissionPercent"
              type="number"
              min={0}
              max={100}
              step="0.1"
              defaultValue={defaultValues?.commissionPercent ?? 10}
              required
            />
          </Field>
        )}
      </FieldGroup>
      </fieldset>

      {ownerSection}

      {state.error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.error}
        </p>
      )}

      {readOnly ? (
        <Button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            setReadOnly(false);
          }}
        >
          Edit
        </Button>
      ) : (
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : submitLabel}
        </Button>
      )}
    </form>
  );
}
