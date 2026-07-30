import { cn } from "@/lib/utils";

/**
 * The masthead every account page opens with: title on a heavy rule, one line
 * of context under it, and at most one action on the right. Shared so the four
 * pages sit at exactly the same height — the section reads as one room.
 */
export function AccountHeader({
  title,
  meta,
  action,
  className,
}: {
  title: React.ReactNode;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-6 border-b border-ink-900 pb-6",
        className,
      )}
    >
      <div>
        <h1 className="text-4xl tracking-[-0.03em]">{title}</h1>
        {meta ? <p className="mt-3 text-[13px] text-ink-600">{meta}</p> : null}
      </div>
      {action}
    </div>
  );
}
