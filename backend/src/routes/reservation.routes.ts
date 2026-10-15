import { Router } from "express";

import {
  createReservation,
  getReservations,
  getReservationById,
  cancelReservation,
  completeReservation,
} from "../controllers/reservation.controller.js";

import {
  authenticate,
  requireRole,
} from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  getReservations
);

router.get(
  "/:id",
  getReservationById
);

router.post(
  "/",
  requireRole("CLIENT"),
  createReservation
);

router.patch(
  "/:id/cancel",
  cancelReservation
);

// Una atención completada solo puede ser registrada
// por el profesional propietario del negocio.
router.patch(
  "/:id/complete",
  requireRole("PROFESSIONAL", "SUPERADMIN"),
  completeReservation
);

export default router;