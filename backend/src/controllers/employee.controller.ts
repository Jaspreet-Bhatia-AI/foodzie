import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const SALT_ROUNDS = 12;

// Create Employee
export async function createEmployee(req: Request, res: Response): Promise<void> {
  try {
    const vendorId = req.user!.sub;
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ error: "name, email, password, and role are required" });
      return;
    }

    if (role !== "Staff" && role !== "Rider") {
      res.status(400).json({ error: "role must be Staff or Rider" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const vendor = await prisma.user.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      res.status(404).json({ error: "Vendor not found" });
      return;
    }

    const employee = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role,
        employerId: vendorId,
        universityId: vendor.universityId, // Inherit university from vendor
      },
      select: { id: true, name: true, email: true, role: true, phone: true }
    });

    res.status(201).json({ employee });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Get Employees
export async function getEmployees(req: Request, res: Response): Promise<void> {
  try {
    const vendorId = req.user!.sub;
    const employees = await prisma.user.findMany({
      where: { employerId: vendorId },
      select: { id: true, name: true, email: true, role: true, phone: true, workStatus: true }
    });
    res.json({ employees });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Update Employee
export async function updateEmployee(req: Request, res: Response): Promise<void> {
  try {
    const vendorId = req.user!.sub;
    const employeeId = req.params.id;
    const { name, phone, workStatus, role } = req.body;

    if (role && role !== "Staff" && role !== "Rider") {
      res.status(400).json({ error: "role must be Staff or Rider" });
      return;
    }

    const employee = await prisma.user.findFirst({
      where: { id: employeeId, employerId: vendorId }
    });

    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: employeeId },
      data: { name, phone, workStatus, role },
      select: { id: true, name: true, email: true, role: true, phone: true, workStatus: true }
    });

    res.json({ employee: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Delete Employee
export async function deleteEmployee(req: Request, res: Response): Promise<void> {
  try {
    const vendorId = req.user!.sub;
    const employeeId = req.params.id;

    const employee = await prisma.user.findFirst({
      where: { id: employeeId, employerId: vendorId }
    });

    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    await prisma.user.delete({ where: { id: employeeId } });

    res.json({ success: true, message: "Employee deleted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
