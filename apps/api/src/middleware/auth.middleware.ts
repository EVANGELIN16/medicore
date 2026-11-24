
import type { RequestHandler } from "express";
import type { UserRole } from "./session.js";
import { pool } from "../db/pool.js";

export const requireAuth: RequestHandler = async (
  req,
  res,
  next
) => {
  if (!req.session.user) {
    res.status(401).json({
      message: "Authentication required",
    });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT id, name, email, role
       FROM users
       WHERE id = $1 AND is_active = true`,
      [req.session.user.id]
    );

    const user = result.rows[0];

    if (!user) {
      res.status(401).json({
        message: "Account is unavailable",
      });
      return;
    }

    req.session.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);

    res.status(500).json({
      message: "Unable to verify authentication",
    });
  }
};

export function requireRole(
  ...allowedRoles: UserRole[]
): RequestHandler {
  return (req, res, next) => {
    const user = req.session.user;

    if (!user) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        message: "Access denied",
      });
      return;
    }

    next();
  };
}
