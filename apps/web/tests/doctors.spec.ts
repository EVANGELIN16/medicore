
import {
  test,
  expect,
  type Page,
} from "@playwright/test";

const adminEmail = "admin@medicore.com";
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.skip(
  !adminPassword,
  "E2E_ADMIN_PASSWORD is required for doctor tests"
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

async function openDoctorsPage(page: Page) {
  await login(page);

  await page.goto("/doctors");

  await expect(
    page.getByRole("heading", {
      name: "Doctor Management",
    })
  ).toBeVisible();

  await expect(
    page.getByRole("table")
  ).toBeVisible();

  await expect(
    page.getByRole("button", {
      name: "Add Doctor",
    })
  ).toBeEnabled();
}

test.describe("Doctors Management", () => {
  // TEST 1: PAGE LOADING

  test("loads the doctors page", async ({ page }) => {
    await openDoctorsPage(page);

    await expect(
      page.getByRole("button", {
        name: "Add Doctor",
      })
    ).toBeVisible();

    await expect(
      page.getByPlaceholder("Search doctors")
    ).toBeVisible();

    await expect(
      page.getByRole("columnheader", {
        name: "Doctor",
        exact: true,
      })
    ).toBeVisible();

    await expect(
      page.getByRole("columnheader", {
        name: "Specialisation",
      })
    ).toBeVisible();

    await expect(
      page.getByRole("columnheader", {
        name: "Department",
      })
    ).toBeVisible();

    await expect(
      page.getByRole("columnheader", {
        name: "Availability",
      })
    ).toBeVisible();
  });

  // TEST 2: REQUIRED FIELD VALIDATION

  test("validates required doctor fields", async ({
    page,
  }) => {
    await openDoctorsPage(page);

    await page
      .getByRole("button", {
        name: "Add Doctor",
      })
      .click();

    const dialog = page.getByRole("dialog", {
      name: "Add Doctor",
    });

    await expect(dialog).toBeVisible();

    await dialog
      .getByRole("button", {
        name: "Add Doctor",
      })
      .click();

    await expect(
      dialog.getByText("Enter doctor name", {
        exact: true,
      })
    ).toBeVisible();

    await expect(
      dialog.getByText("Enter specialisation", {
        exact: true,
      })
    ).toBeVisible();

    await expect(
      dialog.getByText("Select a department", {
        exact: true,
      })
    ).toBeVisible();

    await expect(
      dialog.getByText("Enter email", {
        exact: true,
      })
    ).toBeVisible();

    await expect(
      dialog.getByText("Enter phone number", {
        exact: true,
      })
    ).toBeVisible();

    await expect(dialog).toBeVisible();
  });

  // TEST 3: EMAIL VALIDATION

  test("validates invalid doctor email", async ({
    page,
  }) => {
    await openDoctorsPage(page);

    await page
      .getByRole("button", {
        name: "Add Doctor",
      })
      .click();

    const dialog = page.getByRole("dialog", {
      name: "Add Doctor",
    });

    await dialog
      .getByRole("textbox", {
        name: "Email",
      })
      .fill("invalid-email");

    await dialog
      .getByRole("button", {
        name: "Add Doctor",
      })
      .click();

    await expect(
      dialog.getByText("Enter a valid email", {
        exact: true,
      })
    ).toBeVisible();

    await expect(dialog).toBeVisible();
  });

  // TEST 4: COMPLETE CRUD WORKFLOW

  test("creates, searches, edits and deletes a doctor", async ({
    page,
  }) => {
    test.setTimeout(60000);

    await openDoctorsPage(page);

    const uniqueId = Date.now();

    const doctorName =
      `Dr. Playwright ${uniqueId}`;

    const updatedName =
      `Dr. Updated ${uniqueId}`;

    const doctorEmail =
      `doctor.${uniqueId}@example.com`;

    const specialisation = "General Medicine";

    const search = page.getByPlaceholder(
      "Search doctors"
    );

    let createdDoctorId: string | null = null;
    let createdDoctorUrl: string | null = null;

    try {
      // STEP 1: CREATE DOCTOR

      console.log("STEP 1: Opening Add Doctor modal");

      await page
        .getByRole("button", {
          name: "Add Doctor",
        })
        .click();

      const addDialog = page.getByRole("dialog", {
        name: "Add Doctor",
      });

      await expect(addDialog).toBeVisible();

      await addDialog
        .getByRole("textbox", {
          name: "Doctor Name",
        })
        .fill(doctorName);

      await addDialog
        .getByRole("textbox", {
          name: "Specialisation",
        })
        .fill(specialisation);

      // Select an existing active department.

      console.log("STEP 1: Selecting department");

      await addDialog
        .getByRole("combobox", {
          name: "Department",
        })
        .click();

      const departmentOption = page
        .locator(
          ".ant-select-dropdown:visible .ant-select-item-option"
        )
        .first();

      await expect(
        departmentOption,
        "At least one active department is required"
      ).toBeVisible();

      const departmentName = (
        await departmentOption.innerText()
      ).trim();

      await departmentOption.click();

      console.log(
        `STEP 1: Department selected: ${departmentName}`
      );

      await addDialog
        .getByRole("textbox", {
          name: "Email",
        })
        .fill(doctorEmail);

      await addDialog
        .getByRole("textbox", {
          name: "Phone",
        })
        .fill("07700900123");

      // Availability defaults to Available.
      // No additional dropdown interaction is needed.

      console.log("STEP 1: Submitting doctor");

      const [createResponse] = await Promise.all([
        page.waitForResponse(
          (response) =>
            new URL(response.url()).pathname ===
              "/api/doctors" &&
            response.request().method() === "POST",
          { timeout: 10000 }
        ),

        addDialog
          .getByRole("button", {
            name: "Add Doctor",
          })
          .click(),
      ]);

      expect(
        createResponse.ok(),
        `Create doctor failed: ${createResponse.status()}`
      ).toBeTruthy();

      const createdDoctor =
        await createResponse.json();

      createdDoctorId = createdDoctor.id;

      expect(createdDoctorId).toBeTruthy();

      createdDoctorUrl =
        `${createResponse.url().replace(/\/$/, "")}/${createdDoctorId}`;

      await expect(addDialog).not.toBeVisible();

      console.log("STEP 1: Doctor created");

      // STEP 2: SEARCH DOCTOR

      console.log("STEP 2: Searching doctor");

      await search.fill(doctorName);

      const doctorRow = page
        .getByRole("row")
        .filter({
          has: page.getByRole("cell", {
            name: doctorName,
            exact: true,
          }),
        });

      await expect(doctorRow).toBeVisible();

      await expect(
        doctorRow.getByRole("cell", {
          name: specialisation,
          exact: true,
        })
      ).toBeVisible();

      await expect(
        doctorRow.getByRole("cell", {
          name: departmentName,
          exact: true,
        })
      ).toBeVisible();

      await expect(
        doctorRow.getByRole("cell", {
          name: doctorEmail,
          exact: true,
        })
      ).toBeVisible();

      await expect(
        doctorRow.getByRole("cell", {
          name: "Available",
          exact: true,
        })
      ).toBeVisible();

      console.log("STEP 2: Doctor found");

      // STEP 3: EDIT DOCTOR

      console.log("STEP 3: Editing doctor");

      await doctorRow
        .getByRole("button", {
          name: `Edit ${doctorName}`,
        })
        .click();

      const editDialog = page.getByRole("dialog", {
        name: "Edit Doctor",
      });

      await expect(editDialog).toBeVisible();

      await editDialog
        .getByRole("textbox", {
          name: "Doctor Name",
        })
        .fill(updatedName);

      // Change availability to Unavailable.

      await editDialog
        .getByRole("combobox", {
          name: "Availability",
        })
        .click();

      await page
        .locator(
          ".ant-select-dropdown:visible .ant-select-item-option"
        )
        .filter({
          hasText: /^Unavailable$/,
        })
        .click();

      const [updateResponse] = await Promise.all([
        page.waitForResponse(
          (response) =>
            new URL(response.url()).pathname ===
              `/api/doctors/${createdDoctorId}` &&
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
        `Update doctor failed: ${updateResponse.status()}`
      ).toBeTruthy();

      await expect(editDialog).not.toBeVisible();

      console.log("STEP 3: Doctor updated");

      // STEP 4: VERIFY UPDATED DOCTOR

      console.log("STEP 4: Verifying updated doctor");

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
          name: "Unavailable",
          exact: true,
        })
      ).toBeVisible();

      console.log("STEP 4: Updated doctor verified");

      // STEP 5: DELETE DOCTOR

      console.log("STEP 5: Deleting doctor");

      await updatedRow
        .getByRole("button", {
          name: `Delete ${updatedName}`,
        })
        .click();

      await expect(
        page.getByText("Delete doctor?", {
          exact: true,
        })
      ).toBeVisible();

      const [deleteResponse] = await Promise.all([
        page.waitForResponse(
          (response) =>
            new URL(response.url()).pathname ===
              `/api/doctors/${createdDoctorId}` &&
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
        `Delete doctor failed: ${deleteResponse.status()}`
      ).toBeTruthy();

      createdDoctorId = null;
      createdDoctorUrl = null;

      await expect(updatedRow).toHaveCount(0);

      console.log("STEP 5: Doctor deleted");
    } finally {
      // Clean up only the fictional doctor created
      // by this test if an earlier operation fails.

      if (createdDoctorId && createdDoctorUrl) {
        try {
          const cleanupResponse =
            await page.context().request.delete(
              createdDoctorUrl,
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
              `Doctor cleanup failed: ${cleanupResponse.status()}`
            );
          }
        } catch (error) {
          console.warn(
            "Unable to clean up test doctor:",
            error
          );
        }
      }
    }
  });

  // TEST 5: SEARCH FILTERING

  test("search filters doctor records", async ({
    page,
  }) => {
    await openDoctorsPage(page);

    const search = page.getByPlaceholder(
      "Search doctors"
    );

    await search.fill(
      "NonexistentDoctorXYZ987654"
    );

    await expect(
      page.locator(".ant-empty-description")
    ).toHaveText("No data");
  });
});
