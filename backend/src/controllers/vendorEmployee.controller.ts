import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import * as bcrypt from "bcryptjs";

// GET /api/vendor/employees
export async function getEmployees(req: Request, res: Response): Promise<void> {
  try {
    const vendorId = req.user!.sub;

    const employees = await prisma.user.findMany({
      where: {
        role: "Delivery",
        employerId: vendorId,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = await Promise.all(
      employees.map(async (emp) => {
        // Total completed deliveries
        const completedCount = await prisma.order.count({
          where: {
            deliveryPersonId: emp.id,
            status: "Delivered",
          },
        });

        // Active deliveries
        const activeCount = await prisma.order.count({
          where: {
            deliveryPersonId: emp.id,
            status: {
              notIn: ["Cancelled", "Delivered"],
            },
          },
        });

        return {
          id: emp.id,
          name: emp.name,
          email: emp.email,
          phone: emp.phone,
          workStatus: emp.workStatus,
          leaveReason: emp.leaveReason,
          resignRequest: emp.resignRequest,
          upi: emp.upi,
          createdAt: emp.createdAt,
          performance: {
            completedDeliveries: completedCount,
            activeDeliveries: activeCount,
          },
        };
      })
    );

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// POST /api/vendor/employees
export async function createEmployee(req: Request, res: Response): Promise<void> {
  try {
    const vendorId = req.user!.sub;
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: "name, email, and password are required" });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (existingUser) {
      res.status(409).json({ error: "A user with this email already exists" });
      return;
    }

    // Get vendor's university
    const vendor = await prisma.user.findUnique({
      where: { id: vendorId },
      select: { universityId: true },
    });

    const hashedPassword = await bcrypt.hash(password, 12);

    const employee = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        password: hashedPassword,
        phone: phone ? phone.trim() : null,
        role: "Delivery",
        universityId: vendor?.universityId || null,
        employerId: vendorId,
        workStatus: "Active",
        resignRequest: false,
      },
    });

    res.status(201).json({
      message: "Employee created successfully",
      id: employee.id,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// PATCH /api/vendor/employees/:id/password
export async function updateEmployeePassword(req: Request, res: Response): Promise<void> {
  try {
    const vendorId = req.user!.sub;
    const { id: employeeId } = req.params;
    const { password } = req.body;

    if (!password) {
      res.status(400).json({ error: "password is required" });
      return;
    }

    const employee = await prisma.user.findFirst({
      where: {
        id: employeeId,
        employerId: vendorId,
      },
    });

    if (!employee) {
      res.status(404).json({ error: "Employee not found or unauthorized" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: employeeId },
      data: { password: hashedPassword },
    });

    res.json({ message: "Employee password updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// PATCH /api/vendor/employees/:id/status
export async function updateEmployeeStatus(req: Request, res: Response): Promise<void> {
  try {
    const vendorId = req.user!.sub;
    const { id: employeeId } = req.params;
    const { workStatus, clearResign } = req.body;

    const employee = await prisma.user.findFirst({
      where: {
        id: employeeId,
        employerId: vendorId,
      },
    });

    if (!employee) {
      res.status(404).json({ error: "Employee not found or unauthorized" });
      return;
    }

    if (clearResign) {
      await prisma.user.update({
        where: { id: employeeId },
        data: { resignRequest: false },
      });
    } else if (workStatus) {
      const validStatuses = ["Active", "Break", "Leave", "Resigned"];
      if (!validStatuses.includes(workStatus)) {
        res.status(400).json({ error: "Invalid status" });
        return;
      }

      if (workStatus === "Resigned") {
        await prisma.user.update({
          where: { id: employeeId },
          data: { workStatus: "Resigned", resignRequest: false },
        });
      } else if (workStatus === "Active") {
        await prisma.user.update({
          where: { id: employeeId },
          data: { workStatus: "Active", leaveReason: null },
        });
      } else {
        await prisma.user.update({
          where: { id: employeeId },
          data: { workStatus },
        });
      }
    }

    res.json({ message: "Employee status updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// GET /api/vendor/cash-deposits
export async function getPendingCashDeposits(req: Request, res: Response): Promise<void> {
  try {
    const vendorId = req.user!.sub;

    const deposits = await prisma.cashDeposit.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
    });

    const depositsWithRiders = await Promise.all(
      deposits.map(async (d) => {
        const rider = await prisma.user.findUnique({
          where: { id: d.riderId },
          select: { name: true, email: true },
        });
        return {
          id: d.id,
          riderId: d.riderId,
          vendorId: d.vendorId,
          amount: d.amount,
          status: d.status,
          createdAt: d.createdAt,
          riderName: rider?.name || "Unknown",
          riderEmail: rider?.email || "Unknown",
        };
      })
    );

    res.json(depositsWithRiders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// PATCH /api/vendor/cash-deposits/:id/verify
export async function verifyCashDeposit(req: Request, res: Response): Promise<void> {
  try {
    const vendorId = req.user!.sub;
    const { id: depositId } = req.params;

    const deposit = await prisma.cashDeposit.findFirst({
      where: {
        id: depositId,
        vendorId,
      },
    });

    if (!deposit) {
      res.status(404).json({ error: "Deposit record not found or unauthorized" });
      return;
    }

    await prisma.cashDeposit.update({
      where: { id: depositId },
      data: { status: "Verified" },
    });

    res.json({ message: "Cash deposit verified successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
