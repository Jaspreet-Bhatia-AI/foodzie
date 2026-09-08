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
import {
  getEmployees,
  createEmployee,
  updateEmployeePassword,
  updateEmployeeStatus,
  getPendingCashDeposits,
  verifyCashDeposit,
} from "../controllers/vendorEmployee.controller";

const router = Router();

// All vendor routes require authentication and Vendor/Admin role
router.use(authenticate, requireRole("Vendor", "Admin", "Super Admin"));

// ─── Categories ───────────────────────────────────────────────────────────────
router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.patch("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

// ─── Food Items ───────────────────────────────────────────────────────────────
router.get("/items", getFoodItems);
router.post("/items", createFoodItem);
router.patch("/items/:id", updateFoodItem);
router.delete("/items/:id", deleteFoodItem);

// ─── Employee Management ────────────────────────────────────────────────────────
router.get("/employees", getEmployees);
router.post("/employees", createEmployee);
router.patch("/employees/:id/password", updateEmployeePassword);
router.patch("/employees/:id/status", updateEmployeeStatus);

// ─── Cash Deposits Verification ───────────────────────────────────────────────
router.get("/cash-deposits", getPendingCashDeposits);
router.patch("/cash-deposits/:id/verify", verifyCashDeposit);

export default router;
