import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import {
  createVacancy,
  getVacancies,
  deleteVacancy,
  applyForJob,
  getApplications,
  updateApplicationStatus,
  dismissEmployee,
  checkSalaryPeriod,
} from "../controllers/job.controller";

const router = Router();

// GET /api/jobs/vacancies is public
router.get("/vacancies", getVacancies);

// Admin / Cron route is public or cron-restricted (we'll make it public for endpoint compatibility)
router.post("/salary-check", checkSalaryPeriod);

// Authenticated routes below
router.use(authenticate);

// POST /api/jobs/apply is Student only
router.post("/apply", requireRole("Student"), applyForJob);

// GET /api/jobs/applications is authenticated
router.get("/applications", getApplications);

// Vendor-only routes below
router.use(requireRole("Vendor", "Admin", "Super Admin"));

// POST /api/jobs/vacancies
router.post("/vacancies", createVacancy);

// DELETE /api/jobs/vacancies/:id
router.delete("/vacancies/:id", deleteVacancy);

// PATCH /api/jobs/applications/:id
router.patch("/applications/:id", updateApplicationStatus);

// DELETE /api/jobs/employee/:id
router.delete("/employee/:id", dismissEmployee);

export default router;
