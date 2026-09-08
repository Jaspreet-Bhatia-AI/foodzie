import { Router } from "express";
import { getUniversityMenu, getUniversities, getVendorMenu, getVendorLeaderboard, getCrossSell, getAiRecommendation } from "../controllers/menu.controller";

const router = Router();

// GET /api/menu/universities
router.get("/universities", getUniversities);

// GET /api/menu/vendor/:vendorId/leaderboard
router.get("/vendor/:vendorId/leaderboard", getVendorLeaderboard);

// GET /api/menu/vendor/:vendorId
router.get("/vendor/:vendorId", getVendorMenu);

// GET /api/menu/:universityId  — public, no auth
router.get("/:universityId", getUniversityMenu);


// POST /api/menu/vendor/:vendorId/cross-sell
router.post("/vendor/:vendorId/cross-sell", getCrossSell);

// POST /api/menu/vendor/:vendorId/ai-recommend
router.post("/vendor/:vendorId/ai-recommend", getAiRecommendation);

export default router;
