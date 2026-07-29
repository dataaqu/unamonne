import { render } from "@react-email/render";
import { describe, it, expect } from "vitest";

import { AbandonedCartOfferEmail } from "@/lib/email/templates/abandoned-cart-offer";
import { OrderConfirmationEmail } from "@/lib/email/templates/order-confirmation";

describe("OrderConfirmationEmail", () => {
  it("renders the order number, line items, and total", async () => {
    const html = await render(
      <OrderConfirmationEmail
        locale="en"
        orderNumber="ABCD1234"
        items={[{ name: "Oak chair", quantity: 2, price: "$50.00" }]}
        subtotal="$50.00"
        shipping="$5.00"
        tax="$0.00"
        total="$55.00"
        shipTo={["Nino Beridze", "12 Rustaveli Ave"]}
      />,
    );

    expect(html).toContain("ABCD1234");
    expect(html).toContain("Oak chair");
    expect(html).toContain("$55.00");
    expect(html).toContain("12 Rustaveli Ave");
  });

  it("renders Georgian copy for the ka locale", async () => {
    const html = await render(
      <OrderConfirmationEmail
        locale="ka"
        orderNumber="ABCD1234"
        items={[]}
        subtotal="₾0.00"
        shipping="₾0.00"
        tax="₾0.00"
        total="₾0.00"
        shipTo={[]}
      />,
    );
    expect(html).toContain("გმადლობთ");
  });
});

describe("AbandonedCartOfferEmail", () => {
  it("renders the offer code and the cart link", async () => {
    const html = await render(
      <AbandonedCartOfferEmail
        locale="en"
        offerCode="COMEBACK-7F3A"
        cartUrl="https://shop.test/en/cart"
      />,
    );

    expect(html).toContain("COMEBACK-7F3A");
    expect(html).toContain("https://shop.test/en/cart");
  });
});
