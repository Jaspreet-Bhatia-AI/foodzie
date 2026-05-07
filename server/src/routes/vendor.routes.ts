import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";
import {
  getFoodItems,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
} from "../controllers/foodItem.controller";

const router = Router();

// All vendor routes require authentication and Vendor role
router.use(authenticate, requireRole("Vendor"));

// ─── Categories ───────────────────────────────────────────────────────────────
// GET    /api/vendor/categories
// POST   /api/vendor/categories
// PATCH  /api/vendor/categories/:id
// DELETE /api/vendor/categories/:id
router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.patch("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

// ─── Food Items ───────────────────────────────────────────────────────────────
// GET    /api/vendor/items
// POST   /api/vendor/items
// PATCH  /api/vendor/items/:id
// DELETE /api/vendor/items/:id
router.get("/items", getFoodItems);
router.post("/items", createFoodItem);
router.patch("/items/:id", updateFoodItem);
router.delete("/items/:id", deleteFoodItem);

export default router;
