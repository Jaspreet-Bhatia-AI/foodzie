import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Looking for vendor bombaystreetbites.Botsford0@yahoo.com...');
  const vendor = await prisma.user.findFirst({
    where: {
      email: {
        equals: 'bombaystreetbites.Botsford0@yahoo.com',
        mode: 'insensitive',
      },
    },
  });

  if (!vendor) {
    console.error('❌ Vendor bombaystreetbites.Botsford0@yahoo.com not found!');
    return;
  }
  console.log(`✅ Found Vendor: ${vendor.name} (ID: ${vendor.id})`);

  console.log('🔍 Fetching students and food items...');
  const students = await prisma.user.findMany({
    where: { role: 'Student' },
    take: 50,
  });

  if (students.length === 0) {
    console.error('❌ No student users found in DB to attach orders to!');
    return;
  }

  const riders = await prisma.user.findMany({
    where: { role: 'Delivery' },
    take: 10,
  });

  const foodItems = await prisma.foodItem.findMany({
    where: { category: { vendorId: vendor.id } },
  });

  if (foodItems.length === 0) {
    console.error('❌ No food items found for this vendor!');
    return;
  }
  console.log(`📦 Found ${foodItems.length} food items and ${students.length} students.`);

  // We want to generate data for the last 7 days (including today)
  const totalDays = 7;
  let totalOrdersCreated = 0;
  let totalRevenueGenerated = 0;

  for (let i = totalDays - 1; i >= 0; i--) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - i);
    targetDate.setHours(0, 0, 0, 0);

    // Number of orders for this day: between 12 and 22 orders per day
    const ordersThisDay = Math.floor(Math.random() * 11) + 12;

    for (let j = 0; j < ordersThisDay; j++) {
      // Generate a random hour/minute during the day (e.g. between 10:00 AM and 10:00 PM)
      const hour = Math.floor(Math.random() * 12) + 10;
      const minute = Math.floor(Math.random() * 60);
      const orderDate = new Date(targetDate);
      orderDate.setHours(hour, minute, 0, 0);

      // Pick a random student
      const student = students[Math.floor(Math.random() * students.length)];
      const rider = riders.length > 0 ? riders[Math.floor(Math.random() * riders.length)] : null;

      // Pick 1 to 4 random food items
      const numItems = Math.floor(Math.random() * 4) + 1;
      const selectedItems = [];
      let orderTotal = 0;

      for (let k = 0; k < numItems; k++) {
        const item = foodItems[Math.floor(Math.random() * foodItems.length)];
        const quantity = Math.floor(Math.random() * 3) + 1; // 1 to 3 qty
        const priceAtTime = item.price;
        orderTotal += priceAtTime * quantity;

        selectedItems.push({
          foodItemId: item.id,
          quantity,
          priceAtTime,
        });
      }

      // Determine status based on day
      let status = 'Completed';
      const rand = Math.random();
      if (i === 0) {
        // Today's orders: mix of statuses
        if (rand < 0.4) status = 'Completed';
        else if (rand < 0.6) status = 'Processing';
        else if (rand < 0.75) status = 'Preparing';
        else if (rand < 0.9) status = 'Pending';
        else status = 'Cancelled';
      } else {
        // Past days: mostly Completed
        if (rand < 0.85) status = 'Completed';
        else if (rand < 0.93) status = 'Delivered';
        else status = 'Cancelled';
      }

      await prisma.order.create({
        data: {
          customerId: student.id,
          vendorId: vendor.id,
          deliveryPersonId: rider ? rider.id : null,
          totalAmount: parseFloat(orderTotal.toFixed(2)),
          status,
          deliveryAddress: `Room ${Math.floor(Math.random() * 900) + 100}, Block ${['A', 'B', 'C', 'D', 'Hostel 1', 'Hostel 2'][Math.floor(Math.random() * 6)]}`,
          isCOD: Math.random() > 0.5,
          paymentReceived: status === 'Completed' || status === 'Delivered',
          createdAt: orderDate,
          items: {
            create: selectedItems,
          },
        },
      });

      totalOrdersCreated++;
      if (status === 'Completed' || status === 'Delivered') {
        totalRevenueGenerated += orderTotal;
      }
    }
  }

  console.log(`\n🎉 SUCCESS! Generated ${totalOrdersCreated} orders across the last 7 days for ${vendor.name}.`);
  console.log(`💰 Estimated Gross Revenue added: ₹${totalRevenueGenerated.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
}

main()
  .catch((e) => {
    console.error('Error while seeding analytics:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
