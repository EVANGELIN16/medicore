import bcrypt from "bcrypt";
import { pool } from "../db/pool.js";

async function createAdmin() {
  try {
    const email = "admin@medicore.com";
    const password = process.env.ADMIN_PASSWORD;

    if (
      !password ||
      password.length < 12 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      throw new Error(
        "ADMIN_PASSWORD must have at least 12 characters and at most 72 UTF-8 bytes"
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, name, email, role`,
      ["MediCore Admin", email, passwordHash, "Admin"]
    );

    if (result.rowCount === 0) {
      console.log("Admin account already exists");
    } else {
      console.log("Admin account created:", result.rows[0]);
    }
  } catch (error) {
    console.error("Unable to create admin:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void createAdmin();