
import express from "express";
import cors from "cors";

import healthRoutes from "./routes/health.routes.js";
import databaseRoutes from "./routes/database.routes.js";
import departmentsRoutes from "./routes/departments.routes.js";
import doctorsRoutes from "./routes/doctors.routes.js";
import patientsRoutes from "./routes/patients.routes.js";
import appointmentsRoutes from "./routes/appointments.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import authRoutes from "./routes/auth.routes.js";

import { createSessionMiddleware } from "./middleware/session.js";

import {
  requireAuth,
  requireRole,
} from "./middleware/auth.middleware.js";

const app = express();

const allowedOrigins = (
  process.env.CLIENT_URL ?? "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim());

app.disable("x-powered-by");

// CORS middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// JSON middleware
app.use(express.json({ limit: "100kb" }));

// Session middleware
app.use(createSessionMiddleware());

// Root endpoint
app.get("/", (_req, res) => {
  res.json({
    name: "MediCore API",
    version: "1.0.0",
    status: "running",
  });
});

// Public routes
app.use("/api/health", healthRoutes);
app.use("/api/database", databaseRoutes);
app.use("/api/auth", authRoutes);

// Protected routes
app.use(
  "/api/departments",
  requireAuth,
  requireRole("Admin"),
  departmentsRoutes
);

app.use(
  "/api/doctors",
  requireAuth,
  requireRole("Admin"),
  doctorsRoutes
);

app.use(
  "/api/patients",
  requireAuth,
  requireRole("Admin"),
  patientsRoutes
);

app.use(
  "/api/appointments",
  requireAuth,
  requireRole("Admin"),
  appointmentsRoutes
);

app.use(
  "/api/dashboard",
  requireAuth,
  requireRole("Admin"),
  dashboardRoutes
);

export default app;
