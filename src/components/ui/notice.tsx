import { CheckIcon, ChevronIcon, CloseIcon, TruckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const NOTICE = {
  success: ["border-success-500 bg-success-50", "text-success-600", CheckIcon],
  warning: ["border-warning-500 bg-warning-50", "text-warning-600", TruckIcon],
  danger: ["border-danger-500 bg-danger-50", "text-danger-600", CloseIcon],
} as const;

/** Left-ruled notice. Status colour lives on the rule and the icon, never the type. */
export function Notice({
  tone = "success",
  className,
  children,
  role,
}: {
  tone?: keyof typeof NOTICE;
  className?: string;
  children: React.ReactNode;
  role?: "status" | "alert";
}) {
  const [surface, iconTone, Icon] = NOTICE[tone];
  return (
    <div
      role={role}
      className={cn(
        "flex items-start gap-3 border-l-2 px-4 py-3 text-[13px] text-ink-800",
        surface,
        className,
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconTone)} />
      <span>{children}</span>
    </div>
  );
}

/** Dashed empty state. Always offers the next step, never just an apology. */
export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  body?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border border-dashed border-ink-300 px-6 py-16 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mx-auto flex w-fit text-ink-400">{icon}</div>
      ) : null}
      <p className="mt-4 text-[15px] text-ink-900">{title}</p>
      {body ? <p className="mt-1.5 text-[13px] text-ink-500">{body}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

/**
 * Accordion row. Built on `<details>` so it opens without JavaScript and the
 * content is in the DOM for crawlers — the FAQ copy on a product page is
 * genuine indexable content, not a widget.
 */
export function Disclosure({
  question,
  children,
  defaultOpen = false,
}: {
  question: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="group border-b border-ink-200" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-[14px] text-ink-900 marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 [&::-webkit-details-marker]:hidden">
        {question}
        <ChevronIcon className="h-4 w-4 shrink-0 text-ink-500 transition-transform duration-300 group-open:rotate-180" />
      </summary>
      <div className="pb-5 pr-8 text-[13px] leading-relaxed text-ink-600">
        {children}
      </div>
    </details>
  );
}
