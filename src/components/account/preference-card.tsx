import { cn } from "@/lib/utils";

/**
 * A preference is chosen by picking a card, not by opening a menu: the choice
 * and its consequence ("₾ GEL · Bank of Georgia") are visible at the same time.
 *
 * The shell is shared because the two switchers are built differently — region
 * posts a form to a server action, language is a pair of real anchors — and
 * only their markup should look identical.
 */
export function preferenceCardClass(selected: boolean, className?: string) {
  return cn(
    "flex w-full items-center justify-between gap-4 border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900",
    selected ? "border-ink-900 bg-white" : "border-ink-200 hover:border-ink-400",
    className,
  );
}

export function PreferenceCardBody({
  label,
  note,
  mono = false,
  selected,
}: {
  label: React.ReactNode;
  note: React.ReactNode;
  mono?: boolean;
  selected: boolean;
}) {
  return (
    <>
      <span>
        <span className="block text-[13px]">{label}</span>
        <span
          className={cn(
            "mt-1 block text-xs text-ink-500",
            mono && "font-mono",
          )}
        >
          {note}
        </span>
      </span>
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-pill border",
          selected ? "border-ink-900" : "border-ink-400",
        )}
        aria-hidden
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-pill",
            selected ? "bg-ink-900" : "bg-transparent",
          )}
        />
      </span>
    </>
  );
}
