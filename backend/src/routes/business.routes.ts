import { Router } from "express";

import {
  createBusiness,
  getBusinesses,
  getBusinessById,
  getMyBusiness,
  updateMyBusiness,
  updateBusinessAvatar,
  updateBusinessCover,
  deleteBusinessAvatar,
  deleteBusinessCover,
} from "../controllers/business.controller.js";

import {
  authenticate,
  requireRole,
} from "../middleware/auth.middleware.js";

import {
  uploadBusinessImage,
} from "../middleware/upload.middleware.js";

const router = Router();
import { getBusinessPhotos, addBusinessPhoto, deleteBusinessPhoto } from '../controllers/business-gallery.controller.js';
router.get('/:id/photos', getBusinessPhotos);
router.post('/me/photos', authenticate, requireRole('PROFESSIONAL', 'SUPERADMIN'), uploadBusinessImage, addBusinessPhoto);
router.delete('/me/photos/:id', authenticate, requireRole('PROFESSIONAL', 'SUPERADMIN'), deleteBusinessPhoto);
router.delete("/me/avatar", authenticate, requireRole("PROFESSIONAL", "SUPERADMIN"), deleteBusinessAvatar);
router.delete("/me/cover", authenticate, requireRole("PROFESSIONAL", "SUPERADMIN"), deleteBusinessCover);


// Rutas públicas
router.get(
  "/",
  getBusinesses
);


// Rutas del profesional autenticado.
// /me debe declararse antes de /:id.
router.get(
  "/me",
  authenticate,
  requireRole("PROFESSIONAL", "SUPERADMIN"),
  getMyBusiness
);

router.patch(
  "/me",
  authenticate,
  requireRole("PROFESSIONAL", "SUPERADMIN"),
  updateMyBusiness
);


// Avatar del negocio
router.put(
  "/me/avatar",
  authenticate,
  requireRole("PROFESSIONAL", "SUPERADMIN"),
  uploadBusinessImage,
  updateBusinessAvatar
);


// Portada del negocio
router.put(
  "/me/cover",
  authenticate,
  requireRole("PROFESSIONAL", "SUPERADMIN"),
  uploadBusinessImage,
  updateBusinessCover
);


// Perfil público por ID
router.get(
  "/:id",
  getBusinessById
);


// Crear perfil profesional
router.post(
  "/",
  authenticate,
  requireRole("PROFESSIONAL", "SUPERADMIN"),
  createBusiness
);

export default router;
