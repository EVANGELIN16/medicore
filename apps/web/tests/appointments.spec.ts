
import {
  test,
  expect,
  type Page,
  type Locator,
} from "@playwright/test";
import dayjs from "dayjs";

const adminEmail = "admin@medicore.com";
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.skip(
  !adminPassword,
  "E2E_ADMIN_PASSWORD is required"
);

// Reusable Ant Design dropdown helper.
async function selectDropdownOption(
  page: Page,
  select: Locator,
  optionText?: string
): Promise<string> {
  // Ensure any previous dropdown has closed.
  await expect(
    page.locator(".ant-select-dropdown:visible")
  ).toHaveCount(0);

  await select.click({ timeout: 5000 });

  await expect(select).toHaveAttribute(
    "aria-expanded",
    "true"
  );

  const options = page.locator(
    ".ant-select-dropdown:visible .ant-select-item-option:not(.ant-select-item-option-disabled)"
  );

  const option = optionText
    ? options.filter({ hasText: new RegExp(`^${optionText}$`) })
    : options.first();

  await expect(option).toBeVisible({
    timeout: 5000,
  });

  const selectedText = (await option.innerText()).trim();

  await option.click({ timeout: 5000 });

  await expect(select).toHaveAttribute(
    "aria-expanded",
    "false"
  );

  // Wait for Ant Design's closing animation.
  await expect(
    page.locator(".ant-select-dropdown:visible")
  ).toHaveCount(0);

  return selectedText;
}

// Login and open Appointments page.
async function openAppointmentsPage(page: Page) {
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

  await page.goto("/appointments");

  await expect(
    page.getByRole("heading", {
      name: "Appointment Management",
    })
  ).toBeVisible();

  await expect(
    page.getByRole("table")
  ).toBeVisible();

  await expect(
    page.getByRole("button", {
      name: "Book Appointment",
    })
  ).toBeEnabled();
}

