import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { submitReview, getReviews } from "../controllers/review.controller";

const router = Router();

// GET /api/reviews is public
router.get("/", getReviews);

// POST /api/reviews requires authentication
router.post("/", authenticate, submitReview);

export default router;
