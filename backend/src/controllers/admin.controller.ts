import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";

const SETTINGS_FILE = path.join(__dirname, "../../data/settings.json");

function getSettings() {
  try {
    if (!fs.existsSync(path.dirname(SETTINGS_FILE))) {
      fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    }
    if (!fs.existsSync(SETTINGS_FILE)) {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ brand: "Foodzie" }, null, 2));
    }
    const data = fs.readFileSync(SETTINGS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return { brand: "Foodzie" };
  }
}

function saveSettings(settings: { brand: string }) {
  try {
    if (!fs.existsSync(path.dirname(SETTINGS_FILE))) {
      fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error("Failed to save brand settings:", err);
  }
}

export async function getAllUsers(req: Request, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      include: {
        university: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    const mappedUsers = users.map(u => ({
      ...u,
      upi: u.upi || u.vendorUpi || null
    }));
    res.json(mappedUsers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getAllOrders(req: Request, res: Response): Promise<void> {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        vendor: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            foodItem: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Get Brand Setting (Public)
export async function getBrandSetting(req: Request, res: Response): Promise<void> {
  try {
    const settings = getSettings();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// Update Brand Setting (Admin Only)
export async function updateBrandSetting(req: Request, res: Response): Promise<void> {
  try {
    const { brand } = req.body;
    if (brand !== "Foodzie" && brand !== "UniFoodz") {
      res.status(400).json({ error: "Invalid brand option. Must be 'Foodzie' or 'UniFoodz'." });
      return;
    }
    saveSettings({ brand });
    res.json({ success: true, brand });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getAdminAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const [totalUsers, totalVendors, totalOrders, aggregateRevenue] = await Promise.all([
      prisma.user.count({ where: { role: "Student" } }),
      prisma.user.count({ where: { role: "Vendor" } }),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalAmount: true } })
    ]);

    const totalRevenue = aggregateRevenue._sum.totalAmount || 0;

    // Daily Trends (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentOrders = await prisma.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, totalAmount: true }
    });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyData = Array(7).fill(0).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { 
        name: days[d.getDay()], 
        date: d.toDateString(),
        revenue: 0, 
        orders: 0 
      };
    });

    recentOrders.forEach(order => {
      const orderDate = new Date(order.createdAt).toDateString();
      const dayData = dailyData.find(d => d.date === orderDate);
      if (dayData) {
        dayData.revenue += order.totalAmount;
        dayData.orders += 1;
      }
    });

    // University Comparison
    const universities = await prisma.university.findMany({
      include: {
        users: {
          where: { role: 'Vendor' },
          include: {
            ordersReceived: {
              include: {
                items: { include: { foodItem: true } }
              }
            }
          }
        }
      }
    });

    const universityComparison = universities.map(uni => {
      let revenue = 0;
      let orders = 0;
      let profit = 0;
      const itemCounts: Record<string, number> = {};

      uni.users.forEach(vendor => {
        vendor.ordersReceived.forEach(order => {
          revenue += order.totalAmount;
          orders += 1;
          profit += order.totalAmount * 0.20; // Simulated 20% margin
          order.items.forEach(item => {
            const name = item.foodItem?.name || 'Unknown';
            itemCounts[name] = (itemCounts[name] || 0) + item.quantity;
          });
        });
      });

      let topDish = "None";
      let maxCount = 0;
      for (const [name, count] of Object.entries(itemCounts)) {
        if (count > maxCount) { maxCount = count; topDish = name; }
      }

      return {
        name: uni.name,
        revenue,
        profit,
        orders,
        topDish
      };
    }).sort((a, b) => b.revenue - a.revenue);

    res.json({
      metrics: { totalUsers, totalVendors, totalOrders, totalRevenue },
      dailyTrends: dailyData,
      universityComparison
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const {
      name,
      email,
      phone,
      role,
      universityId,
      employerId,
      workStatus,
      leaveReason,
      resignRequest,
      upi,
      password
    } = req.body;

    if (!name || !email) {
      res.status(400).json({ error: "Name and email are required" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ error: "A user with this email already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password || "password123", 12);
    const upiVal = upi ? upi : null;

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone ? phone : null,
        role: role || "Student",
        universityId: universityId ? universityId : null,
        employerId: employerId ? employerId : null,
        workStatus: workStatus || "Active",
        leaveReason: leaveReason ? leaveReason : null,
        resignRequest: Boolean(resignRequest),
        upi: upiVal,
        vendorUpi: role === "Vendor" ? upiVal : null
      },
      include: {
        university: { select: { name: true } }
      }
    });

    res.json(newUser);
  } catch (error: any) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: error.message || "Failed to create user" });
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      role,
      universityId,
      employerId,
      workStatus,
      leaveReason,
      resignRequest,
      upi,
      password
    } = req.body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone ? phone : null;
    if (role !== undefined) data.role = role;
    if (universityId !== undefined) data.universityId = universityId ? universityId : null;
    if (employerId !== undefined) data.employerId = employerId ? employerId : null;
    if (workStatus !== undefined) data.workStatus = workStatus;
    if (leaveReason !== undefined) data.leaveReason = leaveReason ? leaveReason : null;
    if (resignRequest !== undefined) data.resignRequest = Boolean(resignRequest);
    
    if (upi !== undefined) {
      const upiVal = upi ? upi : null;
      data.upi = upiVal;
      if (role === "Vendor" || (!role && data.upi)) {
        data.vendorUpi = upiVal;
      }
    }

    if (password && typeof password === "string" && password.trim() !== "") {
      data.password = await bcrypt.hash(password.trim(), 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      include: {
        university: { select: { name: true } }
      }
    });

    res.json(updatedUser);
  } catch (error: any) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: error.message || "Failed to update user" });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    await prisma.$transaction(async (tx) => {
      const orders = await tx.order.findMany({
        where: {
          OR: [
            { customerId: id },
            { vendorId: id },
            { deliveryPersonId: id }
          ]
        },
        select: { id: true }
      });
      const orderIds = orders.map(o => o.id);

      if (orderIds.length > 0) {
        await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.review.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      }

      const categories = await tx.category.findMany({ where: { vendorId: id }, select: { id: true } });
      const categoryIds = categories.map(c => c.id);
      if (categoryIds.length > 0) {
        const foodItems = await tx.foodItem.findMany({ where: { categoryId: { in: categoryIds } }, select: { id: true } });
        const foodItemIds = foodItems.map(f => f.id);
        if (foodItemIds.length > 0) {
          await tx.orderItem.deleteMany({ where: { foodItemId: { in: foodItemIds } } });
          await tx.review.deleteMany({ where: { foodItemId: { in: foodItemIds } } });
          await tx.foodItem.deleteMany({ where: { id: { in: foodItemIds } } });
        }
        await tx.category.deleteMany({ where: { vendorId: id } });
      }

      await tx.review.deleteMany({ where: { studentId: id } });

      const vacancies = await tx.jobVacancy.findMany({ where: { vendorId: id }, select: { id: true } });
      const vacancyIds = vacancies.map(v => v.id);
      if (vacancyIds.length > 0) {
        await tx.jobApplication.deleteMany({ where: { vacancyId: { in: vacancyIds } } });
        await tx.jobVacancy.deleteMany({ where: { vendorId: id } });
      }
      await tx.jobApplication.deleteMany({ where: { studentId: id } });

      await tx.cashDeposit.deleteMany({
        where: {
          OR: [
            { riderId: id },
            { vendorId: id }
          ]
        }
      });

      await tx.user.delete({ where: { id } });
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: error.message || "Failed to delete user" });
  }
}
