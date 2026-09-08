import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

async function runMonthlyReports() {
  console.log("Generating Monthly Reports...");
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. VENDOR REPORTS
  const vendors = await prisma.user.findMany({ where: { role: 'Vendor' } });
  for (const vendor of vendors) {
    const orders = await prisma.order.findMany({
      where: {
        vendorId: vendor.id,
        createdAt: { gte: thirtyDaysAgo },
        status: 'Completed'
      },
      include: { items: { include: { foodItem: true } } }
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = orders.length;

    // Item frequencies
    const itemCounts: Record<string, number> = {};
    orders.forEach(o => o.items.forEach(i => {
      itemCounts[i.foodItem.name] = (itemCounts[i.foodItem.name] || 0) + i.quantity;
    }));
    const topItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => `<li>${entry[0]} (${entry[1]} sold)</li>`)
      .join('');

    const emailHtml = `
      <div style="font-family: sans-serif; line-height: 1.6;">
        <h1 style="color: #ea580c;">Foodzie Vendor Monthly Report 📊</h1>
        <p>Hi ${vendor.name}, here is your performance wrap-up for the last 30 days:</p>
        <h3>Revenue & Volume:</h3>
        <ul>
          <li><strong>Total Revenue:</strong> ₹${totalRevenue.toFixed(2)}</li>
          <li><strong>Orders Completed:</strong> ${totalOrders}</li>
        </ul>
        <h3>Top Selling Items:</h3>
        <ul>${topItems || '<li>No items sold this month</li>'}</ul>
        <p>Keep up the great work! Log in to your analytics dashboard for real-time insights.</p>
      </div>
    `;

    if (totalOrders > 0) {
      await resend.emails.send({
        from: "Foodzie <admin@foodzie.store>",
        to: vendor.email,
        subject: "Your Monthly Foodzie Performance Report 📈",
        html: emailHtml
      });
      console.log(`Sent report to vendor: ${vendor.email}`);
    }
  }

  // 2. STUDENT REPORTS
  const students = await prisma.user.findMany({ where: { role: 'Student' } });
  for (const student of students) {
    const orders = await prisma.order.findMany({
      where: {
        customerId: student.id,
        createdAt: { gte: thirtyDaysAgo },
        status: 'Completed'
      },
      include: { items: { include: { foodItem: true } } }
    });

    const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = orders.length;
    
    // Time saved calculation (assuming 15 mins saved per order compared to waiting in line)
    const hoursSaved = (totalOrders * 15) / 60;

    const emailHtml = `
      <div style="font-family: sans-serif; line-height: 1.6;">
        <h1 style="color: #ea580c;">Your Foodzie Month in Review 🍔</h1>
        <p>Hi ${student.name}, let's look at what you ate this month:</p>
        <h3>Your Stats:</h3>
        <ul>
          <li><strong>Total Orders:</strong> ${totalOrders}</li>
          <li><strong>Total Spent:</strong> ₹${totalSpent.toFixed(2)}</li>
          <li><strong>Time Saved:</strong> You avoided waiting in line for an estimated <strong>${hoursSaved.toFixed(1)} hours!</strong></li>
        </ul>
        <p>Hungry? Order now and skip the line entirely.</p>
      </div>
    `;

    if (totalOrders > 0) {
      await resend.emails.send({
        from: "Foodzie <admin@foodzie.store>",
        to: student.email,
        subject: "Your Foodzie Month in Review 🌯",
        html: emailHtml
      });
      console.log(`Sent report to student: ${student.email}`);
    }
  }

  console.log("Monthly reports finished.");
}

runMonthlyReports().catch(console.error);
