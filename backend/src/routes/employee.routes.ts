import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { createEmployee, getEmployees, updateEmployee, deleteEmployee } from "../controllers/employee.controller";

const router = Router();

// Only Vendors can manage employees
router.use(authenticate, requireRole("Vendor"));

router.post("/", createEmployee);
router.get("/", getEmployees);
router.patch("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;
