import { test, expect } from "@playwright/test";

test("root redirects to a locale-prefixed path", async ({ page }) => {
  // The exact locale is negotiated from Accept-Language (ka is the fallback);
  // the smoke check is that the locale-less root always gets prefixed.
  await page.goto("/");
  await expect(page).toHaveURL(/\/(ka|en)$/);
});

test("home renders the house chrome and localized content", async ({ page }) => {
  await page.goto("/ka");
  await expect(
    page.getByRole("link", { name: "Unamonne" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "შექმნილი ხელისთვის, რომელიც მას ატარებს.",
    }),
  ).toBeVisible();
  // The campaign CTA leads into the catalog.
  await expect(
    page.getByRole("link", { name: "კოლექციის ნახვა" }),
  ).toBeVisible();
});

test("language menu navigates KA → EN", async ({ page }) => {
  await page.goto("/ka");
  await page.getByRole("button", { name: "ენა" }).click();
  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(
    page.getByRole("heading", { name: "Made for the hands that wear it." }),
  ).toBeVisible();
});

test("currency toggle exposes both rails", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("button", { name: "GEL" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "USD" }).first()).toBeVisible();
});

test("shop renders its catalogue head without a database", async ({ page }) => {
  await page.goto("/en/shop");
  await expect(
    page.getByRole("heading", { name: "The catalogue" }),
  ).toBeVisible();
});

test("admin is protected — unauthenticated visitors are redirected to login", async ({
  page,
}) => {
  await page.goto("/ka/admin");
  await expect(page).toHaveURL(/\/ka\/login$/);
  // Login page rendered (CardTitle is a div, so assert on the form field).
  await expect(page.getByLabel("ელფოსტა")).toBeVisible();
});

test("login and register pages render their forms", async ({ page }) => {
  await page.goto("/en/login");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();

  await page.getByRole("link", { name: "Sign up" }).click();
  await expect(page).toHaveURL(/\/en\/register$/);
  await expect(page.getByLabel("Name")).toBeVisible();
});
