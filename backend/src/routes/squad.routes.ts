import { Router } from "express";
import { createSquadCart, getSquadCart, addToSquadCart } from "../controllers/squad.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/create", authenticate, createSquadCart);
router.get("/:id", authenticate, getSquadCart);
router.post("/:id/add", authenticate, addToSquadCart);

export default router;
