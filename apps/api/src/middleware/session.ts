
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import {pool} from "../db/pool.js"
export type UserRole = "Admin" | "Doctor" | "Receptionist";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
    };
  }
}

const PgSession = connectPgSimple(session);

export function createSessionMiddleware() {
  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret) {
    throw new Error("SESSION_SECRET is missing in .env");
  }

  return session({
    store: new PgSession({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: false,
    }),

    name: "medicore.sid",

    secret: sessionSecret,

    resave: false,

    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  });
}
