import { test, expect } from "@playwright/test";

test("root redirects to a locale-prefixed path", async ({ page }) => {
  // The exact locale is negotiated from Accept-Language (ka is the fallback);
  // the smoke check is that the locale-less root always gets prefixed.
  await page.goto("/");
  await expect(page).toHaveURL(/\/(ka|en)$/);
});

test("home renders the header shell and localized content", async ({ page }) => {
  await page.goto("/ka");
  await expect(page.getByRole("link", { name: "Vintage" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "მოგესალმებით Vintage-ში" }),
  ).toBeVisible();
  // Signed out → a login link is shown.
  await expect(
    page.getByRole("link", { name: "შესვლა" }).first(),
  ).toBeVisible();
});

test("language switcher navigates KA → EN", async ({ page }) => {
  await page.goto("/ka");
  await page.getByRole("link", { name: "en", exact: true }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(
    page.getByRole("heading", { name: "Welcome to Vintage" }),
  ).toBeVisible();
});

test("region switcher exposes GEL and USD options", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("button", { name: /GEL/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /USD/ })).toBeVisible();
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
