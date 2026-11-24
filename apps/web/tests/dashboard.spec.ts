
import { test, expect } from "@playwright/test";

const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test("displays dashboard statistics after login", async ({
  page,
}) => {
  test.skip(!adminPassword, "E2E_ADMIN_PASSWORD is not set");

  await page.goto("/login");

  await page.getByLabel("Email address").fill(
    "admin@medicore.com"
  );

  await page.getByLabel("Password").fill(adminPassword!);

  await page.getByRole("button", {
    name: "Sign In",
  }).click();

  await expect(page).toHaveURL(/\/dashboard$/);

  await expect(
    page.getByRole("heading", {
      name: "Hospital Dashboard",
    })
  ).toBeVisible();

  await expect(
    page.getByText("Total Patients", { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText("Total Doctors", { exact: true })
  ).toBeVisible();

  await expect(
    page.getByText("Departments", { exact: true }).last()
  ).toBeVisible();

  await expect(
    page.getByText("Total Appointments", { exact: true })
  ).toBeVisible();
});
