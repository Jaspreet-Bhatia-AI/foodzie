import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { getIO } from "../lib/socket";
import { redis } from "../lib/redis";

// GET /api/delivery/orders
export async function getAssignedOrders(req: Request, res: Response): Promise<void> {
  try {
    const riderId = req.user!.sub;

    const orders = await prisma.order.findMany({
      where: {
        deliveryPersonId: riderId,
        status: {
          notIn: ["Cancelled", "Delivered"],
        },
      },
      include: {
        customer: { select: { name: true, phone: true } },
        vendor: { select: { name: true, phone: true } },
        items: { include: { foodItem: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = orders.map((o) => ({
      id: o.id,
      totalAmount: o.totalAmount,
      status: o.status,
      deliveryAddress: o.deliveryAddress,
      isCOD: o.isCOD,
      paymentReceived: o.paymentReceived,
      createdAt: o.createdAt,
      customer: {
        name: o.customer.name,
        phone: o.customer.phone,
      },
      vendor: {
        name: o.vendor.name,
        phone: o.vendor.phone,
      },
      items: o.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        priceAtTime: item.priceAtTime,
        foodItem: {
          name: item.foodItem.name,
        },
      })),
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// PATCH /api/delivery/status
export async function updateDeliveryStatus(req: Request, res: Response): Promise<void> {
  try {
    const riderId = req.user!.sub;
    const { workStatus, leaveReason } = req.body;

    if (!workStatus) {
      res.status(400).json({ error: "workStatus is required" });
      return;
    }

    const validStatuses = ["Active", "Break", "Leave"];
    if (!validStatuses.includes(workStatus)) {
      res.status(400).json({ error: "Invalid status value" });
      return;
    }

    await prisma.user.update({
      where: { id: riderId },
      data: {
        workStatus,
        leaveReason: workStatus === "Leave" ? leaveReason : null,
      },
    });

    res.json({ message: "Availability status updated successfully", workStatus });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// POST /api/delivery/resign
export async function requestResignation(req: Request, res: Response): Promise<void> {
  try {
    const riderId = req.user!.sub;

    await prisma.user.update({
      where: { id: riderId },
      data: { resignRequest: true },
    });

    res.json({ message: "Resignation request submitted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// PATCH /api/delivery/upi
export async function updateUpi(req: Request, res: Response): Promise<void> {
  try {
    const riderId = req.user!.sub;
    const { upi } = req.body;

    if (!upi) {
      res.status(400).json({ error: "upi is required" });
      return;
    }

    await prisma.user.update({
      where: { id: riderId },
      data: { upi },
    });

    res.json({ message: "UPI address updated successfully", upi });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// PATCH /api/delivery/orders/:id/deliver
export async function markOrderDelivered(req: Request, res: Response): Promise<void> {
  try {
    const riderId = req.user!.sub;
    const { id: orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.deliveryPersonId !== riderId) {
      res.status(404).json({ error: "Order not found or unauthorized" });
      return;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: "Delivered", paymentReceived: true },
      include: {
        vendor: { select: { name: true } },
      },
    });

    // Notify student and vendor via Socket.io
    const io = getIO();
    io.to(`order:${orderId}`).emit("orderStatusUpdate", {
      orderId,
      status: "Delivered",
      vendorName: updatedOrder.vendor.name,
    });

    io.to(`vendor:${order.vendorId}`).emit("orderStatusUpdate", {
      orderId,
      status: "Delivered",
      vendorName: updatedOrder.vendor.name,
    });

    res.json({ message: "Order marked as successfully delivered" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// PATCH /api/delivery/orders/:id/pick
export async function pickOrder(req: Request, res: Response): Promise<void> {
  try {
    const riderId = req.user!.sub;
    const { id: orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.deliveryPersonId !== riderId) {
      res.status(404).json({ error: "Order not found or unauthorized" });
      return;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: "OutForDelivery" },
      include: {
        vendor: { select: { name: true } },
      },
    });

    // Notify student and vendor via Socket.io
    const io = getIO();
    io.to(`order:${orderId}`).emit("orderStatusUpdate", {
      orderId,
      status: "OutForDelivery",
      vendorName: updatedOrder.vendor.name,
    });

    io.to(`vendor:${order.vendorId}`).emit("orderStatusUpdate", {
      orderId,
      status: "OutForDelivery",
      vendorName: updatedOrder.vendor.name,
    });

    res.json({ message: "Order picked up successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// PATCH /api/delivery/location
export async function updateLocation(req: Request, res: Response): Promise<void> {
  try {
    const riderId = req.user!.sub;
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      res.status(400).json({ error: "lat and lng are required" });
      return;
    }

    // Cache location in Redis instead of writing to database
    await redis.hset(`rider:location:${riderId}`, {
      lat: String(lat),
      lng: String(lng),
      updatedAt: new Date().toISOString()
    });

    res.json({ message: "Location updated successfully in cache" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// POST /api/delivery/deposit
export async function submitCashDeposit(req: Request, res: Response): Promise<void> {
  try {
    const riderId = req.user!.sub;
    const amount = Number(req.body.amount);

    if (isNaN(amount) || amount <= 0) {
      res.status(400).json({ error: "Amount must be greater than zero" });
      return;
    }

    // Get associated vendor
    const rider = await prisma.user.findUnique({
      where: { id: riderId },
      select: { employerId: true },
    });

    if (!rider || !rider.employerId) {
      res.status(400).json({ error: "No vendor associated with this rider" });
      return;
    }

    const deposit = await prisma.cashDeposit.create({
      data: {
        riderId,
        vendorId: rider.employerId,
        amount,
        status: "Pending",
      },
    });

    res.json({
      message: "Cash deposit submitted for vendor verification",
      id: deposit.id,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// GET /api/delivery/deposits
export async function getCashDeposits(req: Request, res: Response): Promise<void> {
  try {
    const riderId = req.user!.sub;

    const deposits = await prisma.cashDeposit.findMany({
      where: { riderId },
      orderBy: { createdAt: "desc" },
    });

    const depositsWithVendors = await Promise.all(
      deposits.map(async (d) => {
        const vendor = await prisma.user.findUnique({
          where: { id: d.vendorId },
          select: { name: true },
        });
        return {
          id: d.id,
          riderId: d.riderId,
          vendorId: d.vendorId,
          amount: d.amount,
          status: d.status,
          createdAt: d.createdAt,
          vendorName: vendor?.name || "Unknown",
        };
      })
    );

    res.json(depositsWithVendors);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// GET /api/delivery/stats
export async function getDeliveryStats(req: Request, res: Response): Promise<void> {
  try {
    const riderId = req.user!.sub;

    // 1. Completed deliveries count
    const completedCount = await prisma.order.count({
      where: {
        deliveryPersonId: riderId,
        status: "Delivered",
      },
    });

    // 2. COD Total Cash
    const codOrders = await prisma.order.findMany({
      where: {
        deliveryPersonId: riderId,
        status: "Delivered",
        isCOD: true,
      },
      select: { totalAmount: true },
    });
    const codTotal = codOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // 3. Verified deposits total
    const verifiedDeposits = await prisma.cashDeposit.findMany({
      where: {
        riderId,
        status: "Verified",
      },
      select: { amount: true },
    });
    const verifiedTotal = verifiedDeposits.reduce((sum, d) => sum + d.amount, 0);

    const pendingCashCOD = Math.max(0, codTotal - verifiedTotal);

    // 4. Past 7 days delivery count for chart
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await prisma.order.count({
        where: {
          deliveryPersonId: riderId,
          status: "Delivered",
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      chartData.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        deliveries: count,
        earnings: count * 25,
      });
    }

    // 5. History orders list
    const historyOrders = await prisma.order.findMany({
      where: { deliveryPersonId: riderId },
      include: {
        customer: { select: { name: true, phone: true } },
        vendor: { select: { name: true, phone: true } },
        items: { include: { foodItem: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const formattedHistory = historyOrders.map((o) => ({
      id: o.id,
      totalAmount: o.totalAmount,
      status: o.status,
      deliveryAddress: o.deliveryAddress,
      isCOD: o.isCOD,
      paymentReceived: o.paymentReceived,
      createdAt: o.createdAt,
      customer: {
        name: o.customer.name,
        phone: o.customer.phone,
      },
      vendor: {
        name: o.vendor.name,
        phone: o.vendor.phone,
      },
      items: o.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        priceAtTime: item.priceAtTime,
        foodItem: {
          name: item.foodItem.name,
        },
      })),
    }));

    res.json({
      stats: {
        completedDeliveries: completedCount,
        totalEarnings: completedCount * 25,
        pendingCashCOD,
      },
      chart: chartData,
      history: formattedHistory,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// GET /api/delivery/location/:riderId
export async function getRiderLocation(req: Request, res: Response): Promise<void> {
  try {
    const { riderId } = req.params;

    const location = await redis.hgetall(`rider:location:${riderId}`);

    if (!location || !location.lat || !location.lng) {
      res.status(404).json({ error: "Rider location not found" });
      return;
    }

    res.json({
      lat: Number(location.lat),
      lng: Number(location.lng),
      updatedAt: location.updatedAt,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
