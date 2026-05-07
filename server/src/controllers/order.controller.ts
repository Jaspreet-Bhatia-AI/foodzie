import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { razorpay } from "../lib/razorpay";
import { getIO } from "../lib/socket";

export async function createOrder(req: Request, res: Response): Promise<void> {
  try {
    const { vendorId, items, totalAmount, deliveryAddress, isCOD = false } = req.body;
    const customerId = req.user!.sub;

    console.log("--- ORDER CREATION START ---");
    console.log("Customer:", customerId);
    console.log("Vendor:", vendorId);
    console.log("Total Amount:", totalAmount);
    console.log("Items:", JSON.stringify(items));

    if (!vendorId || !items || !Array.isArray(items) || items.length === 0 || totalAmount == null) {
      console.error("ORDER CREATION ERROR: Missing required fields");
      res.status(400).json({ success: false, message: "Missing required fields" });
      return;
    }

    const validatedTotalAmount = Number(totalAmount);
    if (isNaN(validatedTotalAmount)) {
      console.error("ORDER CREATION ERROR: Invalid totalAmount", totalAmount);
      res.status(400).json({ success: false, message: "Invalid totalAmount" });
      return;
    }

    // --- 🛡️ GHOST ITEM SAFEGUARD ---
    const foodItemIds = items.map((item: any) => item.foodItemId);
    const existingItems = await prisma.foodItem.findMany({
      where: {
        id: { in: foodItemIds },
        category: { vendorId: vendorId } // Ensure items belong to the correct vendor
      },
      select: { id: true }
    });

    if (existingItems.length !== foodItemIds.length) {
      console.error("ORDER CREATION ERROR: Ghost items detected in cart", {
        sent: foodItemIds.length,
        found: existingItems.length
      });
      res.status(400).json({ 
        success: false, 
        message: 'One or more items in your cart are no longer available. Please clear your cart.' 
      });
      return;
    }
    // --- END SAFEGUARD ---

    // 1. Create the Foodzie Order in Database
    console.log("Creating database order record...");
    const order = await prisma.order.create({
      data: {
        customerId,
        vendorId,
        totalAmount: validatedTotalAmount,
        deliveryAddress: deliveryAddress || "Not Provided",
        isCOD,
        items: {
          create: items.map((item: any) => ({
            foodItemId: item.foodItemId,
            quantity: Number(item.quantity) || 1,
            priceAtTime: Number(item.priceAtTime) || 0,
          })),
        },
      },
    });
    console.log("Order record created:", order.id);

    // If it's a Cash on Delivery order, we don't need a Razorpay order
    if (isCOD) {
      const fullOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          items: { include: { foodItem: true } }
        }
      });

      if (fullOrder) {
        const io = getIO();
        io.to(`vendor:${order.vendorId}`).emit("newOrder", fullOrder);
      }

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        foodzieOrderId: order.id,
      });
      return;
    }

    // 2. Generate Razorpay Order
    console.log("Generating Razorpay order...");
    const amountInPaise = Math.round(validatedTotalAmount * 100);
    
    if (amountInPaise <= 0) {
      console.error("ORDER CREATION ERROR: Amount must be greater than 0 for Razorpay");
      res.status(400).json({ success: false, message: "Amount must be greater than 0" });
      return;
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: order.id,
      notes: {
        foodzieOrderId: order.id,
      },
    });
    console.log("Razorpay order generated:", razorpayOrder.id);

    // 3. Return the generated details to the client
    res.status(201).json({
      success: true,
      message: "Order initiated successfully",
      foodzieOrderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
    console.log("--- ORDER CREATION SUCCESS ---");
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}

export async function getVendorOrders(req: Request, res: Response): Promise<void> {
  try {
    const vendorId = req.user!.sub;
    const orders = await prisma.order.findMany({
      where: { vendorId },
      include: {
        customer: { select: { name: true, email: true } },
        items: { include: { foodItem: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const vendorId = req.user!.sub;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    if (order.vendorId !== vendorId) {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        vendor: { select: { name: true } },
        items: { include: { foodItem: true } }
      }
    });

    // Emit to order room so student can track
    const io = getIO();
    io.to(`order:${id}`).emit("orderStatusUpdate", {
      orderId: id,
      status: updatedOrder.status,
      vendorName: updatedOrder.vendor.name
    });

    res.json({
      ...updatedOrder,
      vendor: { vendorName: updatedOrder.vendor.name }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getCustomerOrders(req: Request, res: Response): Promise<void> {
  try {
    const customerId = req.user!.sub;
    const orders = await prisma.order.findMany({
      where: { customerId },
      include: {
        vendor: { select: { name: true } },
        items: { include: { foodItem: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    const formattedOrders = orders.map(o => ({
      ...o,
      vendor: { vendorName: o.vendor.name }
    }));
    res.json(formattedOrders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getVendorStats(req: Request, res: Response): Promise<void> {
  try {
    const vendorId = req.user!.sub;
    const stats = await prisma.order.aggregate({
      where: { vendorId, status: 'Delivered' },
      _sum: { totalAmount: true },
      _count: { id: true },
    });
    res.json({
      totalRevenue: stats._sum.totalAmount || 0,
      totalOrders: stats._count.id || 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getVendorAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const vendorId = req.user!.sub;

    // 1. Get last 7 days of sales
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dailySales = await prisma.order.aggregate({
        where: {
          vendorId,
          status: 'Delivered',
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      });

      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: dailySales._sum.totalAmount || 0,
        orders: dailySales._count.id || 0,
      });
    }

    // 2. Get top 5 selling items
    const topItems = await prisma.orderItem.groupBy({
      by: ['foodItemId'],
      where: {
        order: {
          vendorId,
          status: 'Delivered',
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    const topItemsWithNames = await Promise.all(
      topItems.map(async (item) => {
        const foodItem = await prisma.foodItem.findUnique({
          where: { id: item.foodItemId },
          select: { name: true },
        });
        return {
          name: foodItem?.name || 'Unknown',
          quantity: item._sum.quantity || 0,
        };
      })
    );

    // 3. Order status breakdown
    const statusBreakdown = await prisma.order.groupBy({
      by: ['status'],
      where: { vendorId },
      _count: { id: true },
    });

    res.json({
      last7Days,
      topItems: topItemsWithNames,
      statusBreakdown: statusBreakdown.map(s => ({
        status: s.status,
        count: s._count.id,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
