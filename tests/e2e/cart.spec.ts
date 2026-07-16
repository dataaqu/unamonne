import { test, expect } from "@playwright/test";

// These cover the cart's no-database path: without Neon the catalog reads fail,
// so the cart must still render its empty state rather than erroring out.
// The add/update/remove/merge flows need real data — run them against a local
// Postgres using the wsproxy setup in docs/db-setup.md.

test("header exposes a cart link on every page", async ({ page }) => {
  await page.goto("/ka");
  await expect(page.getByRole("link", { name: /კალათა/ })).toBeVisible();
});

test("cart page renders an empty state for a new visitor", async ({ page }) => {
  await page.goto("/ka/cart");
  await expect(
    page.getByRole("heading", { name: "კალათა" }),
  ).toBeVisible();
  await expect(page.getByText("თქვენი კალათა ცარიელია.")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "შოპინგის გაგრძელება" }),
  ).toBeVisible();
});

test("empty cart shows no item-count badge", async ({ page }) => {
  await page.goto("/en/cart");
  const cartLink = page.getByRole("link", { name: /Cart/ });
  await expect(cartLink).toBeVisible();
  await expect(cartLink).toHaveAttribute("aria-label", /0 items/);
});
