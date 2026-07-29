import { CURRENCY, REGIONS, getRegion } from "@/lib/region";
import { setRegionAction } from "@/lib/region-actions";
import { cn } from "@/lib/utils";

/**
 * ₾ / $ toggle in the header. Region drives both the displayed currency and the
 * payment rail, so this is the region switcher wearing a currency's clothes.
 *
 * A plain form + server action: it works without client JavaScript, and the
 * choice is a cookie, so it survives the next visit.
 */
export async function CurrencyToggle({
  tone = "dark",
  className,
}: {
  tone?: "dark" | "light";
  className?: string;
}) {
  const current = await getRegion();

  return (
    <form
      action={setRegionAction}
      className={cn(
        "inline-flex border",
        tone === "dark" ? "border-ink-300" : "border-ink-50/40",
        className,
      )}
    >
      {REGIONS.map((region) => {
        const active = region === current;
        return (
          <button
            key={region}
            type="submit"
            name="region"
            value={region}
            aria-pressed={active}
            aria-label={CURRENCY[region].code}
            className={cn(
              "h-7 px-2.5 text-[10px] uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2",
              tone === "dark"
                ? active
                  ? "bg-ink-900 text-ink-50 focus-visible:ring-ink-900"
                  : "text-ink-700 hover:bg-ink-200/60 focus-visible:ring-ink-900"
                : active
                  ? "bg-ink-50 text-ink-900 focus-visible:ring-ink-50"
                  : "text-ink-50 hover:bg-ink-50/15 focus-visible:ring-ink-50",
            )}
          >
            {CURRENCY[region].symbol}
          </button>
        );
      })}
    </form>
  );
}
