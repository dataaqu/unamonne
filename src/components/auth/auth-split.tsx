import { getTranslations } from "next-intl/server";

import { AuthLocaleLinks } from "@/components/auth/auth-locale-links";
import { BrandMark } from "@/components/layout/brand-mark";
import { Link } from "@/i18n/navigation";
import { BRAND } from "@/lib/brand";
import { getVisibleProducts } from "@/lib/shop";
import { cn } from "@/lib/utils";

/**
 * The campaign picture beside the auth forms is a real piece from the catalog,
 * not a stock photo: whatever the studio has put forward as featured is what a
 * visitor meets on the way in. If nothing is featured the panel stays empty
 * cocoa rather than showing a broken frame.
 */
async function campaignImage(): Promise<{ url: string; alt: string } | null> {
  try {
    const [product] = await getVisibleProducts({ featuredOnly: true, limit: 1 });
    const image = [...(product?.images ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    )[0];
    if (!image) return null;
    return {
      url: image.url,
      alt: image.alt ?? product?.translations[0]?.name ?? BRAND.name,
    };
  } catch {
    return null;
  }
}

/**
 * Split editorial auth: a campaign image on one side, the form on the other.
 *
 * These screens drop the shop's header and footer on purpose — signing in is a
 * single decision, and a nav bar full of other decisions is the wrong company
 * for it. "Back to shop" is the way out, and it is always there.
 */
export async function AuthSplit({
  side = "left",
  kicker,
  caption,
  children,
}: {
  /** Which side the campaign image sits on. */
  side?: "left" | "right";
  kicker: string;
  caption: string;
  children: React.ReactNode;
}) {
  const [t, image] = await Promise.all([
    getTranslations("Auth"),
    campaignImage(),
  ]);

  const campaign = (
    <div
      className={cn(
        "relative hidden bg-ink-900 lg:block",
        side === "right" && "lg:order-last",
      )}
    >
      {image ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={image.alt}
            className="h-full min-h-[820px] w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-ink-950/25" />
        </>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 p-10 text-ink-50">
        {side === "right" ? (
          <>
            <div className="text-[10px] uppercase tracking-[0.24em] text-ink-200">
              {kicker}
            </div>
            <p className="mt-5 max-w-sm text-2xl leading-[1.25] tracking-[-0.02em]">
              {caption}
            </p>
          </>
        ) : (
          <>
            <blockquote className="max-w-sm text-2xl leading-[1.25] tracking-[-0.02em]">
              {caption}
            </blockquote>
            <div className="mt-5 text-[11px] uppercase tracking-[0.2em] text-ink-200">
              {kicker}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid w-full flex-1 bg-ink-100 lg:grid-cols-2">
      {campaign}

      <div className="flex flex-col px-6 py-10 sm:px-10 lg:min-h-[820px] lg:px-16 lg:py-12">
        <div className="flex items-center justify-between gap-6">
          <BrandMark />
          <Link
            href="/"
            className="text-[11px] uppercase tracking-[0.16em] text-ink-500 transition-colors hover:text-ink-900"
          >
            {t("backToShop")}
          </Link>
        </div>

        <div className="flex flex-1 flex-col justify-center py-14">
          <div className="w-full max-w-sm">{children}</div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] text-ink-500">
          <span>
            © {new Date().getFullYear()} {BRAND.legalName}
          </span>
          <AuthLocaleLinks />
        </div>
      </div>
    </div>
  );
}
