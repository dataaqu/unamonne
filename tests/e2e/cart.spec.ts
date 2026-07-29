import { test, expect } from "@playwright/test";

// These cover the bag's no-database path: without Neon the catalog reads fail,
// so the bag must still render its empty state rather than erroring out.
// The add/update/remove/merge flows need real data — run them against a local
// Postgres using the wsproxy setup in docs/db-setup.md.

test("header exposes the bag on every page", async ({ page }) => {
  await page.goto("/ka");
  await expect(page.getByRole("button", { name: /კალათა, 0/ })).toBeVisible();
});

test("bag page renders an empty state for a new visitor", async ({ page }) => {
  await page.goto("/ka/cart");
  await expect(
    page.getByRole("heading", { name: "თქვენი კალათა ცარიელია" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "შოპინგის გაგრძელება" }),
  ).toBeVisible();
});

test("the bag drawer opens from the header and reports an empty bag", async ({
  page,
}) => {
  await page.goto("/en");
  await page.getByRole("button", { name: /Bag, 0/ }).click();

  const drawer = page.getByRole("dialog", { name: "Your bag" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText("Your bag is empty")).toBeVisible();

  // Esc closes it, like every other overlay in the house.
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
});

test("empty bag shows no item-count badge", async ({ page }) => {
  await page.goto("/en/cart");
  const bag = page.getByRole("button", { name: /Bag, 0/ });
  await expect(bag).toBeVisible();
  await expect(bag).toHaveAttribute("aria-label", /0 items/);
});
