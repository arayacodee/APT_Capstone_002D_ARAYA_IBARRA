import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { uploadBusinessImage } from "../middleware/upload.middleware.js";
import { getSessions, updateSession, addEvidence, deleteEvidence } from "../controllers/session.controller.js";

const router = Router();
router.use(authenticate, requireRole("PROFESSIONAL", "SUPERADMIN"));
router.get("/", getSessions);
router.patch("/:id", updateSession);
router.post("/:id/evidences", uploadBusinessImage, addEvidence);
router.delete("/evidences/:id", deleteEvidence);
export default router;
