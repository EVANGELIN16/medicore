
import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();

type AppointmentStatus =
  | "Scheduled"
  | "Completed"
  | "Cancelled";

type AppointmentInput = {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  status: AppointmentStatus;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const appointmentColumns = `
  a.id,
  a.patient_id AS "patientId",
  p.name AS "patientName",
  a.doctor_id AS "doctorId",
  d.name AS "doctorName",
  a.appointment_date AS "appointmentDate",
  a.status,
  a.created_at AS "createdAt",
  a.updated_at AS "updatedAt"
`;

const appointmentJoins = `
  FROM appointments a
  JOIN patients p ON p.id = a.patient_id
  JOIN doctors d ON d.id = a.doctor_id
`;

function isAppointmentInput(
  value: unknown
): value is AppointmentInput {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const data = value as Record<string, unknown>;

  const validDate =
    typeof data.appointmentDate === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      data.appointmentDate
    ) &&
    !Number.isNaN(Date.parse(data.appointmentDate));

  return (
    typeof data.patientId === "string" &&
    uuidPattern.test(data.patientId) &&
    typeof data.doctorId === "string" &&
    uuidPattern.test(data.doctorId) &&
    validDate &&
    (data.status === "Scheduled" ||
      data.status === "Completed" ||
      data.status === "Cancelled")
  );
}

function handleDatabaseError(
  error: unknown,
  res: import("express").Response
) {
  const code = (error as { code?: string })?.code;

  if (code === "23503") {
    res.status(400).json({
      message: "Patient or doctor does not exist",
    });
    return;
  }

  if (code === "23514") {
    res.status(400).json({
      message: "Invalid appointment status",
    });
    return;
  }

  console.error("Appointments database error:", error);

  res.status(500).json({
    message: "Database operation failed",
  });
}

async function hasDoctorConflict(
  doctorId: string,
  appointmentDate: string,
  excludeId?: string
): Promise<boolean> {
  const result = await pool.query(
    `SELECT id
     FROM appointments
     WHERE doctor_id = $1
       AND appointment_date = $2::timestamptz
       AND status = 'Scheduled'
       AND ($3::uuid IS NULL OR id <> $3::uuid)
     LIMIT 1`,
    [doctorId, appointmentDate, excludeId ?? null]
  );

  return result.rows.length > 0;
}

// GET all appointments
router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${appointmentColumns}
       ${appointmentJoins}
       ORDER BY a.appointment_date ASC`
    );

    res.json(result.rows);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// GET appointment by ID
router.get("/:id", async (req, res) => {
  const id = String(req.params.id);

  if (!uuidPattern.test(id)) {
    res.status(400).json({
      message: "Invalid appointment ID",
    });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT ${appointmentColumns}
       ${appointmentJoins}
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        message: "Appointment not found",
      });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// CREATE appointment
router.post("/", async (req, res) => {
  if (!isAppointmentInput(req.body)) {
    res.status(400).json({
      message: "Invalid appointment details",
    });
    return;
  }

  const {
    patientId,
    doctorId,
    appointmentDate,
    status,
  } = req.body as AppointmentInput;

  try {
    if (
      status === "Scheduled" &&
      (await hasDoctorConflict(doctorId, appointmentDate))
    ) {
      res.status(409).json({
        message: "Doctor already has an appointment at this time",
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO appointments
        (patient_id, doctor_id, appointment_date, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [patientId, doctorId, appointmentDate, status]
    );

    const created = await pool.query(
      `SELECT ${appointmentColumns}
       ${appointmentJoins}
       WHERE a.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json(created.rows[0]);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// UPDATE appointment
router.put("/:id", async (req, res) => {
  const id = String(req.params.id);

  if (!uuidPattern.test(id)) {
    res.status(400).json({
      message: "Invalid appointment ID",
    });
    return;
  }

  if (!isAppointmentInput(req.body)) {
    res.status(400).json({
      message: "Invalid appointment details",
    });
    return;
  }

  const {
    patientId,
    doctorId,
    appointmentDate,
    status,
  } = req.body as AppointmentInput;

  try {
    const existing = await pool.query(
      "SELECT id FROM appointments WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      res.status(404).json({
        message: "Appointment not found",
      });
      return;
    }

    if (
      status === "Scheduled" &&
      (await hasDoctorConflict(doctorId, appointmentDate, id))
    ) {
      res.status(409).json({
        message: "Doctor already has an appointment at this time",
      });
      return;
    }

    await pool.query(
      `UPDATE appointments
       SET patient_id = $1,
           doctor_id = $2,
           appointment_date = $3,
           status = $4,
           updated_at = NOW()
       WHERE id = $5`,
      [patientId, doctorId, appointmentDate, status, id]
    );

    const updated = await pool.query(
      `SELECT ${appointmentColumns}
       ${appointmentJoins}
       WHERE a.id = $1`,
      [id]
    );

    res.json(updated.rows[0]);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// DELETE appointment
router.delete("/:id", async (req, res) => {
  const id = String(req.params.id);

  if (!uuidPattern.test(id)) {
    res.status(400).json({
      message: "Invalid appointment ID",
    });
    return;
  }

  try {
    const result = await pool.query(
      `DELETE FROM appointments
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        message: "Appointment not found",
      });
      return;
    }

    res.status(204).send();
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

export default router;
