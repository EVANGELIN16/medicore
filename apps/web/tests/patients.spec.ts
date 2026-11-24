
import {
  test,
  expect,
  type Page,
} from "@playwright/test";

const adminEmail = "admin@medicore.com";
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.skip(
  !adminPassword,
  "E2E_ADMIN_PASSWORD is required for patient tests"
);

async function login(page: Page) {
  await page.goto("/login");

  await page
    .getByLabel("Email address")
    .fill(adminEmail);

  await page
    .getByLabel("Password")
    .fill(adminPassword!);

  await page
    .getByRole("button", {
      name: "Sign In",
    })
    .click();

  await expect(page).toHaveURL(/\/dashboard$/);
}

async function openPatientsPage(page: Page) {
  await login(page);

  await page.goto("/patients");

  await expect(
    page.getByRole("heading", {
      name: "Patient Management",
    })
  ).toBeVisible();

  await expect(
    page.getByRole("table")
  ).toBeVisible();
}

test.describe("Patients Management", () => {
  test("loads the patients page", async ({ page }) => {
    await openPatientsPage(page);

    await expect(
      page.getByRole("button", {
        name: "Add Patient",
      }).first()
    ).toBeVisible();

    await expect(
      page.getByPlaceholder("Search patients")
    ).toBeVisible();
  });

  test("validates required patient fields", async ({
    page,
  }) => {
    await openPatientsPage(page);

    await page
      .getByRole("button", {
        name: "Add Patient",
      })
      .first()
      .click();

    const dialog = page.getByRole("dialog", {
      name: "Add Patient",
    });

    await expect(dialog).toBeVisible();

    await dialog
      .getByRole("button", {
        name: "Add Patient",
      })
      .click();

    await expect(
      dialog.getByText("Enter patient name")
    ).toBeVisible();

    await expect(
      dialog.getByText("Enter patient age")
    ).toBeVisible();

    await expect(
      dialog.locator("#gender_help")
    ).toContainText("Select gender");

    await expect(
      dialog.getByText("Enter phone number")
    ).toBeVisible();
  });

  test("creates, searches, edits and deletes a patient", async ({
    page,
  }) => {
    test.setTimeout(60000);

    await openPatientsPage(page);

    const uniqueId = Date.now();

    const patientName = `Playwright Patient ${uniqueId}`;
    const updatedName = `Updated Patient ${uniqueId}`;

    const search = page.getByPlaceholder("Search patients");

    let createdPatientId: string | null = null;

    try {
      // STEP 1: CREATE

      console.log("STEP 1: Opening Add Patient modal");

      await page
        .getByRole("button", {
          name: "Add Patient",
        })
        .first()
        .click();

      const addDialog = page.getByRole("dialog", {
        name: "Add Patient",
      });

      await expect(addDialog).toBeVisible();

      await addDialog
        .getByRole("textbox", {
          name: "Patient Name",
        })
        .fill(patientName);

      await addDialog
        .getByRole("spinbutton", {
          name: "Age",
        })
        .fill("25");

      console.log("STEP 1: Selecting Gender");

      await addDialog
        .getByRole("combobox", {
          name: "Gender",
        })
        .click();

      // Select the visible Ant Design option.
      // Avoid duplicate accessibility option elements.

      await page
        .locator(
          ".ant-select-dropdown:visible .ant-select-item-option"
        )
        .filter({
          hasText: /^Female$/,
        })
        .click();

      // No DOM-structure-dependent Gender assertion.
      // The form submission will validate the field.

      await addDialog
        .getByRole("textbox", {
          name: "Phone",
        })
        .fill("07123456789");

      console.log("STEP 1: Submitting patient");

      const createResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/patients") &&
          response.request().method() === "POST",
        { timeout: 10000 }
      );

      await addDialog
        .getByRole("button", {
          name: "Add Patient",
        })
        .click();

      const createResponse = await createResponsePromise;

      expect(
        createResponse.ok(),
        `Create patient failed: ${createResponse.status()}`
      ).toBeTruthy();

      const createdPatient = await createResponse.json();

      createdPatientId = createdPatient.id;

      expect(createdPatientId).toBeTruthy();

      await expect(addDialog).not.toBeVisible();

      console.log("STEP 1: Patient created");

      // STEP 2: SEARCH

      console.log("STEP 2: Searching patient");

      await search.fill(patientName);

      const patientRow = page
        .getByRole("row")
        .filter({
          has: page.getByRole("cell", {
            name: patientName,
            exact: true,
          }),
        });

      await expect(patientRow).toBeVisible();

      console.log("STEP 2: Patient found");

      // STEP 3: EDIT

      console.log("STEP 3: Editing patient");

      await patientRow
        .getByRole("button", {
          name: `Edit ${patientName}`,
        })
        .click();

      const editDialog = page.getByRole("dialog", {
        name: "Edit Patient",
      });

      await expect(editDialog).toBeVisible();

      await editDialog
        .getByRole("textbox", {
          name: "Patient Name",
        })
        .fill(updatedName);

      const updateResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes(
            `/api/patients/${createdPatientId}`
          ) &&
          ["PUT", "PATCH"].includes(
            response.request().method()
          ),
        { timeout: 10000 }
      );

      await editDialog
        .getByRole("button", {
          name: "Save Changes",
        })
        .click();

      const updateResponse = await updateResponsePromise;

      expect(
        updateResponse.ok(),
        `Update patient failed: ${updateResponse.status()}`
      ).toBeTruthy();

      await expect(editDialog).not.toBeVisible();

      console.log("STEP 3: Patient updated");

      // STEP 4: VERIFY UPDATE

      console.log("STEP 4: Verifying updated patient");

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

      console.log("STEP 4: Updated patient found");

      // STEP 5: DELETE

      console.log("STEP 5: Deleting patient");

      await updatedRow
        .getByRole("button", {
          name: `Delete ${updatedName}`,
        })
        .click();

      const deleteResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes(
            `/api/patients/${createdPatientId}`
          ) &&
          response.request().method() === "DELETE",
        { timeout: 10000 }
      );

      await page
        .getByRole("button", {
          name: "Delete",
          exact: true,
        })
        .click();

      const deleteResponse = await deleteResponsePromise;

      expect(
        deleteResponse.ok(),
        `Delete patient failed: ${deleteResponse.status()}`
      ).toBeTruthy();

      await expect(updatedRow).toHaveCount(0);

      createdPatientId = null;

      console.log("STEP 5: Patient deleted");
    } finally {
      // Attempt cleanup only for a patient that was created.
      // The request context shares browser-context cookies.

      if (createdPatientId) {
        try {
          const cleanupResponse =
            await page.context().request.delete(
              `http://localhost:5000/api/patients/${createdPatientId}`,
              {
                failOnStatusCode: false,
                timeout: 5000,
              }
            );

          if (
            !cleanupResponse.ok() &&
            cleanupResponse.status() !== 404
          ) {
            console.warn(
              `Patient cleanup failed: ${cleanupResponse.status()}`
            );
          }
        } catch (error) {
          console.warn(
            "Unable to clean up test patient:",
            error
          );
        }
      }
    }
  });

  test("search filters patient records", async ({
    page,
  }) => {
    await openPatientsPage(page);

    const search = page.getByPlaceholder(
      "Search patients"
    );

    await search.fill("NonexistentPatientXYZ987654");

    await expect(
      page.locator(".ant-empty-description")
    ).toHaveText("No data");
  });
});
