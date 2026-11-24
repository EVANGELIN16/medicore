
import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();

type DoctorInput = {
  name: string;
  specialisation: string;
  departmentId: string;
  email: string;
  phone: string;
  status: "Available" | "Unavailable";
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isDoctorInput(value: unknown): value is DoctorInput {
  if (typeof value !== "object" || value === null) return false;

  const data = value as Record<string, unknown>;

  const validText = (key: string, max: number) =>
    typeof data[key] === "string" &&
    (data[key] as string).trim().length > 0 &&
    (data[key] as string).length <= max;

  return (
    validText("name", 150) &&
    validText("specialisation", 100) &&
    typeof data.departmentId === "string" &&
    uuidPattern.test(data.departmentId) &&
    validText("email", 255) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email as string) &&
    validText("phone", 30) &&
    (data.status === "Available" ||
      data.status === "Unavailable")
  );
}

const columns = `
  d.id,
  d.name,
  d.specialisation,
  d.department_id AS "departmentId",
  dep.name AS department,
  d.email,
  d.phone,
  d.status,
  d.created_at AS "createdAt",
  d.updated_at AS "updatedAt"
`;

const fromDoctors = `
  FROM doctors d
  JOIN departments dep ON dep.id = d.department_id
`;

function handleDatabaseError(
  error: unknown,
  res: import("express").Response
) {
  const code = (error as { code?: string })?.code;

  if (code === "23505") {
    res.status(409).json({ message: "Doctor email already exists" });
    return;
  }

  if (code === "23503") {
    res.status(400).json({
      message: "Department does not exist or is referenced by appointments",
    });
    return;
  }

  console.error("Doctors database error:", error);
  res.status(500).json({ message: "Database operation failed" });
}

// GET all doctors
router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${columns} ${fromDoctors}
       ORDER BY d.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// GET one doctor
router.get("/:id", async (req, res) => {
  const id = String(req.params.id);

  if (!uuidPattern.test(id)) {
    res.status(400).json({ message: "Invalid doctor ID" });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT ${columns} ${fromDoctors}
       WHERE d.id = $1`,
      [id]
    );

    if (!result.rows.length) {
      res.status(404).json({ message: "Doctor not found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// CREATE doctor
router.post("/", async (req, res) => {
  if (!isDoctorInput(req.body)) {
    res.status(400).json({ message: "Invalid doctor details" });
    return;
  }

  const {
    name,
    specialisation,
    departmentId,
    email,
    phone,
    status,
  } = req.body as DoctorInput;

  try {
    const result = await pool.query(
      `WITH inserted AS (
        INSERT INTO doctors
          (name, specialisation, department_id, email, phone, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      )
      SELECT
        i.id, i.name, i.specialisation,
        i.department_id AS "departmentId",
        dep.name AS department,
        i.email, i.phone, i.status,
        i.created_at AS "createdAt",
        i.updated_at AS "updatedAt"
      FROM inserted i
      JOIN departments dep ON dep.id = i.department_id`,
      [
        name.trim(),
        specialisation.trim(),
        departmentId,
        email.trim().toLowerCase(),
        phone.trim(),
        status,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// UPDATE doctor
router.put("/:id", async (req, res) => {
  const id = String(req.params.id);

  if (!uuidPattern.test(id) || !isDoctorInput(req.body)) {
    res.status(400).json({ message: "Invalid doctor ID or details" });
    return;
  }

  const {
    name,
    specialisation,
    departmentId,
    email,
    phone,
    status,
  } = req.body as DoctorInput;

  try {
    const result = await pool.query(
      `WITH updated AS (
        UPDATE doctors
        SET name = $1,
            specialisation = $2,
            department_id = $3,
            email = $4,
            phone = $5,
            status = $6,
            updated_at = NOW()
        WHERE id = $7
        RETURNING *
      )
      SELECT
        u.id, u.name, u.specialisation,
        u.department_id AS "departmentId",
        dep.name AS department,
        u.email, u.phone, u.status,
        u.created_at AS "createdAt",
        u.updated_at AS "updatedAt"
      FROM updated u
      JOIN departments dep ON dep.id = u.department_id`,
      [
        name.trim(),
        specialisation.trim(),
        departmentId,
        email.trim().toLowerCase(),
        phone.trim(),
        status,
        id,
      ]
    );

    if (!result.rows.length) {
      res.status(404).json({ message: "Doctor not found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// DELETE doctor
router.delete("/:id", async (req, res) => {
  const id = String(req.params.id);

  if (!uuidPattern.test(id)) {
    res.status(400).json({ message: "Invalid doctor ID" });
    return;
  }

  try {
    const result = await pool.query(
      "DELETE FROM doctors WHERE id = $1 RETURNING id",
      [id]
    );

    if (!result.rows.length) {
      res.status(404).json({ message: "Doctor not found" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

export default router;
