import { StarIcon } from "@/components/ui/icons";
import { formatPrice } from "@/lib/money";
import type { Region } from "@/lib/region";
import { cn } from "@/lib/utils";

const TONES = {
  ink: "bg-ink-900 text-ink-50",
  cream: "bg-brand-100 text-ink-900",
  outline: "border border-ink-300 text-ink-700",
  sold: "bg-ink-100 text-ink-500",
  sale: "bg-danger-500 text-white",
} as const;

export function Badge({
  tone = "ink",
  className,
  children,
}: {
  tone?: keyof typeof TONES;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center px-2.5 text-[10px] uppercase tracking-[0.18em]",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * A price in the active region's currency. `was` renders the struck-through
 * original next to it — the house never shows a discount without the old price.
 */
export function Price({
  amount,
  was,
  region,
  className,
}: {
  amount: number;
  was?: number | null;
  region: Region;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-baseline gap-2.5 tabular-nums", className)}>
      <span className="text-sm text-ink-900">{formatPrice(amount, region)}</span>
      {was && was > amount ? (
        <span className="text-xs text-ink-400 line-through">
          {formatPrice(was, region)}
        </span>
      ) : null}
    </span>
  );
}

/** Five stars, filled to the rounded average. Gold, the one coloured mark. */
export function Rating({
  value,
  count,
  className,
}: {
  value: number;
  count?: number;
  className?: string;
}) {
  const filled = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-2 text-[11px] text-ink-600", className)}>
      <span className="flex gap-0.5" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <StarIcon
            key={i}
            className={cn("h-3 w-3", i < filled ? "text-brand-500" : "text-ink-300")}
          />
        ))}
      </span>
      <span className="tabular-nums">{value.toFixed(1)}</span>
      {count !== undefined ? (
        <>
          <span className="text-ink-300">·</span>
          <span className="tabular-nums">{count}</span>
        </>
      ) : null}
    </span>
  );
}
