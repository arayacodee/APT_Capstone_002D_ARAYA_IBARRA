import { Router } from "express";

import {
  googleLogin,
  passwordLogin,
  register,
  adminLogin,
  getCurrentUser,
  logout
} from "../controllers/auth.controller.js";

import {
  authenticate
} from "../middleware/auth.middleware.js";

const router = Router();
import { adminLoginLimit } from '../middleware/admin-login-limit.js';
router.post('/admin', adminLoginLimit(), adminLogin);
router.post('/login', adminLoginLimit(), passwordLogin);
router.post('/register', adminLoginLimit(), register);

router.post(
  "/google",
  googleLogin
);

router.get(
  "/me",
  authenticate,
  getCurrentUser
);

router.post(
  "/logout",
  logout
);

export default router;
