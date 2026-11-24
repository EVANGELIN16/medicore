
import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();

type PatientStatus = "Active" | "Inactive";

type PatientInput = {
  name: string;
  age: number;
  gender: string;
  phone: string;
  status: PatientStatus;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const patientColumns = `
  id,
  name,
  age,
  gender,
  phone,
  status,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

function isPatientInput(value: unknown): value is PatientInput {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const data = value as Record<string, unknown>;

  const validText = (key: string, max: number) =>
    typeof data[key] === "string" &&
    (data[key] as string).trim().length > 0 &&
    (data[key] as string).length <= max;

  return (
    validText("name", 150) &&
    typeof data.age === "number" &&
    Number.isInteger(data.age) &&
    data.age >= 0 &&
    data.age <= 130 &&
    validText("gender", 30) &&
    validText("phone", 30) &&
    (data.status === "Active" ||
      data.status === "Inactive")
  );
}

function handleDatabaseError(
  error: unknown,
  res: import("express").Response
) {
  const code = (error as { code?: string })?.code;

  if (code === "23503") {
    res.status(409).json({
      message:
        "This patient has existing appointments and cannot be deleted.",
    });
    return;
  }

  if (code === "23514") {
    res.status(400).json({
      message: "Patient data violates a database constraint.",
    });
    return;
  }

  console.error("Patients database error:", error);

  res.status(500).json({
    message: "Database operation failed",
  });
}

// GET all patients
router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${patientColumns}
       FROM patients
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// GET one patient
router.get("/:id", async (req, res) => {
  const id = String(req.params.id);

  if (!uuidPattern.test(id)) {
    res.status(400).json({
      message: "Invalid patient ID",
    });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT ${patientColumns}
       FROM patients
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        message: "Patient not found",
      });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// CREATE patient
router.post("/", async (req, res) => {
  if (!isPatientInput(req.body)) {
    res.status(400).json({
      message: "Invalid patient details",
    });
    return;
  }

  const { name, age, gender, phone, status } =
    req.body as PatientInput;

  try {
    const result = await pool.query(
      `INSERT INTO patients
        (name, age, gender, phone, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${patientColumns}`,
      [
        name.trim(),
        age,
        gender.trim(),
        phone.trim(),
        status,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// UPDATE patient
router.put("/:id", async (req, res) => {
  const id = String(req.params.id);

  if (!uuidPattern.test(id)) {
    res.status(400).json({
      message: "Invalid patient ID",
    });
    return;
  }

  if (!isPatientInput(req.body)) {
    res.status(400).json({
      message: "Invalid patient details",
    });
    return;
  }

  const { name, age, gender, phone, status } =
    req.body as PatientInput;

  try {
    const result = await pool.query(
      `UPDATE patients
       SET name = $1,
           age = $2,
           gender = $3,
           phone = $4,
           status = $5,
           updated_at = NOW()
       WHERE id = $6
       RETURNING ${patientColumns}`,
      [
        name.trim(),
        age,
        gender.trim(),
        phone.trim(),
        status,
        id,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        message: "Patient not found",
      });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// DELETE patient
router.delete("/:id", async (req, res) => {
  const id = String(req.params.id);

  if (!uuidPattern.test(id)) {
    res.status(400).json({
      message: "Invalid patient ID",
    });
    return;
  }

  try {
    const result = await pool.query(
      `DELETE FROM patients
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        message: "Patient not found",
      });
      return;
    }

    res.status(204).send();
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

export default router;