test.describe("Appointments Management", () => {
  // TEST 1: PAGE LOADING

  test("loads the appointments page", async ({ page }) => {
    await openAppointmentsPage(page);

    await expect(
      page.getByRole("button", {
        name: "Book Appointment",
      })
    ).toBeVisible();

    await expect(
      page.getByPlaceholder("Search appointments")
    ).toBeVisible();

    for (const column of [
      "Patient",
      "Doctor",
      "Date & Time",
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

  test("validates required appointment fields", async ({
    page,
  }) => {
    await openAppointmentsPage(page);

    await page
      .getByRole("button", {
        name: "Book Appointment",
      })
      .click();

    const dialog = page.getByRole("dialog", {
      name: "Book Appointment",
    });

    await expect(dialog).toBeVisible();

    await dialog
      .getByRole("button", {
        name: "Book Appointment",
      })
      .click();

    await expect(
      dialog.getByText("Select a patient", {
        exact: true,
      })
    ).toBeVisible();

    await expect(
      dialog.getByText("Select a doctor", {
        exact: true,
      })
    ).toBeVisible();

    await expect(
      dialog.getByText(
        "Select appointment date and time",
        {
          exact: true,
        }
      )
    ).toBeVisible();

    await expect(dialog).toBeVisible();
  });

  // TEST 3: COMPLETE CRUD WORKFLOW

  test("books, searches, updates and deletes an appointment", async ({
    page,
  }) => {
    test.setTimeout(60000);

    await openAppointmentsPage(page);

    const search = page.getByPlaceholder(
      "Search appointments"
    );

    // Generate a future appointment date.
    const uniqueId = Date.now();

    const appointmentDate = dayjs()
      .add(7 + (uniqueId % 30), "day")
      .hour(9 + (uniqueId % 8))
      .minute((uniqueId % 4) * 15)
      .second(0)
      .millisecond(0);

    const formattedDate = appointmentDate.format(
      "DD/MM/YYYY HH:mm"
    );

    let createdId: string | null = null;
    let cleanupUrl: string | null = null;

    try {
      // STEP 1: BOOK APPOINTMENT

      console.log("STEP 1: Opening booking modal");

      await page
        .getByRole("button", {
          name: "Book Appointment",
        })
        .click();

      const addDialog = page.getByRole("dialog", {
        name: "Book Appointment",
      });

      await expect(addDialog).toBeVisible();

      // Select an active patient.

      console.log("STEP 1: Selecting patient");

      const patientSelect = addDialog.getByRole(
        "combobox",
        {
          name: "Patient",
        }
      );

      const patientName = await selectDropdownOption(
        page,
        patientSelect
      );

      console.log(`Patient selected: ${patientName}`);

      // Select an available doctor.
      // The helper waits until the patient dropdown
      // has completely closed.

      console.log("STEP 1: Selecting doctor");

      const doctorSelect = addDialog.getByRole(
        "combobox",
        {
          name: "Doctor",
        }
      );

      const doctorLabel = await selectDropdownOption(
        page,
        doctorSelect
      );

      console.log(`Doctor selected: ${doctorLabel}`);

      // Enter appointment date and time.

      console.log(
        `STEP 1: Entering date: ${formattedDate}`
      );

      const dateInput = addDialog.getByRole(
        "textbox",
        {
          name: "Appointment Date & Time",
        }
      );

      await expect(dateInput).toBeVisible();

      await dateInput.click({
        timeout: 5000,
      });

      await dateInput.fill(formattedDate, {
        timeout: 5000,
      });

      await dateInput.press("Enter", {
        timeout: 5000,
      });

      await dateInput.press("Tab", {
        timeout: 5000,
      });

      await expect(dateInput).toHaveValue(
        formattedDate
      );

      console.log(
        "STEP 1: Appointment date entered"
      );

      // Status defaults to Scheduled.

      console.log(
        "STEP 1: Submitting appointment"
      );

      const [createResponse] = await Promise.all([
        page.waitForResponse(
          (response) =>
            new URL(response.url()).pathname ===
              "/api/appointments" &&
            response.request().method() === "POST",
          {
            timeout: 10000,
          }
        ),

        addDialog
          .getByRole("button", {
            name: "Book Appointment",
          })
          .click({
            timeout: 5000,
          }),
      ]);

      expect(
        createResponse.ok(),
        `Booking failed: ${createResponse.status()}`
      ).toBeTruthy();

      const created = await createResponse.json();

      createdId = created.id;

      expect(createdId).toBeTruthy();

      cleanupUrl =
        `${createResponse.url().replace(/\/$/, "")}/${createdId}`;

      await expect(addDialog).not.toBeVisible();

      console.log("STEP 1: Appointment booked");

      // STEP 2: SEARCH APPOINTMENT

      console.log("STEP 2: Searching appointment");

      const displayDate = dayjs(
        created.appointmentDate
      ).format("DD MMM YYYY, hh:mm A");

      await search.fill(displayDate);

      // Target only the newly created appointment.

      const appointmentRow = page.locator(
        `tr[data-row-key="${createdId}"]`
      );

      await expect(appointmentRow).toBeVisible();

      await expect(
        appointmentRow.getByRole("cell", {
          name: patientName,
          exact: true,
        })
      ).toBeVisible();

      await expect(
        appointmentRow.getByRole("cell", {
          name: displayDate,
          exact: true,
        })
      ).toBeVisible();

      await expect(
        appointmentRow.getByRole("cell", {
          name: "Scheduled",
          exact: true,
        })
      ).toBeVisible();

      console.log("STEP 2: Appointment found");

      // STEP 3: UPDATE APPOINTMENT

      console.log("STEP 3: Updating appointment");

      await appointmentRow
        .getByRole("button", {
          name: `Edit appointment for ${patientName}`,
        })
        .click({
          timeout: 5000,
        });

      const editDialog = page.getByRole("dialog", {
        name: "Edit Appointment",
      });

      await expect(editDialog).toBeVisible();

      // Change appointment status to Completed.

      const statusSelect = editDialog.getByRole(
        "combobox",
        {
          name: "Status",
        }
      );

      await selectDropdownOption(
        page,
        statusSelect,
        "Completed"
      );

      console.log(
        "STEP 3: Completed status selected"
      );

      const [updateResponse] = await Promise.all([
        page.waitForResponse(
          (response) =>
            new URL(response.url()).pathname ===
              `/api/appointments/${createdId}` &&
            ["PUT", "PATCH"].includes(
              response.request().method()
            ),
          {
            timeout: 10000,
          }
        ),

        editDialog
          .getByRole("button", {
            name: "Save Changes",
          })
          .click({
            timeout: 5000,
          }),
      ]);

      expect(
        updateResponse.ok(),
        `Update failed: ${updateResponse.status()}`
      ).toBeTruthy();

      await expect(editDialog).not.toBeVisible();

      console.log("STEP 3: Appointment updated");

      // STEP 4: VERIFY UPDATED STATUS

      await expect(
        appointmentRow.getByRole("cell", {
          name: "Completed",
          exact: true,
        })
      ).toBeVisible();

      console.log(
        "STEP 4: Completed status verified"
      );

      // STEP 5: DELETE APPOINTMENT

      console.log("STEP 5: Deleting appointment");

      await appointmentRow
        .getByRole("button", {
          name: `Delete appointment for ${patientName}`,
        })
        .click({
          timeout: 5000,
        });

      await expect(
        page.getByText("Delete appointment?", {
          exact: true,
        })
      ).toBeVisible();

      const [deleteResponse] = await Promise.all([
        page.waitForResponse(
          (response) =>
            new URL(response.url()).pathname ===
              `/api/appointments/${createdId}` &&
            response.request().method() === "DELETE",
          {
            timeout: 10000,
          }
        ),

        page
          .getByRole("button", {
            name: "Delete",
            exact: true,
          })
          .click({
            timeout: 5000,
          }),
      ]);

      expect(
        deleteResponse.ok(),
        `Delete failed: ${deleteResponse.status()}`
      ).toBeTruthy();

      cleanupUrl = null;

      await expect(appointmentRow).toHaveCount(0);

      console.log("STEP 5: Appointment deleted");
    } finally {
      // Clean up only the appointment created
      // by this test if an assertion fails.

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

          if (
            !response.ok() &&
            response.status() !== 404
          ) {
            console.warn(
              `Appointment cleanup failed: ${response.status()}`
            );
          } else {
            console.log(
              "Test appointment cleanup completed"
            );
          }
        } catch (error) {
          console.warn(
            "Appointment cleanup failed",
            error
          );
        }
      }
    }
  });

  // TEST 4: SEARCH FILTERING

  test("search filters appointment records", async ({
    page,
  }) => {
    await openAppointmentsPage(page);

    await page
      .getByPlaceholder("Search appointments")
      .fill("NonexistentAppointmentXYZ987654");

    await expect(
      page.locator(".ant-empty-description")
    ).toHaveText("No data");
  });
});
