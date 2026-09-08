import { Router } from "express";
import { register, login, getMe, updateMe, refresh, logout, changePassword, forgotPassword, resetPassword, withdrawCredits } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authRateLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

// POST /api/auth/register
router.post("/register", authRateLimiter, register);

// POST /api/auth/login
router.post("/login", authRateLimiter, login);

// GET /api/auth/refresh
router.get("/refresh", refresh);

// POST /api/auth/logout
router.post("/logout", logout);

// GET /api/auth/me
router.get("/me", authenticate, getMe);

// PATCH /api/auth/me
router.patch("/me", authenticate, updateMe);

// POST /api/auth/change-password
router.post("/change-password", authenticate, changePassword);


router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post("/withdraw", authenticate, withdrawCredits);export default router;
