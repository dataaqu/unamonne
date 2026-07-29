import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type BackInStockEmailProps = {
  locale: "ka" | "en";
  productName: string;
  /** The size or length that came back, when the request was for one. */
  variantLabel?: string | null;
  productUrl: string;
};

const COPY = {
  en: {
    preview: "It is back",
    heading: "Back on the shelf",
    intro: "You asked us to write when this piece was available again:",
    cta: "See the piece",
    note: "We keep a small run, so it may not stay long.",
  },
  ka: {
    preview: "ისევ ხელმისაწვდომია",
    heading: "ისევ თაროზეა",
    intro: "თქვენ გვთხოვეთ შეგვეტყობინებინა, როცა ეს ნივთი კვლავ გამოჩნდებოდა:",
    cta: "ნივთის ნახვა",
    note: "სერია მცირეა, ამიტომ შესაძლოა დიდხანს არ დარჩეს.",
  },
} as const;

const main = { backgroundColor: "#f6f3f3", fontFamily: "sans-serif" };
const container = { margin: "0 auto", padding: "24px", maxWidth: "480px" };
const heading = { color: "#433131", fontSize: "24px", fontWeight: 400 };
const text = { color: "#584746", fontSize: "14px", lineHeight: "22px" };
const piece = {
  display: "inline-block",
  padding: "12px 16px",
  backgroundColor: "#ffffff",
  border: "1px solid #ece7e5",
  color: "#433131",
  fontSize: "15px",
};
const button = {
  backgroundColor: "#433131",
  color: "#faf9f8",
  padding: "14px 24px",
  fontSize: "11px",
  letterSpacing: "2px",
  textTransform: "uppercase" as const,
};

/**
 * Sent once, when a piece a customer asked about is back in stock. Deliberately
 * plain: one fact, one link, and an honest note that the run is small.
 */
export function BackInStockEmail({
  locale,
  productName,
  variantLabel,
  productUrl,
}: BackInStockEmailProps) {
  const t = COPY[locale];
  const label = variantLabel ? `${productName} · ${variantLabel}` : productName;

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>{t.heading}</Heading>
          <Text style={text}>{t.intro}</Text>
          <Section style={{ margin: "16px 0" }}>
            <span style={piece}>{label}</span>
          </Section>
          <Section style={{ margin: "24px 0" }}>
            <Button href={productUrl} style={button}>
              {t.cta}
            </Button>
          </Section>
          <Text style={{ ...text, color: "#8a7b78" }}>{t.note}</Text>
        </Container>
      </Body>
    </Html>
  );
}
