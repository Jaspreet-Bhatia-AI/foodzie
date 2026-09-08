import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import * as bcrypt from "bcryptjs";

// POST /api/jobs/vacancies
export async function createVacancy(req: Request, res: Response): Promise<void> {
  try {
    const vendorId = req.user!.sub;
    const { title = "Delivery Rider", description = "", salary = "Competitive" } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ error: "Job title is required" });
      return;
    }

    const vacancy = await prisma.jobVacancy.create({
      data: {
        vendorId,
        title: title.trim(),
        description: description ? description.trim() : null,
        salary: salary ? salary.trim() : null,
      },
    });

    res.status(201).json({
      success: true,
      id: vacancy.id,
      message: "Job vacancy posted successfully",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// GET /api/jobs/vacancies
export async function getVacancies(req: Request, res: Response): Promise<void> {
  try {
    const { vendorId } = req.query;

    const vacancies = await prisma.jobVacancy.findMany({
      where: vendorId ? { vendorId: String(vendorId) } : {},
      orderBy: { createdAt: "desc" },
    });

    const formatted = await Promise.all(
      vacancies.map(async (v) => {
        const vendor = await prisma.user.findUnique({
          where: { id: v.vendorId },
          include: { university: true },
        });
        return {
          id: v.id,
          vendorId: v.vendorId,
          title: v.title,
          description: v.description,
          salary: v.salary,
          createdAt: v.createdAt,
          vendorName: vendor?.name || "Unknown",
          vendorEmail: vendor?.email || "Unknown",
          universityName: vendor?.university?.name || "General Campus",
        };
      })
    );

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// DELETE /api/jobs/vacancies/:id
export async function deleteVacancy(req: Request, res: Response): Promise<void> {
  try {
    const vendorId = req.user!.sub;
    const { id } = req.params;

    const vacancy = await prisma.jobVacancy.findUnique({
      where: { id },
    });

    if (!vacancy || vacancy.vendorId !== vendorId) {
      res.status(403).json({ error: "Unauthorized or vacancy not found" });
      return;
    }

    await prisma.jobVacancy.delete({
      where: { id },
    });

    res.json({ success: true, message: "Vacancy removed successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// POST /api/jobs/apply
export async function applyForJob(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user!.sub;
    const { vacancyId, age, city, upiId, address } = req.body;

    if (!vacancyId) {
      res.status(400).json({ error: "Vacancy ID is required" });
      return;
    }

    // Verify vacancy
    const vacancy = await prisma.jobVacancy.findUnique({
      where: { id: vacancyId },
    });

    if (!vacancy) {
      res.status(404).json({ error: "Job vacancy not found" });
      return;
    }

    const vendor = await prisma.user.findUnique({
      where: { id: vacancy.vendorId },
      select: { name: true },
    });

    // Fetch student profile
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: { university: true },
    });

    if (!student) {
      res.status(404).json({ error: "Student profile not found" });
      return;
    }

    const app = await prisma.jobApplication.create({
      data: {
        vacancyId,
        studentId,
        name: student.name,
        age: Number(age) || 18,
        city: city ? city.trim() : "",
        collegeName: student.university?.name || "General Campus",
        upiId: upiId ? upiId.trim() : "",
        address: address ? address.trim() : "",
        picUrl: student.profilePicUrl || null,
        status: "Pending",
      },
    });

    res.json({
      success: true,
      id: app.id,
      message: `Job application submitted successfully to ${vendor?.name || "Canteen"}`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// GET /api/jobs/applications
export async function getApplications(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const userRole = req.user!.role;

    if (userRole === "Vendor") {
      const vacancies = await prisma.jobVacancy.findMany({
        where: { vendorId: userId },
        select: { id: true },
      });
      const vacancyIds = vacancies.map((v) => v.id);

      const apps = await prisma.jobApplication.findMany({
        where: { vacancyId: { in: vacancyIds } },
        orderBy: { createdAt: "desc" },
      });

      const formatted = await Promise.all(
        apps.map(async (a) => {
          const vacancy = await prisma.jobVacancy.findUnique({
            where: { id: a.vacancyId },
            select: { title: true, salary: true },
          });
          const student = await prisma.user.findUnique({
            where: { id: a.studentId },
            select: { email: true, phone: true },
          });
          return {
            id: a.id,
            vacancyId: a.vacancyId,
            studentId: a.studentId,
            name: a.name,
            age: a.age,
            city: a.city,
            collegeName: a.collegeName,
            upiId: a.upiId,
            address: a.address,
            picUrl: a.picUrl,
            status: a.status,
            createdAt: a.createdAt,
            jobTitle: vacancy?.title || "Delivery Rider",
            jobSalary: vacancy?.salary || "Competitive",
            studentEmail: student?.email || "Unknown",
            studentPhone: student?.phone || "Unknown",
          };
        })
      );

      res.json(formatted);
    } else {
      const apps = await prisma.jobApplication.findMany({
        where: { studentId: userId },
        orderBy: { createdAt: "desc" },
      });

      const formatted = await Promise.all(
        apps.map(async (a) => {
          const vacancy = await prisma.jobVacancy.findUnique({
            where: { id: a.vacancyId },
            select: { title: true, salary: true, vendorId: true },
          });
          const vendor = await prisma.user.findUnique({
            where: { id: vacancy?.vendorId || "" },
            select: { name: true },
          });
          return {
            id: a.id,
            vacancyId: a.vacancyId,
            studentId: a.studentId,
            name: a.name,
            age: a.age,
            city: a.city,
            collegeName: a.collegeName,
            upiId: a.upiId,
            address: a.address,
            picUrl: a.picUrl,
            status: a.status,
            createdAt: a.createdAt,
            jobTitle: vacancy?.title || "Delivery Rider",
            jobSalary: vacancy?.salary || "Competitive",
            vendorName: vendor?.name || "Unknown",
          };
        })
      );

      res.json(formatted);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// PATCH /api/jobs/applications/:id
export async function updateApplicationStatus(req: Request, res: Response): Promise<void> {
  try {
    const vendorId = req.user!.sub;
    const { id: appId } = req.params;
    const { status } = req.body;

    if (!["Accepted", "Rejected"].includes(status)) {
      res.status(400).json({ error: "Invalid application status" });
      return;
    }

    const application = await prisma.jobApplication.findUnique({
      where: { id: appId },
    });

    if (!application) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    const vacancy = await prisma.jobVacancy.findUnique({
      where: { id: application.vacancyId },
    });

    if (!vacancy || vacancy.vendorId !== vendorId) {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    const student = await prisma.user.findUnique({
      where: { id: application.studentId },
      select: { email: true, phone: true, universityId: true },
    });

    const vendor = await prisma.user.findUnique({
      where: { id: vendorId },
      select: { name: true },
    });

    // Update status
    await prisma.jobApplication.update({
      where: { id: appId },
      data: { status },
    });

    if (status === "Accepted" && student) {
      const tempPassword = "pass_" + Math.floor(1000 + Math.random() * 9000);
      const hashedPass = await bcrypt.hash(tempPassword, 12);
      const riderEmail = `rider_${application.name.toLowerCase().replace(/\s/g, "")}${Math.floor(10 + Math.random() * 90)}@foodzie.com`;

      await prisma.user.create({
        data: {
          name: `${application.name} (Rider)`,
          email: riderEmail,
          password: hashedPass,
          phone: student.phone,
          role: "Delivery",
          universityId: student.universityId,
          employerId: vendorId,
          workStatus: "Active",
          upi: application.upiId,
        },
      });

      console.log(`📧 [Acceptance Email Log] Sent to ${student.email}`);
      console.log(`   Username: ${riderEmail} | Password: ${tempPassword}`);
    } else if (status === "Rejected" && student) {
      console.log(`📧 [Rejection Email Log] Sent to ${student.email}`);
    }

    res.json({ success: true, message: `Application status updated to ${status}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// DELETE /api/jobs/employee/:id
export async function dismissEmployee(req: Request, res: Response): Promise<void> {
  try {
    const vendorId = req.user!.sub;
    const { id: riderId } = req.params;

    const employee = await prisma.user.findUnique({
      where: { id: riderId },
    });

    if (!employee || employee.employerId !== vendorId || employee.role !== "Delivery") {
      res.status(403).json({ error: "Rider not found or not employed by this canteen" });
      return;
    }

    await prisma.user.delete({
      where: { id: riderId },
    });

    console.log(`📧 [Dismissal Email Log] Sent to ${employee.email}`);

    res.json({ success: true, message: "Employee account successfully deleted and dismissal notice sent" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// POST /api/cron/salary-check
export async function checkSalaryPeriod(req: Request, res: Response): Promise<void> {
  try {
    const day = new Date().getDate();
    if (day < 1 || day > 7) {
      res.json({ success: true, message: "Outside warning period (1st-7th)." });
      return;
    }

    const riders = await prisma.user.findMany({
      where: { role: "Delivery", employerId: { not: null } },
    });

    for (const rider of riders) {
      const employer = await prisma.user.findUnique({
        where: { id: rider.employerId! },
        select: { email: true, name: true },
      });
      if (employer) {
        console.log(`📧 [Salary warning] Alert sent to ${rider.email} and ${employer.email}`);
      }
    }

    res.json({
      success: true,
      dispatched_count: riders.length,
      message: "Salary warnings successfully logged",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
