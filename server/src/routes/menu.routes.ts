import { Router } from "express";
import { getUniversityMenu, getUniversities, getVendorMenu } from "../controllers/menu.controller";

const router = Router();

// GET /api/menu/universities
router.get("/universities", getUniversities);

// GET /api/menu/vendor/:vendorId
router.get("/vendor/:vendorId", getVendorMenu);

// GET /api/menu/:universityId  — public, no auth
router.get("/:universityId", getUniversityMenu);

export default router;
