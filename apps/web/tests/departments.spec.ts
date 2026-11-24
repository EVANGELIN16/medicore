
import { test, expect, type Page } from "@playwright/test";

const adminEmail = "admin@medicore.com";
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.skip(
  !adminPassword,
  "E2E_ADMIN_PASSWORD is required"
);

async function openDepartmentsPage(page: Page) {
  await page.goto("/login");

  await page.getByLabel("Email address").fill(adminEmail);
  await page.getByLabel("Password").fill(adminPassword!);

  await page
    .getByRole("button", { name: "Sign In" })
    .click();

  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/departments");

  await expect(
    page.getByRole("heading", {
      name: "Department Management",
    })
  ).toBeVisible();

  await expect(page.getByRole("table")).toBeVisible();
}

test.describe("Departments Management", () => {
  // TEST 1: PAGE LOADING

  test("loads the departments page", async ({ page }) => {
    await openDepartmentsPage(page);

    await expect(
      page.getByRole("button", {
        name: "Add Department",
      })
    ).toBeVisible();

    await expect(
      page.getByPlaceholder("Search departments")
    ).toBeVisible();

    for (const column of [
      "Department",
      "Head of Department",
      "Location",
      "Staff",
      "Status",
      "Actions",
    ]) {
      await expect(
        page.getByRole("columnheader", {
          name: column,
          exact: true,
        })
      ).toBeVisible();
    }
  });

  // TEST 2: REQUIRED FIELD VALIDATION

  test("validates required department fields", async ({
    page,
  }) => {
    await openDepartmentsPage(page);

    await page
      .getByRole("button", { name: "Add Department" })
      .click();

    const dialog = page.getByRole("dialog", {
      name: "Add Department",
    });

    await expect(dialog).toBeVisible();

    await dialog
      .getByRole("button", { name: "Add Department" })
      .click();

    await expect(
      dialog.getByText("Enter department name", {
        exact: true,
      })
    ).toBeVisible();

    await expect(
      dialog.getByText("Enter department head", {
        exact: true,
      })
    ).toBeVisible();

    await expect(
      dialog.getByText("Enter location", {
        exact: true,
      })
    ).toBeVisible();

    await expect(dialog).toBeVisible();
  });

  // TEST 3: COMPLETE CRUD WORKFLOW

  test("creates, searches, edits and deletes a department", async ({
    page,
  }) => {
    test.setTimeout(60000);

    await openDepartmentsPage(page);

    const uniqueId = Date.now();

    const departmentName =
      `Playwright Department ${uniqueId}`;

    const updatedName =
      `Updated Department ${uniqueId}`;

    const search = page.getByPlaceholder(
      "Search departments"
    );

    let createdId: string | null = null;
    let cleanupUrl: string | null = null;

    try {
      // STEP 1: CREATE DEPARTMENT

      console.log("STEP 1: Creating department");

      await page
        .getByRole("button", {
          name: "Add Department",
        })
        .click();

      const addDialog = page.getByRole("dialog", {
        name: "Add Department",
      });

      await expect(addDialog).toBeVisible();

      await addDialog
        .getByRole("textbox", {
          name: "Department Name",
        })
        .fill(departmentName);

      await addDialog
        .getByRole("textbox", {
          name: "Head of Department",
        })
        .fill("Dr. Playwright");

      await addDialog
        .getByRole("textbox", {
          name: "Location",
        })
        .fill("Building A - Floor 2");

      await addDialog
        .getByRole("spinbutton", {
          name: "Staff Count",
        })
        .fill("15");

      const [createResponse] = await Promise.all([
        page.waitForResponse(
          (response) =>
            new URL(response.url()).pathname ===
              "/api/departments" &&
            response.request().method() === "POST",
          { timeout: 10000 }
        ),

        addDialog
          .getByRole("button", {
            name: "Add Department",
          })
          .click(),
      ]);

      expect(
        createResponse.ok(),
        `Create failed: ${createResponse.status()}`
      ).toBeTruthy();

      const created = await createResponse.json();

      createdId = created.id;

      expect(createdId).toBeTruthy();

      cleanupUrl =
        `${createResponse.url().replace(/\/$/, "")}/${createdId}`;

      await expect(addDialog).not.toBeVisible();

      console.log("STEP 1: Department created");

      // STEP 2: SEARCH DEPARTMENT

      await search.fill(departmentName);

      const departmentRow = page
        .getByRole("row")
        .filter({
          has: page.getByRole("cell", {
            name: departmentName,
            exact: true,
          }),
        });

      await expect(departmentRow).toBeVisible();

      await expect(
        departmentRow.getByRole("cell", {
          name: "Dr. Playwright",
          exact: true,
        })
      ).toBeVisible();

      await expect(
        departmentRow.getByRole("cell", {
          name: "Building A - Floor 2",
          exact: true,
        })
      ).toBeVisible();

      await expect(
        departmentRow.getByRole("cell", {
          name: "15",
          exact: true,
        })
      ).toBeVisible();

      await expect(
        departmentRow.getByRole("cell", {
          name: "Active",
          exact: true,
        })
      ).toBeVisible();

      console.log("STEP 2: Department found");

      // STEP 3: EDIT DEPARTMENT

      await departmentRow
        .getByRole("button", {
          name: `Edit ${departmentName}`,
        })
        .click();

      const editDialog = page.getByRole("dialog", {
        name: "Edit Department",
      });

      await expect(editDialog).toBeVisible();

      await editDialog
        .getByRole("textbox", {
          name: "Department Name",
        })
        .fill(updatedName);

      await editDialog
        .getByRole("spinbutton", {
          name: "Staff Count",
        })
        .fill("25");

      await editDialog
        .getByRole("combobox", {
          name: "Status",
        })
        .click();

      await page
        .locator(
          ".ant-select-dropdown:visible .ant-select-item-option"
        )
        .filter({ hasText: /^Inactive$/ })
        .click();

      const [updateResponse] = await Promise.all([
        page.waitForResponse(
          (response) =>
            new URL(response.url()).pathname ===
              `/api/departments/${createdId}` &&
            ["PUT", "PATCH"].includes(
              response.request().method()
            ),
          { timeout: 10000 }
        ),

        editDialog
          .getByRole("button", {
            name: "Save Changes",
          })
          .click(),
      ]);

      expect(
        updateResponse.ok(),
        `Update failed: ${updateResponse.status()}`
      ).toBeTruthy();

      await expect(editDialog).not.toBeVisible();

      console.log("STEP 3: Department updated");

      // STEP 4: VERIFY UPDATED DEPARTMENT

      await search.fill(updatedName);

      const updatedRow = page
        .getByRole("row")
        .filter({
          has: page.getByRole("cell", {
            name: updatedName,
            exact: true,
          }),
        });

      await expect(updatedRow).toBeVisible();

      await expect(
        updatedRow.getByRole("cell", {
          name: "25",
          exact: true,
        })
      ).toBeVisible();

      await expect(
        updatedRow.getByRole("cell", {
          name: "Inactive",
          exact: true,
        })
      ).toBeVisible();

      console.log("STEP 4: Updated department verified");

      // STEP 5: DELETE DEPARTMENT

      await updatedRow
        .getByRole("button", {
          name: `Delete ${updatedName}`,
        })
        .click();

      await expect(
        page.getByText("Delete department?", {
          exact: true,
        })
      ).toBeVisible();

      const [deleteResponse] = await Promise.all([
        page.waitForResponse(
          (response) =>
            new URL(response.url()).pathname ===
              `/api/departments/${createdId}` &&
            response.request().method() === "DELETE",
          { timeout: 10000 }
        ),

        page
          .getByRole("button", {
            name: "Delete",
            exact: true,
          })
          .click(),
      ]);

      expect(
        deleteResponse.ok(),
        `Delete failed: ${deleteResponse.status()}`
      ).toBeTruthy();

      cleanupUrl = null;

      await expect(updatedRow).toHaveCount(0);

      console.log("STEP 5: Department deleted");
    } finally {
      if (cleanupUrl) {
        try {
          const response =
            await page.context().request.delete(
              cleanupUrl,
              {
                failOnStatusCode: false,
                timeout: 5000,
              }
            );

          if (!response.ok() && response.status() !== 404) {
            console.warn(
              `Department cleanup failed: ${response.status()}`
            );
          }
        } catch (error) {
          console.warn("Department cleanup failed", error);
        }
      }
    }
  });

  // TEST 4: SEARCH FILTERING

  test("search filters department records", async ({
    page,
  }) => {
    await openDepartmentsPage(page);

    await page
      .getByPlaceholder("Search departments")
      .fill("NonexistentDepartmentXYZ987654");

    await expect(
      page.locator(".ant-empty-description")
    ).toHaveText("No data");
  });
});
