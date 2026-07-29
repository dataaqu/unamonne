"use client";

import { useState } from "react";

import { CheckIcon, CopyIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Copy-to-clipboard, used for the order number and the article permalink. The
 * text is always visible next to it, so the button failing (or never hydrating)
 * costs nothing — the value can still be selected by hand.
 */
export function CopyButton({
  value,
  label,
  copiedLabel,
  className,
}: {
  value: string;
  label: string;
  copiedLabel: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard access can be refused; the value is on screen anyway.
        }
      }}
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-ink-500 transition-colors hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900",
        className,
      )}
    >
      {copied ? (
        <CheckIcon className="h-3.5 w-3.5" />
      ) : (
        <CopyIcon className="h-3.5 w-3.5" />
      )}
      {copied ? copiedLabel : label}
    </button>
  );
}
