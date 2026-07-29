import { MoonIcon } from "@/components/ui/icons";
import { Link } from "@/i18n/navigation";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: ["h-5 w-5", "text-sm tracking-[0.3em]"],
  md: ["h-6 w-6", "text-base tracking-[0.34em]"],
  lg: ["h-6 w-6", "text-lg tracking-[0.3em]"],
} as const;

/** The house mark and wordmark, linking home. */
export function BrandMark({
  size = "sm",
  className,
  asLink = true,
}: {
  size?: keyof typeof SIZES;
  className?: string;
  asLink?: boolean;
}) {
  const [icon, word] = SIZES[size];
  const content = (
    <>
      <MoonIcon className={icon} />
      <span className={cn("uppercase", word)}>{BRAND.name}</span>
    </>
  );

  if (!asLink) {
    return (
      <span className={cn("flex items-center gap-2.5", className)}>
        {content}
      </span>
    );
  }

  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      {content}
    </Link>
  );
}
