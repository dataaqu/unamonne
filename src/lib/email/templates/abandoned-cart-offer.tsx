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

export type AbandonedCartOfferEmailProps = {
  locale: "ka" | "en";
  offerCode: string;
  cartUrl: string;
};

const COPY = {
  en: {
    preview: "You left something in your cart",
    heading: "Still thinking it over?",
    intro: "Your cart is waiting. Here is a code for your next order:",
    codeLabel: "Your code",
    cta: "Return to your cart",
  },
  ka: {
    preview: "თქვენს კალათაში დარჩა ნივთი",
    heading: "ჯერ კიდევ ფიქრობთ?",
    intro: "თქვენი კალათა გელოდებათ. აი, კოდი შემდეგი შეკვეთისთვის:",
    codeLabel: "თქვენი კოდი",
    cta: "კალათაში დაბრუნება",
  },
} as const;

const main = { backgroundColor: "#ffffff", fontFamily: "sans-serif" };
const container = { margin: "0 auto", padding: "24px", maxWidth: "480px" };
const code = {
  display: "inline-block",
  padding: "8px 16px",
  border: "1px dashed #9ca3af",
  borderRadius: "8px",
  fontSize: "20px",
  fontWeight: 700,
  letterSpacing: "2px",
};
const button = {
  backgroundColor: "#111827",
  color: "#ffffff",
  borderRadius: "8px",
  padding: "12px 20px",
  fontSize: "14px",
};

export function AbandonedCartOfferEmail({
  locale,
  offerCode,
  cartUrl,
}: AbandonedCartOfferEmailProps) {
  const t = COPY[locale];

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading as="h1">{t.heading}</Heading>
          <Text>{t.intro}</Text>

          <Section style={{ textAlign: "center", margin: "24px 0" }}>
            <Text style={{ color: "#6b7280", fontSize: "12px", margin: "0 0 8px" }}>
              {t.codeLabel}
            </Text>
            <span style={code}>{offerCode}</span>
          </Section>

          <Section style={{ textAlign: "center" }}>
            <Button href={cartUrl} style={button}>
              {t.cta}
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default AbandonedCartOfferEmail;
