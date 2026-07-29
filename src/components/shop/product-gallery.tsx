"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type GalleryImage = { url: string; alt: string | null };

/**
 * Product gallery: a filmstrip on desktop, dots on a phone. The first image is
 * rendered eagerly (it is the largest thing above the fold) and the rest lazily.
 */
export function ProductGallery({
  images,
  name,
  badge,
  saveSlot,
}: {
  images: GalleryImage[];
  name: string;
  badge?: string | null;
  saveSlot?: React.ReactNode;
}) {
  const [active, setActive] = useState(0);
  const current = images[active];

  return (
    // `items-start` so the sand tile hugs the photograph. The buy panel beside
    // it is usually taller, and a stretched tile leaves a slab of empty sand
    // hanging under the image.
    <div className="group flex items-start gap-4">
      {images.length > 1 ? (
        <div className="hidden w-20 shrink-0 flex-col gap-3 sm:flex">
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`${name} — ${index + 1}`}
              aria-current={index === active}
              className={cn(
                "overflow-hidden border bg-accent-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2",
                index === active
                  ? "border-ink-900"
                  : "border-transparent hover:border-ink-300",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt=""
                loading="lazy"
                className="h-24 w-20 object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative flex-1 bg-accent-100">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt={current.alt ?? name}
            className="h-[420px] w-full object-cover sm:h-[560px] lg:h-[680px]"
          />
        ) : (
          <div className="h-[420px] w-full sm:h-[560px] lg:h-[680px]" />
        )}

        {badge ? (
          <span className="absolute left-0 top-0">
            <Badge tone="cream" className="h-7 px-3">
              {badge}
            </Badge>
          </span>
        ) : null}

        {saveSlot ? (
          <div className="absolute right-4 top-4">{saveSlot}</div>
        ) : null}

        {images.length > 1 ? (
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 sm:hidden">
            {images.map((image, index) => (
              <button
                key={image.url}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`${name} — ${index + 1}`}
                className={cn(
                  "h-1.5 w-1.5 rounded-pill",
                  index === active ? "bg-ink-900" : "bg-ink-900/30",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
