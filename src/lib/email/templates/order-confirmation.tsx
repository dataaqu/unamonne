import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

export type OrderConfirmationEmailProps = {
  locale: "ka" | "en";
  orderNumber: string;
  items: { name: string; quantity: number; price: string }[];
  subtotal: string;
  shipping: string;
  tax: string;
  total: string;
  shipTo: string[];
};

const COPY = {
  en: {
    preview: "Your Vintage order is confirmed",
    heading: "Thank you for your order",
    intro: (n: string) => `Order ${n} is confirmed. Here is what is on its way:`,
    subtotal: "Subtotal",
    shipping: "Shipping",
    tax: "Tax",
    total: "Total",
    shipTo: "Shipping to",
  },
  ka: {
    preview: "თქვენი Vintage შეკვეთა დადასტურდა",
    heading: "გმადლობთ შეკვეთისთვის",
    intro: (n: string) => `შეკვეთა ${n} დადასტურდა. აი, რა მოდის თქვენამდე:`,
    subtotal: "ქვეჯამი",
    shipping: "მიწოდება",
    tax: "გადასახადი",
    total: "სულ",
    shipTo: "მიწოდების მისამართი",
  },
} as const;

const main = { backgroundColor: "#ffffff", fontFamily: "sans-serif" };
const container = { margin: "0 auto", padding: "24px", maxWidth: "560px" };
const muted = { color: "#6b7280", fontSize: "14px" };

export function OrderConfirmationEmail({
  locale,
  orderNumber,
  items,
  subtotal,
  shipping,
  tax,
  total,
  shipTo,
}: OrderConfirmationEmailProps) {
  const t = COPY[locale];

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading as="h1">{t.heading}</Heading>
          <Text>{t.intro(orderNumber)}</Text>

          <Section>
            {items.map((item, i) => (
              <Row key={i}>
                <Column>
                  <Text>
                    {item.quantity}× {item.name}
                  </Text>
                </Column>
                <Column align="right">
                  <Text>{item.price}</Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Hr />

          <Row>
            <Column>
              <Text style={muted}>{t.subtotal}</Text>
            </Column>
            <Column align="right">
              <Text style={muted}>{subtotal}</Text>
            </Column>
          </Row>
          <Row>
            <Column>
              <Text style={muted}>{t.shipping}</Text>
            </Column>
            <Column align="right">
              <Text style={muted}>{shipping}</Text>
            </Column>
          </Row>
          <Row>
            <Column>
              <Text style={muted}>{t.tax}</Text>
            </Column>
            <Column align="right">
              <Text style={muted}>{tax}</Text>
            </Column>
          </Row>
          <Row>
            <Column>
              <Text>
                <strong>{t.total}</strong>
              </Text>
            </Column>
            <Column align="right">
              <Text>
                <strong>{total}</strong>
              </Text>
            </Column>
          </Row>

          <Hr />

          <Text style={muted}>{t.shipTo}</Text>
          {shipTo.map((line, i) => (
            <Text key={i} style={{ ...muted, margin: "0" }}>
              {line}
            </Text>
          ))}
        </Container>
      </Body>
    </Html>
  );
}

export default OrderConfirmationEmail;
