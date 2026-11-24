
import bcrypt from "bcrypt";
import { pool } from "../db/pool.js";

async function resetAdminPassword() {
  const email = "admin@medicore.com";
  const password = process.env.ADMIN_PASSWORD;

  if (
    !password ||
    password.length < 12 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    throw new Error(
      "Password must contain at least 12 characters and no more than 72 bytes"
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `
    UPDATE users
    SET password_hash = $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE email = $2 AND role = 'Admin'
    RETURNING id, name, email, role
    `,
    [passwordHash, email]
  );

  if (result.rowCount === 0) {
    throw new Error("Admin account not found");
  }

  console.log("Admin password reset successfully");
  console.log(result.rows[0]);
}

resetAdminPassword()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
