
import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();

router.get("/stats", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM patients)
          AS "totalPatients",

        (SELECT COUNT(*)::int FROM doctors)
          AS "totalDoctors",

        (SELECT COUNT(*)::int FROM departments)
          AS "totalDepartments",

        (SELECT COUNT(*)::int FROM appointments)
          AS "totalAppointments",

        (SELECT COUNT(*)::int FROM appointments
         WHERE status = 'Scheduled')
          AS "scheduledAppointments",

        (SELECT COUNT(*)::int FROM appointments
         WHERE status = 'Completed')
          AS "completedAppointments",

        (SELECT COUNT(*)::int FROM appointments
         WHERE status = 'Cancelled')
          AS "cancelledAppointments"
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Dashboard statistics error:", error);

    res.status(500).json({
      message: "Unable to load dashboard statistics",
    });
  }
});

export default router;
