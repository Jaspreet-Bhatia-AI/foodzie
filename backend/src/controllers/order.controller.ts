import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { getIO } from "../lib/socket";

export async function createOrder(req: Request, res: Response): Promise<void> {
  try {
    const { vendorId, items, totalAmount, deliveryAddress, isCOD = false, appliedCredits = 0, scheduledTime } = req.body;
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

    // --- 🛡️ GHOST ITEM SAFEGUARD & SECURE PRICING ---
    const foodItemIds = items.map((item: any) => item.foodItemId);
    const existingItems = await prisma.foodItem.findMany({
      where: {
        id: { in: foodItemIds },
        category: { vendorId: vendorId } // Ensure items belong to the correct vendor
      },
      select: { id: true, price: true, stock: true, name: true, isCooked: true }
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
    
    let validatedTotalAmount = 0;
    const secureItemsToCreate = items.map((item: any) => {
      const dbItem = existingItems.find(ei => ei.id === item.foodItemId);
      const quantity = Number(item.quantity) || 1;
      const priceAtTime = dbItem!.price;
      validatedTotalAmount += priceAtTime * quantity;
      
      return {
        foodItemId: item.foodItemId,
        quantity,
        priceAtTime,
      };
    });
    // --- END SAFEGUARD ---

    
    const user = await prisma.user.findUnique({ where: { id: customerId } });
    if (!user) {
      res.status(404).json({ success: false, message: "Customer not found" });
      return;
    }

    const totalCredits = (user.refundedCredits || 0) + (user.earnedCredits || 0);
    if (appliedCredits > 0 && totalCredits < appliedCredits) {
      res.status(400).json({ success: false, message: "Insufficient credits" });
      return;
    }

    // 1. Inventory Check & Deduct Preparation
    const stockUpdates = [];
    for (const item of items) {
      const food = existingItems.find(i => i.id === item.foodItemId);
      if (food && food.stock !== null) {
        if (food.stock < item.quantity) {
          res.status(400).json({ success: false, message: `Out of stock: ${food.name} (Only ${food.stock} left)` });
          return;
        }
        stockUpdates.push(
          prisma.foodItem.update({
            where: { id: item.foodItemId },
            data: { stock: { decrement: item.quantity } }
          })
        );
      }
    }

    let refundDeduct = 0;
    let earnedDeduct = 0;
    if (appliedCredits > 0) {
      refundDeduct = Math.min(appliedCredits, user.refundedCredits || 0);
      earnedDeduct = appliedCredits - refundDeduct;
    }

    // Earn proportional credits (1 pt per $10 spent, min $50 order, max 100 pts)
    const creditsEarned = validatedTotalAmount >= 50 ? Math.min(100, Math.floor(validatedTotalAmount / 10)) : 0;

    // 1. Create the Foodzie Order in Database and update user credits and stock atomically
    console.log("Creating database order record and updating credits/stock...");
    
    const transactionOps = [
      prisma.order.create({
        data: {
          customerId,
          vendorId,
          totalAmount: validatedTotalAmount,
          deliveryAddress: deliveryAddress || "Not Provided",
          isCOD,
          scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
          status: isCOD ? "Confirmed" : "Pending",
          items: {
            create: secureItemsToCreate,
          },
        },
      }),
      prisma.user.update({
        where: { id: customerId },
        data: {
          refundedCredits: { decrement: refundDeduct },
          earnedCredits: { increment: creditsEarned - earnedDeduct }
        }
      }),
      ...stockUpdates
    ];

    const [order] = await prisma.$transaction(transactionOps);
    console.log("Order record created:", order.id);


    // 2. Fetch full order to emit socket and send response
    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        items: { include: { foodItem: true } }
      }
    });

    if (fullOrder) {
      const io = getIO();
      io.to(`vendor:${fullOrder.vendorId}`).emit("newOrder", fullOrder);
    }

    res.status(201).json({
      success: true,
      message: isCOD 
        ? "Order placed successfully (Cash on Delivery)" 
        : "Order placed successfully (Direct UPI, awaiting verification)",
      foodzieOrderId: order.id,
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
        customer: { select: { name: true, email: true, phone: true } },
        items: { include: { foodItem: true } },
        deliveryPerson: { select: { id: true, name: true, phone: true } },
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

    const updateData: any = { status };
    if (status === "Confirmed" || status === "Preparing") {
      updateData.paymentReceived = true;
    }

    // Refund logic
    if ((status === "Cancelled" || status === "Rejected") && order.status !== "Cancelled" && order.status !== "Rejected") {
      // Refund the entire total amount directly to refundedCredits
      await prisma.user.update({
        where: { id: order.customerId },
        data: { refundedCredits: { increment: order.totalAmount } }
      });
      console.log(`Refunded ${order.totalAmount} to customer ${order.customerId}`);
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
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
        customer: { select: { name: true, email: true } },
        items: { include: { foodItem: true } },
        deliveryPerson: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    const formattedOrders = orders.map(o => ({
      ...o,
      vendor: { vendorName: o.vendor.name },
      rider: o.deliveryPerson ? { id: o.deliveryPerson.id, name: o.deliveryPerson.name, phone: o.deliveryPerson.phone } : null
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
      where: { vendorId, status: { in: ['Delivered', 'Completed'] } },
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

      const dayOrders = await prisma.order.findMany({
        where: {
          vendorId,
          status: { in: ['Delivered', 'Completed'] },
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
        include: {
          items: {
            include: {
              foodItem: {
                select: { realPrice: true, price: true },
              },
            },
          },
        },
      });

      let revenue = 0;
      let profit = 0;
      for (const order of dayOrders) {
        revenue += order.totalAmount || 0;
        for (const item of order.items) {
          const sellPrice = item.priceAtTime || item.foodItem?.price || 0;
          const costPrice = item.foodItem?.realPrice ?? (sellPrice * 0.7);
          profit += Math.max(0, (sellPrice - costPrice) * item.quantity);
        }
      }

      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue,
        profit,
        orders: dayOrders.length,
      });
    }

    // 2. Get top 5 selling items
    const deliveredItems = await prisma.orderItem.findMany({
      where: {
        order: {
          vendorId,
          status: { in: ['Delivered', 'Completed'] },
        },
      },
      include: {
        foodItem: {
          select: { name: true, realPrice: true, price: true },
        },
      },
    });

    const itemMap = new Map<string, { name: string; quantity: number; revenue: number; profit: number }>();
    for (const item of deliveredItems) {
      const name = item.foodItem?.name || 'Unknown';
      const qty = item.quantity || 0;
      const sellPrice = item.priceAtTime || item.foodItem?.price || 0;
      const costPrice = item.foodItem?.realPrice ?? (sellPrice * 0.7);
      const rev = sellPrice * qty;
      const prof = Math.max(0, (sellPrice - costPrice) * qty);

      if (!itemMap.has(item.foodItemId)) {
        itemMap.set(item.foodItemId, { name, quantity: 0, revenue: 0, profit: 0 });
      }
      const entry = itemMap.get(item.foodItemId)!;
      entry.quantity += qty;
      entry.revenue += rev;
      entry.profit += prof;
    }

    const topItemsWithNames = Array.from(itemMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 3. Order status breakdown
    const statusBreakdown = await prisma.order.groupBy({
      by: ['status'],
      where: { vendorId },
      _count: { id: true },
    });


    // 4. Calculate Top Customers of the Month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthOrders = await prisma.order.findMany({
      where: {
        vendorId,
        status: { in: ['Delivered', 'Completed'] },
        createdAt: { gte: startOfMonth }
      },
      include: { customer: { select: { id: true, name: true, email: true } } }
    });

    const customerSpendMap = new Map();
    monthOrders.forEach(o => {
      const cId = o.customer.id;
      if (!customerSpendMap.has(cId)) {
        customerSpendMap.set(cId, { id: cId, name: o.customer.name, email: o.customer.email, totalSpent: 0, orderCount: 0 });
      }
      const data = customerSpendMap.get(cId);
      data.totalSpent += o.totalAmount;
      data.orderCount += 1;
    });

    const topCustomers = Array.from(customerSpendMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 3);

    res.json({
      last7Days,
      topCustomers,
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

export async function getOrderReceiptHTML(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: { select: { name: true, email: true } },
        vendor: { select: { name: true } },
        items: {
          include: {
            foodItem: true
          }
        }
      }
    });

    if (!order) {
      res.status(404).send("<h1>Order not found</h1>");
      return;
    }

    const baseUrl = process.env.API_URL || `${req.protocol}://${req.get('host') || 'localhost:5000'}`;
    const receiptUrl = `${baseUrl}/api/orders/${order.id}/receipt`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(receiptUrl)}`;

    const itemsRows = order.items.map(item => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px 0; text-align: left;">
          <span style="font-weight: bold; color: #f97316;">x${item.quantity}</span> 
          ${item.foodItem.name}
          <span style="margin-left: 6px; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: bold; background-color: ${item.foodItem.isVegetarian ? '#dcfce7' : '#fee2e2'}; color: ${item.foodItem.isVegetarian ? '#15803d' : '#b91c1c'};">
            ${item.foodItem.isVegetarian ? '🟢 Veg' : '🔴 Non-Veg'}
          </span>
        </td>
        <td style="padding: 12px 0; text-align: right; color: #666;">$${item.priceAtTime.toFixed(2)}</td>
        <td style="padding: 12px 0; text-align: right; font-weight: bold;">$${(item.priceAtTime * item.quantity).toFixed(2)}</td>
      </tr>
    `).join("");

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Foodzie Order Receipt</title>
  <style>
    body { font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; color: #1f2937; margin: 0; padding: 40px 20px; }
    .invoice-card { max-width: 500px; margin: 0 auto; background: white; border-radius: 24px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); padding: 40px; border: 1px solid #e5e7eb; position: relative; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase; background: #ffedd5; color: #ea580c; margin-bottom: 20px; }
    .header-title { font-size: 28px; font-weight: 800; margin: 0 0 10px 0; letter-spacing: -0.5px; }
    .meta-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6; padding: 20px 0; margin: 25px 0; }
    .meta-title { font-size: 11px; text-transform: uppercase; color: #9ca3af; font-weight: bold; letter-spacing: 0.5px; margin-bottom: 4px; }
    .meta-value { font-size: 14px; font-weight: bold; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .total-row { border-top: 2px solid #ea580c; font-size: 18px; font-weight: bold; }
    .qr-section { text-align: center; border-top: 1px dashed #e5e7eb; padding-top: 30px; margin-top: 30px; }
    .qr-section p { font-size: 12px; color: #9ca3af; margin-top: 8px; }
    .print-btn { display: block; width: 100%; text-align: center; background: #f97316; color: white; padding: 14px 0; border-radius: 12px; text-decoration: none; font-weight: bold; border: none; cursor: pointer; margin-bottom: 15px; }
    @media print {
      body { background: white; padding: 0; }
      .invoice-card { box-shadow: none; border: none; padding: 0; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <span class="badge">Official Receipt</span>
        <h1 class="header-title">Foodzie</h1>
        <p style="color: #6b7280; font-size: 13px; margin: 0;">Thank you for your purchase!</p>
      </div>
      <button class="print-btn" onclick="window.print()" style="max-width: 120px; font-size: 13px; padding: 8px 0; margin: 0;">Print Receipt</button>
    </div>

    <div class="meta-grid">
      <div>
        <p class="meta-title">Order ID</p>
        <p class="meta-value">#F-${order.id.slice(-6).toUpperCase()}</p>
      </div>
      <div>
        <p class="meta-title">Date</p>
        <p class="meta-value">${order.createdAt.toLocaleDateString()}</p>
      </div>
      <div>
        <p class="meta-title">Student Details</p>
        <p class="meta-value" style="font-size: 13px;">${order.customer.name}<br><span style="color: #6b7280; font-weight: normal;">${order.customer.email}</span></p>
      </div>
      <div>
        <p class="meta-title">Shop / Canteen</p>
        <p class="meta-value">${order.vendor.name}</p>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr style="border-bottom: 2px solid #f3f4f6; color: #9ca3af; font-size: 11px; text-transform: uppercase;">
          <th style="padding-bottom: 8px; text-align: left;">Item</th>
          <th style="padding-bottom: 8px; text-align: right;">Price</th>
          <th style="padding-bottom: 8px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
        <tr class="total-row">
          <td colspan="2" style="padding: 16px 0 0 0; text-align: left; color: #ea580c;">Total Paid</td>
          <td style="padding: 16px 0 0 0; text-align: right; color: #ea580c; font-size: 22px; font-weight: 900;">$${order.totalAmount.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 16px; padding: 15px;">
      <p class="meta-title" style="margin: 0 0 6px 0;">Delivery Address Info</p>
      <p style="font-size: 13px; font-weight: bold; margin: 0; line-height: 1.5; color: #374151;">${order.deliveryAddress}</p>
    </div>

    <div class="qr-section">
      <img src="${qrCodeUrl}" alt="Receipt QR Link" style="width: 140px; height: 140px;" />
      <p>Scan QR code to access this receipt on any device.</p>
    </div>
  </div>
</body>
</html>
    `;
    res.setHeader("Content-Type", "text/html");
    res.send(htmlContent);
  } catch (error: any) {
    res.status(500).send(`<h1>Error generating receipt: ${error.message}</h1>`);
  }
}

export async function deliverOrderByQR(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const vendorId = req.user!.sub;

    const order = await prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    if (order.vendorId !== vendorId) {
      res.status(403).json({ error: "Only the matching canteen vendor can verify this delivery" });
      return;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: "Completed", paymentReceived: true },
      include: {
        vendor: { select: { name: true } },
        customer: { select: { name: true } }
      }
    });

    const io = getIO();
    io.to(`order:${id}`).emit("orderStatusUpdate", {
      orderId: id,
      status: "Completed",
      vendorName: updatedOrder.vendor.name
    });

    io.to(`vendor:${vendorId}`).emit("orderStatusUpdate", {
      orderId: id,
      status: "Completed",
      vendorName: updatedOrder.vendor.name
    });

    res.json({ success: true, message: "Order marked as completed", order: updatedOrder });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function addFoodItemReview(req: Request, res: Response): Promise<void> {
  try {
    const { foodItemId, rating, comment } = req.body;
    const customerId = req.user!.sub;

    if (!foodItemId || rating == null) {
      res.status(400).json({ error: "foodItemId and rating are required" });
      return;
    }

    const valRating = parseInt(rating);
    if (isNaN(valRating) || valRating < 1 || valRating > 5) {
      res.status(400).json({ error: "rating must be an integer between 1 and 5" });
      return;
    }


    // VERIFIED PURCHASE CHECK
    const orderExists = await prisma.order.findFirst({
      where: {
        customerId,
        status: { in: ["Delivered", "Completed"] },
        items: {
          some: { foodItemId }
        }
      }
    });
    
    if (!orderExists) {
      res.status(403).json({ error: "You can only review items you have successfully ordered." });
      return;
    }
    
    const existingReview = await prisma.review.findFirst({
      where: { studentId: customerId, foodItemId }
    });
    
    if (existingReview) {
      res.status(400).json({ error: "You have already reviewed this item." });
      return;
    }

    const review = await prisma.review.create({

      data: {
        foodItemId,
        studentId: customerId,
        rating: valRating,
        comment: comment || null,
        type: "FoodItem"
      },
      include: {
        student: { select: { name: true } }
      }
    });

    res.status(201).json({ success: true, review });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}


export async function awardTopCustomers(req: Request, res: Response): Promise<void> {
  try {
    const vendorId = req.user!.sub;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthOrders = await prisma.order.findMany({
      where: {
        vendorId,
        status: { in: ['Delivered', 'Completed'] },
        createdAt: { gte: startOfMonth }
      },
      include: { customer: { select: { id: true, name: true, email: true } } }
    });

    const customerSpendMap = new Map();
    monthOrders.forEach(o => {
      const cId = o.customer.id;
      if (!customerSpendMap.has(cId)) {
        customerSpendMap.set(cId, { id: cId, name: o.customer.name, email: o.customer.email, totalSpent: 0 });
      }
      customerSpendMap.get(cId).totalSpent += o.totalAmount;
    });

    const topCustomers = Array.from(customerSpendMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 3);

    const awards = [500, 300, 100]; // 1st gets $5.00, 2nd gets $3.00, 3rd gets $1.00 (in points)
    
    for (let i = 0; i < topCustomers.length; i++) {
      await prisma.user.update({
        where: { id: topCustomers[i].id },
        data: { earnedCredits: { increment: awards[i] } }
      });
    }

    res.json({ success: true, message: "Top customers awarded successfully!" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function delayOrder(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { delayMinutes } = req.body;
    const vendorId = req.user!.sub;

    const order = await prisma.order.findUnique({ where: { id }, include: { vendor: true } });
    if (!order || order.vendorId !== vendorId) {
      res.status(404).json({ error: "Order not found or unauthorized" });
      return;
    }

    // Emit to order room so student can track
    const io = getIO();
    io.to(`order:${id}`).emit("orderStatusUpdate", {
      orderId: id,
      status: "Delayed",
      delayMinutes,
      vendorName: order.vendor.name
    });

    res.json({ success: true, message: "Order delayed successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
