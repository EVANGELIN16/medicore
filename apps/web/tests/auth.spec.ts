
import { test, expect } from "@playwright/test";

const adminEmail = "admin@medicore.com";

const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test("redirects unauthenticated users to login", async ({
  page,
}) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login$/);
});

test("rejects incorrect login credentials", async ({
  page,
}) => {
  await page.goto("/login");

  await page.getByLabel("Email address").fill(adminEmail);

  await page.getByLabel("Password").fill("wrong-password");

  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page.getByRole("alert")).toBeVisible();

  await expect(page).toHaveURL(/\/login$/);
});

test("allows admin login and logout", async ({ page }) => {
  test.skip(!adminPassword, "E2E_ADMIN_PASSWORD is not set");

  await page.goto("/login");

  await page.getByLabel("Email address").fill(adminEmail);

  await page.getByLabel("Password").fill(adminPassword!);

  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);

  await expect(
    page.getByText("Hospital Administration")
  ).toBeVisible();

  await page.reload();

  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole("button", {
    name: /MediCore Admin/i,
  }).click();

  await page.getByText("Logout", { exact: true }).click();

  await expect(page).toHaveURL(/\/login$/);
});
