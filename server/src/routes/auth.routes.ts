import { Router } from "express";
import { register, login, getMe, updateMe } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// GET /api/auth/me
router.get("/me", authenticate, getMe);

// PATCH /api/auth/me
router.patch("/me", authenticate, updateMe);

export default router;
