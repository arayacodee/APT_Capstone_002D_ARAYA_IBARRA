import { Router } from "express";

import {
  createAvailability,
  getAvailabilities,
  getAvailabilityById,
  deleteAvailability,
  getAvailableSlots,
} from "../controllers/availability.controller.js";

import {
  authenticate,
  requireRole,
} from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/",
  authenticate,
  getAvailabilities
);

router.get(
  "/slots",
  authenticate,
  requireRole("CLIENT"),
  getAvailableSlots
);

router.get(
  "/:id",
  authenticate,
  getAvailabilityById
);

router.post(
  "/",
  authenticate,
  requireRole("PROFESSIONAL", "SUPERADMIN"),
  createAvailability
);

router.delete(
  "/:id",
  authenticate,
  requireRole("PROFESSIONAL", "SUPERADMIN"),
  deleteAvailability
);


export default router;