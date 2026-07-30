"use client";

import { useEffect } from "react";

import { CloseIcon } from "@/components/ui/icons";
import { Overlay } from "@/components/ui/overlay";
import { cn } from "@/lib/utils";

/**
 * The house dialog: a cocoa scrim, a cream panel, square corners, no animation
 * on entry. Escape and a click on the scrim both close it — the panel is a
 * detour, never a trap.
 */
export function Dialog({
  label,
  closeLabel,
  onClose,
  className,
  children,
}: {
  label: string;
  closeLabel: string;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <Overlay>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <button
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          className="absolute inset-0 bg-ink-950/40"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className={cn("relative w-full bg-ink-100 shadow-float", className)}
        >
          {children}
        </div>
      </div>
    </Overlay>
  );
}

/** Title bar with the close cross. `sticky` keeps it in view on a long form. */
export function DialogHeader({
  title,
  closeLabel,
  onClose,
  sticky = false,
}: {
  title: React.ReactNode;
  closeLabel: string;
  onClose: () => void;
  sticky?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-ink-200 px-6 py-5",
        sticky && "sticky top-0 bg-ink-100",
      )}
    >
      <span className="text-[11px] uppercase tracking-[0.2em]">{title}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className="text-ink-600 transition-colors hover:text-ink-900"
      >
        <CloseIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
