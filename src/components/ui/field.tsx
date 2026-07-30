import { ChevronIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Micro label — 10px, caps, +20% tracking. The house's smallest voice.
 *
 * `as` exists because the same voice is used for a section heading and for a
 * plain caption, and only one of those should be in the document outline.
 */
export function MicroLabel({
  as: Tag = "div",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  as?: "div" | "span" | "h2" | "h3";
}) {
  return (
    <Tag
      className={cn(
        "text-[10px] uppercase tracking-[0.2em] text-ink-500",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

/**
 * Underline input. Label above, message below, no boxes — the shop never shows
 * a bordered input.
 */
export function Field({
  label,
  hint,
  error,
  optional,
  className,
  id,
  name,
  ...props
}: React.ComponentPropsWithoutRef<"input"> & {
  label: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** `true` marks the field with the house dot; a node spells the word out. */
  optional?: boolean | React.ReactNode;
}) {
  const fieldId = id ?? name;
  return (
    <label className={cn("block", className)} htmlFor={fieldId}>
      <span className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
        {label}
        {optional ? (
          <span className="ml-1.5 normal-case tracking-normal text-ink-400">
            {optional === true ? "·" : optional}
          </span>
        ) : null}
      </span>
      <input
        id={fieldId}
        name={name}
        aria-invalid={error ? true : undefined}
        className={cn(
          "mt-2 h-11 w-full rounded-none border-0 border-b bg-transparent px-0 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-0",
          error
            ? "border-danger-500 focus:border-danger-600"
            : "border-ink-300 focus:border-ink-900",
        )}
        {...props}
      />
      {error ? (
        <span className="mt-1.5 block text-xs text-danger-600">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-ink-500">{hint}</span>
      ) : null}
    </label>
  );
}

/** Underline select, with the house chevron pinned to the baseline. */
export function SelectField({
  label,
  hint,
  error,
  className,
  id,
  name,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"select"> & {
  label: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
}) {
  const fieldId = id ?? name;
  return (
    <label className={cn("block", className)} htmlFor={fieldId}>
      <span className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
        {label}
      </span>
      <div className="relative mt-2">
        <select
          id={fieldId}
          name={name}
          className={cn(
            "h-11 w-full appearance-none rounded-none border-0 border-b bg-transparent px-0 pr-6 text-sm text-ink-900 focus:outline-none",
            error
              ? "border-danger-500 focus:border-danger-600"
              : "border-ink-300 focus:border-ink-900",
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronIcon className="pointer-events-none absolute right-0 top-3.5 h-4 w-4 text-ink-500" />
      </div>
      {error ? (
        <span className="mt-1.5 block text-xs text-danger-600">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-ink-500">{hint}</span>
      ) : null}
    </label>
  );
}

/** Bordered textarea — the one place the house allows a box. */
export function TextareaField({
  label,
  hint,
  className,
  id,
  name,
  ...props
}: React.ComponentPropsWithoutRef<"textarea"> & {
  label: string;
  hint?: React.ReactNode;
}) {
  const fieldId = id ?? name;
  return (
    <label className={cn("block", className)} htmlFor={fieldId}>
      <span className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
        {label}
      </span>
      <textarea
        id={fieldId}
        name={name}
        className="mt-2 w-full resize-none rounded-none border border-ink-300 bg-transparent p-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none"
        {...props}
      />
      {hint ? (
        <span className="mt-1.5 block text-xs text-ink-500">{hint}</span>
      ) : null}
    </label>
  );
}

/**
 * Square checkbox styled as the house's tick. Rendered as a real
 * `input[type=checkbox]` so it posts inside a plain form without JavaScript.
 */
export function CheckField({
  label,
  className,
  id,
  name,
  ...props
}: React.ComponentPropsWithoutRef<"input"> & { label: React.ReactNode }) {
  const fieldId = id ?? name;
  return (
    <label
      htmlFor={fieldId}
      className={cn("group flex cursor-pointer items-center gap-3", className)}
    >
      <span className="relative flex h-4 w-4 shrink-0 items-center justify-center border border-ink-400 transition-colors has-checked:border-ink-900 has-checked:bg-ink-900">
        <input
          id={fieldId}
          name={name}
          type="checkbox"
          className="peer absolute inset-0 cursor-pointer opacity-0"
          {...props}
        />
        <svg
          className="h-3 w-3 text-transparent peer-checked:text-ink-50"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m4.5 12.5 4.5 4.5 10.5-11" />
        </svg>
      </span>
      <span className="text-[13px] text-ink-700">{label}</span>
    </label>
  );
}
