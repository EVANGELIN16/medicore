
import { pool } from "../db/pool.js";

async function seedTestData() {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      "Test data can only be seeded in the test environment"
    );
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (
    !databaseUrl ||
    new URL(databaseUrl).pathname !== "/medicore_test"
  ) {
    throw new Error(
      "Seeding is restricted to medicore_test database"
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Create a department.

    const department = await client.query(
      `
      INSERT INTO departments (
        name,
        head,
        location,
        staff_count,
        status
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (name)
      DO UPDATE SET status = 'Active'
      RETURNING id
      `,
      [
        "Test Cardiology",
        "Dr. Test Wilson",
        "Building A - Floor 1",
        10,
        "Active",
      ]
    );

    const departmentId = department.rows[0].id;

    console.log("Test department created");

    // 2. Create an available doctor.

    await client.query(
      `
      INSERT INTO doctors (
        name,
        specialisation,
        department_id,
        email,
        phone,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email)
      DO UPDATE SET status = 'Available'
      `,
      [
        "Dr. Test Wilson",
        "Cardiology",
        departmentId,
        "doctor@example.com",
        "07700900001",
        "Available",
      ]
    );

    console.log("Test doctor created");

    // 3. Create an active patient.

    await client.query(
      `
      INSERT INTO patients (
        name,
        age,
        gender,
        phone,
        status
      )
      SELECT $1, $2, $3, $4, $5
      WHERE NOT EXISTS (
        SELECT 1 FROM patients
        WHERE phone = $4
      )
      `,
      [
        "Test Patient",
        30,
        "Female",
        "07700900002",
        "Active",
      ]
    );

    console.log("Test patient created");

    await client.query("COMMIT");

    console.log("Test database seeded successfully");
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Test data seeding failed:", error);

    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seedTestData().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
