import { FooterReveal } from "@/components/layout/footer-reveal";
import { SiteFooter, type FooterVariant } from "@/components/layout/site-footer";
import {
  SiteHeader,
  type HeaderSection,
  type HeaderVariant,
} from "@/components/layout/site-header";

/**
 * Page chrome. The header comes in three shapes and the footer in two, and
 * which pair a page wants is a property of the page — the campaign hero needs
 * the header floating over it, checkout wants nothing that could distract from
 * paying — so chrome is composed per route rather than pinned in the root
 * layout.
 */
export function SiteChrome({
  header = "solid",
  footer = "full",
  section = null,
  searchQuery,
  locale,
  children,
}: {
  header?: HeaderVariant;
  footer?: FooterVariant;
  section?: HeaderSection;
  searchQuery?: string;
  locale: string;
  children: React.ReactNode;
}) {
  const nav = (
    <SiteHeader
      variant={header}
      section={section}
      searchQuery={searchQuery}
      locale={locale}
    />
  );

  return (
    <FooterReveal footer={<SiteFooter variant={footer} />}>
      {header === "transparent" ? (
        // The transparent header is positioned against the page body, not the
        // viewport, so it lands on the campaign image rather than above it.
        <div className="relative flex flex-1 flex-col">
          {nav}
          <main className="flex flex-1 flex-col">{children}</main>
        </div>
      ) : (
        <>
          {nav}
          <main className="flex flex-1 flex-col">{children}</main>
        </>
      )}
    </FooterReveal>
  );
}
