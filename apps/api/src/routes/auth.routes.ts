
import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db/pool.js";
import type { UserRole } from "../middleware/session.js";

const router = Router();

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
};

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const result = await pool.query<UserRow>(
      `SELECT id, name, email, password_hash, role, is_active
       FROM users
       WHERE email = $1`,
      [email.trim().toLowerCase()]
    );

    const user = result.rows[0];

    if (!user || !user.is_active) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    req.session.regenerate((error) => {
      if (error) {
        return res.status(500).json({
          message: "Unable to create session",
        });
      }

      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      req.session.save((error) => {
        if (error) {
          return res.status(500).json({
            message: "Unable to save session",
          });
        }

        return res.json({
          message: "Login successful",
          user: req.session.user,
        });
      });
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Unable to login",
    });
  }
});

// GET /api/auth/me
router.get("/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      message: "Not authenticated",
    });
  }

  return res.json({
    user: req.session.user,
  });
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        message: "Unable to logout",
      });
    }

    res.clearCookie("medicore.sid", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return res.json({
      message: "Logout successful",
    });
  });
});

export default router;
