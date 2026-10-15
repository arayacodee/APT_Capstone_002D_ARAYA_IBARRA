import express from "express";
import adminRoutes from "./routes/admin.routes.js";
import accountRoutes from './routes/account.routes.js';
import type { ErrorRequestHandler } from "express";
import sessionRoutes from "./routes/session.routes.js";
import cors from "cors";
import { prisma } from "./lib/prisma.js";
import { env } from "./config/env.js";


import businessRoutes from "./routes/business.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import availabilityRoutes from "./routes/availability.routes.js";
import reservationRoutes from "./routes/reservation.routes.js";

import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";


const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.use(
  "/api/auth",
  authRoutes
);


app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "ok",
      service: "cronos-api",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(500).json({
      status: "error",
      service: "cronos-api",
      database: "disconnected",
    });
  }
});


app.use("/api/businesses", businessRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/account', accountRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/availabilities", availabilityRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/sessions", sessionRoutes);

app.use((_req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});



const handleError: ErrorRequestHandler = (error, _req, res, _next) => {
  if (res.headersSent) return _next(error);
  if (error?.type === "entity.parse.failed") return void res.status(400).json({ error: "JSON inválido." });
  if (error?.type === "entity.too.large") return void res.status(413).json({ error: "Solicitud demasiado grande." });
  console.error("Unhandled API error:", error);
  res.status(500).json({ error: "No fue posible completar la solicitud." });
};
app.use(handleError);
export default app;
