import { cva, type VariantProps } from "class-variance-authority";

import { ArrowIcon, SpinnerIcon } from "@/components/ui/icons";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * The house button: uppercase, tracked, square. One primary per view.
 *
 * This is deliberately separate from `components/ui/button.tsx` (the shadcn /
 * base-ui primitive the admin panel is built on) — the storefront's button has
 * a different shape, scale and interaction language, and mixing the two would
 * make both drift.
 */
export const btnVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-none uppercase transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-ink-200 disabled:bg-ink-100 disabled:text-ink-400 aria-disabled:cursor-not-allowed aria-disabled:bg-ink-100 aria-disabled:text-ink-400",
  {
    variants: {
      variant: {
        primary: "bg-ink-900 text-ink-50 hover:bg-ink-800 active:bg-ink-950",
        outline:
          "border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-ink-50",
        cream: "bg-brand-100 text-ink-900 hover:bg-brand-200 active:bg-brand-300",
        quiet:
          "border border-ink-200 text-ink-700 hover:border-ink-900 hover:text-ink-900",
        ghost: "text-ink-700 hover:bg-ink-200/60 hover:text-ink-900",
        /** For use on the cocoa field — inverted. */
        light: "bg-ink-50 text-ink-900 hover:bg-ink-100",
      },
      size: {
        sm: "h-9 px-4 text-[11px] tracking-[0.14em]",
        md: "h-11 px-6 text-[11px] tracking-[0.18em]",
        lg: "h-14 px-9 text-xs tracking-[0.18em]",
      },
      full: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", full: false },
  },
);

type BtnVariants = VariantProps<typeof btnVariants>;

export function Btn({
  className,
  variant,
  size,
  full,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"button"> &
  BtnVariants & { loading?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(btnVariants({ variant, size, full }), className)}
      {...props}
    >
      {loading ? <SpinnerIcon className="h-3.5 w-3.5 animate-spin" /> : null}
      {children}
    </button>
  );
}

/** Same shape, rendered as a locale-aware link. */
export function BtnLink({
  className,
  variant,
  size,
  full,
  href,
  children,
  ...props
}: Omit<React.ComponentPropsWithoutRef<typeof Link>, "href"> &
  BtnVariants & { href: string }) {
  return (
    <Link
      href={href}
      className={cn(btnVariants({ variant, size, full }), className)}
      {...props}
    >
      {children}
    </Link>
  );
}

/**
 * The underlined arrow link — the house CTA. `tone="light"` is the version that
 * sits on the cocoa field.
 */
export function ArrowLink({
  href,
  tone = "dark",
  className,
  children,
  ...props
}: Omit<React.ComponentPropsWithoutRef<typeof Link>, "href"> & {
  href: string;
  tone?: "dark" | "light";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex w-fit items-center gap-5 border-b pb-1.5 text-[11px] uppercase tracking-[0.2em] transition-colors",
        tone === "dark"
          ? "border-ink-900/40 text-ink-900 hover:border-ink-900"
          : "border-ink-100/40 text-ink-100 hover:border-ink-100",
        className,
      )}
      {...props}
    >
      {children}
      <ArrowIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
    </Link>
  );
}
