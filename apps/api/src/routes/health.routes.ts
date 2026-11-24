
import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();

router.get("/health", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database, NOW() AS server_time"
    );

    res.status(200).json({
      success: true,
      message: "PostgreSQL connected successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    res.status(503).json({
      success: false,
      message: "Database connection unavailable",
    });
  }
});

export default router;
