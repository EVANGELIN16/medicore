
import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();

type DepartmentInput = {
  name: string;
  head: string;
  location: string;
  staffCount: number;
  status: "Active" | "Inactive";
};

function isDepartmentInput(value: unknown): value is DepartmentInput {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.name === "string" &&
    data.name.trim().length > 0 &&
    data.name.length <= 100 &&
    typeof data.head === "string" &&
    data.head.trim().length > 0 &&
    data.head.length <= 150 &&
    typeof data.location === "string" &&
    data.location.trim().length > 0 &&
    data.location.length <= 150 &&
    typeof data.staffCount === "number" &&
    Number.isInteger(data.staffCount) &&
    data.staffCount >= 0 &&
    (data.status === "Active" || data.status === "Inactive")
  );
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

const departmentColumns = `
  id,
  name,
  head,
  location,
  staff_count AS "staffCount",
  status,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

// GET all departments
router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${departmentColumns}
       FROM departments
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch departments failed:", error);
    res.status(500).json({ message: "Unable to fetch departments" });
  }
});

// GET one department
router.get("/:id", async (req, res) => {
  const id = String(req.params.id);

  if (!isUuid(id)) {
    res.status(400).json({ message: "Invalid department ID" });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT ${departmentColumns}
       FROM departments
       WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ message: "Department not found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Fetch department failed:", error);
    res.status(500).json({ message: "Unable to fetch department" });
  }
});

// CREATE department
router.post("/", async (req, res) => {
  if (!isDepartmentInput(req.body)) {
    res.status(400).json({ message: "Invalid department details" });
    return;
  }

  const { name, head, location, staffCount, status } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO departments
       (name, head, location, staff_count, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${departmentColumns}`,
      [name.trim(), head.trim(), location.trim(), staffCount, status]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    const dbError = error as { code?: string };

    if (dbError.code === "23505") {
      res.status(409).json({ message: "Department already exists" });
      return;
    }

    console.error("Create department failed:", error);
    res.status(500).json({ message: "Unable to create department" });
  }
});

// UPDATE department
router.put("/:id", async (req, res) => {
  const id = String(req.params.id);

  if (!isUuid(id) || !isDepartmentInput(req.body)) {
    res.status(400).json({ message: "Invalid department ID or details" });
    return;
  }

  const { name, head, location, staffCount, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE departments
       SET name = $1,
           head = $2,
           location = $3,
           staff_count = $4,
           status = $5,
           updated_at = NOW()
       WHERE id = $6
       RETURNING ${departmentColumns}`,
      [name.trim(), head.trim(), location.trim(), staffCount, status, id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ message: "Department not found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    const dbError = error as { code?: string };

    if (dbError.code === "23505") {
      res.status(409).json({ message: "Department already exists" });
      return;
    }

    console.error("Update department failed:", error);
    res.status(500).json({ message: "Unable to update department" });
  }
});

// DELETE department
router.delete("/:id", async (req, res) => {
  const id = String(req.params.id);

  if (!isUuid(id)) {
    res.status(400).json({ message: "Invalid department ID" });
    return;
  }

  try {
    const result = await pool.query(
      "DELETE FROM departments WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ message: "Department not found" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    const dbError = error as { code?: string };

    if (dbError.code === "23503") {
      res.status(409).json({
        message: "Cannot delete a department with assigned doctors",
      });
      return;
    }

    console.error("Delete department failed:", error);
    res.status(500).json({ message: "Unable to delete department" });
  }
});

export default router;
