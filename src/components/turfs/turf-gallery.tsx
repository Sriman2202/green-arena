"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function TurfGallery({ images, turfName }: { images: string[]; turfName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No image available
        </div>
      </div>
    );
  }

  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < images.length - 1;

  function showPrev() {
    if (hasPrev) setActiveIndex((prev) => prev - 1);
  }

  function showNext() {
    if (hasNext) setActiveIndex((prev) => prev + 1);
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
        <Image
          src={images[activeIndex]}
          alt={`${turfName} photo ${activeIndex + 1}`}
          fill
          sizes="(min-width: 1024px) 58vw, 100vw"
          className="object-cover"
          priority
        />
        {hasPrev && (
          <button
            type="button"
            onClick={showPrev}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm ring-1 ring-foreground/10 transition-colors hover:bg-background"
          >
            <ChevronLeftIcon className="size-5" />
          </button>
        )}
        {hasNext && (
          <button
            type="button"
            onClick={showNext}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm ring-1 ring-foreground/10 transition-colors hover:bg-background"
          >
            <ChevronRightIcon className="size-5" />
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-current={index === activeIndex}
              className={cn(
                "relative size-20 shrink-0 overflow-hidden rounded-lg ring-2 transition-colors",
                index === activeIndex ? "ring-primary" : "ring-transparent hover:ring-border"
              )}
            >
              <Image
                src={src}
                alt={`${turfName} thumbnail ${index + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
