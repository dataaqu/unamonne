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

export type PasswordResetEmailProps = {
  locale: "ka" | "en";
  resetUrl: string;
  /** How long the link lives, already in words ("1 hour" / "1 საათი"). */
  validFor: string;
};

const COPY = {
  en: {
    preview: "Reset your password",
    heading: "Set a new password",
    intro:
      "Someone asked to reset the password on this account. If it was you, use the link below.",
    cta: "Choose a new password",
    expiry: (validFor: string) =>
      `The link works once and expires in ${validFor}.`,
    ignore:
      "If it was not you, ignore this email — nothing has changed and the old password still works.",
  },
  ka: {
    preview: "პაროლის აღდგენა",
    heading: "დააყენეთ ახალი პაროლი",
    intro:
      "ამ ანგარიშზე პაროლის აღდგენა მოითხოვეს. თუ ეს თქვენ იყავით, გამოიყენეთ ქვემოთ მოცემული ბმული.",
    cta: "ახალი პაროლის არჩევა",
    expiry: (validFor: string) =>
      `ბმული ერთხელ მუშაობს და ${validFor}-ში ვადა გაუვა.`,
    ignore:
      "თუ ეს თქვენ არ იყავით, უბრალოდ დააიგნორეთ — არაფერი შეცვლილა და ძველი პაროლი კვლავ მუშაობს.",
  },
} as const;

const main = { backgroundColor: "#f6f3f3", fontFamily: "sans-serif" };
const container = { margin: "0 auto", padding: "24px", maxWidth: "480px" };
const heading = { color: "#433131", fontSize: "24px", fontWeight: 400 };
const text = { color: "#584746", fontSize: "14px", lineHeight: "22px" };
const button = {
  backgroundColor: "#433131",
  color: "#faf9f8",
  padding: "14px 24px",
  fontSize: "11px",
  letterSpacing: "2px",
  textTransform: "uppercase" as const,
};

/**
 * Sent when someone asks to reset a password. One link, one sentence about how
 * long it lasts, and an explicit "ignore this" for the person who did not ask.
 */
export function PasswordResetEmail({
  locale,
  resetUrl,
  validFor,
}: PasswordResetEmailProps) {
  const t = COPY[locale];

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>{t.heading}</Heading>
          <Text style={text}>{t.intro}</Text>
          <Section style={{ margin: "24px 0" }}>
            <Button href={resetUrl} style={button}>
              {t.cta}
            </Button>
          </Section>
          <Text style={text}>{t.expiry(validFor)}</Text>
          <Text style={{ ...text, color: "#8a7b78" }}>{t.ignore}</Text>
        </Container>
      </Body>
    </Html>
  );
}
