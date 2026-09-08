import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomSubset = <T>(arr: T[], min: number, max: number): T[] => {
  const count = getRandomInt(min, max);
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const universitiesData = [
  { name: 'Sant Baba Bhag Singh University', city: 'Jalandhar', lat: 31.2842, lng: 75.5862 },
  { name: 'Lovely Professional University', city: 'Phagwara', lat: 31.2536, lng: 75.7037 },
  { name: 'Guru Nanak Dev University', city: 'Amritsar', lat: 31.6366, lng: 74.8250 },
  { name: 'Thapar Institute of Engineering', city: 'Patiala', lat: 30.3534, lng: 76.3615 },
  { name: 'Chandigarh University', city: 'Mohali', lat: 30.7699, lng: 76.5756 }
];

const studentNames = ["Aryan Sharma", "Simran Kaur", "Karan Singh", "Priya Verma", "Rohan Mehta", "Amanpreet Kaur", "Harsh Verma", "Neha Gupta", "Vikram Singh", "Anjali Desai"];

const vendorNames = ["The Campus Cafe", "Spice & Grill", "Urban Bite", "Student Adda", "Canteen Central", "Punjabi Tadka", "Chill Zone", "The Food Box", "Desi Kitchen", "Hunger Cure", "Taste of Punjab", "Campus Dhaba"];

const menuCatalog = [
  {
    name: "Parathas",
    items: [
      { name: "Aloo Paratha", img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80", price: 40 },
      { name: "Gobi Paratha", img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80", price: 45 },
      { name: "Paneer Paratha", img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80", price: 60 },
      { name: "Mix Veg Paratha", img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80", price: 50 },
      { name: "Onion Paratha", img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80", price: 40 }
    ]
  },
  {
    name: "North Indian Combos",
    items: [
      { name: "Veg Deluxe Thali", img: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400&q=80", price: 120 },
      { name: "Student Mini Thali", img: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400&q=80", price: 80 },
      { name: "Chole Bhature", img: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400&q=80", price: 70 },
      { name: "Rajma Chawal", img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80", price: 80 },
      { name: "Kadhi Chawal", img: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80", price: 75 }
    ]
  },
  {
    name: "Snacks & Street Food",
    items: [
      { name: "Punjabi Samosa", img: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80", price: 15 },
      { name: "Aloo Tikki", img: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80", price: 40 },
      { name: "Pav Bhaji", img: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80", price: 60 },
      { name: "Bread Pakora", img: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80", price: 20 },
      { name: "Pani Puri", img: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80", price: 30 }
    ]
  },
  {
    name: "Hot & Cold Beverages",
    items: [
      { name: "Sweet Lassi", img: "https://images.unsplash.com/photo-1571556094541-01beeb958ce7?w=400&q=80", price: 40 },
      { name: "Masala Chai", img: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80", price: 15 },
      { name: "Mango Shake", img: "https://images.unsplash.com/photo-1571556094541-01beeb958ce7?w=400&q=80", price: 50 },
      { name: "Cold Coffee", img: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400&q=80", price: 60 },
      { name: "Fresh Lime Soda", img: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80", price: 30 }
    ]
  },
  {
    name: "Biryani & Rice",
    items: [
      { name: "Veg Biryani", img: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=400&q=80", price: 120 },
      { name: "Paneer Biryani", img: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=400&q=80", price: 150 },
      { name: "Jeera Rice", img: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&q=80", price: 70 },
      { name: "Veg Pulao", img: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&q=80", price: 90 },
      { name: "Fried Rice", img: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80", price: 100 }
    ]
  },
  {
    name: "Fast Food",
    items: [
      { name: "Veg Burger", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80", price: 50 },
      { name: "Paneer Tikka Wrap", img: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80", price: 90 },
      { name: "Cheese Sandwich", img: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80", price: 60 },
      { name: "Masala Fries", img: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=400&q=80", price: 70 },
      { name: "Veg Pizza", img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80", price: 150 }
    ]
  },
  {
    name: "South Indian",
    items: [
      { name: "Masala Dosa", img: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80", price: 80 },
      { name: "Plain Dosa", img: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80", price: 60 },
      { name: "Idli Sambar", img: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80", price: 50 },
      { name: "Medu Vada", img: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80", price: 45 },
      { name: "Onion Uttapam", img: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80", price: 70 }
    ]
  },
  {
    name: "Desserts & Sweets",
    items: [
      { name: "Gulab Jamun", img: "https://images.unsplash.com/photo-1551024506-0cb4a161405a?w=400&q=80", price: 40 },
      { name: "Rasmalai", img: "https://images.unsplash.com/photo-1551024506-0cb4a161405a?w=400&q=80", price: 60 },
      { name: "Hot Jalebi", img: "https://images.unsplash.com/photo-1551024506-0cb4a161405a?w=400&q=80", price: 30 },
      { name: "Gajar Halwa", img: "https://images.unsplash.com/photo-1551024506-0cb4a161405a?w=400&q=80", price: 50 },
      { name: "Chocolate Brownie", img: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=400&q=80", price: 80 }
    ]
  },
  {
    name: "Chinese Combos",
    items: [
      { name: "Veg Noodles", img: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80", price: 80 },
      { name: "Chilli Paneer", img: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80", price: 110 },
      { name: "Veg Manchurian", img: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80", price: 100 },
      { name: "Spring Rolls", img: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80", price: 60 },
      { name: "Hakka Noodles", img: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80", price: 90 }
    ]
  },
  {
    name: "Maggi & Noodles",
    items: [
      { name: "Masala Maggi", img: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&q=80", price: 40 },
      { name: "Cheese Maggi", img: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&q=80", price: 60 },
      { name: "Vegetable Maggi", img: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&q=80", price: 50 },
      { name: "Paneer Maggi", img: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&q=80", price: 70 },
      { name: "Double Masala Maggi", img: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&q=80", price: 50 }
    ]
  }
];

async function main() {
  console.log('Starting extensive seed...');

  // 1. Clean existing data
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.foodItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.jobVacancy.deleteMany();
  await prisma.cashDeposit.deleteMany();
  await prisma.user.deleteMany();
  await prisma.university.deleteMany();

  console.log('Cleaned existing database.');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 2. Loop Universities (5 total)
  for (const uniData of universitiesData) {
    const uni = await prisma.university.create({
      data: {
        name: uniData.name,
        city: uniData.city,
        country: 'India',
        lat: uniData.lat,
        lng: uniData.lng,
      },
    });
    console.log(`\nCreated University: ${uni.name}`);

    // 3. Create 1 Student in this university
    const studentName = getRandomItem(studentNames);
    const student = await prisma.user.create({
      data: {
        name: studentName,
        email: `student.${studentName.split(' ')[0].toLowerCase()}_${uni.id.substring(0,4)}@foodzie.com`,
        password: hashedPassword,
        role: 'Student',
        universityId: uni.id,
        phone: `98${getRandomInt(10000000, 99999999)}`,
      },
    });
    console.log(` -> Added Student: ${student.name}`);

    // 4. Create 3 to 6 Canteens in this university
    const numCanteens = getRandomInt(3, 6);
    const selectedVendors = getRandomSubset(vendorNames, numCanteens, numCanteens);

    for (const vendorName of selectedVendors) {
      const vendor = await prisma.user.create({
        data: {
          name: vendorName,
          email: `vendor.${vendorName.replace(/\s+/g, '').toLowerCase()}_${uni.id.substring(0,4)}@foodzie.com`,
          password: hashedPassword,
          role: 'Canteen Vendor',
          universityId: uni.id,
          vendorDescription: `Best food at ${uniData.name}. Come and taste the magic!`,
          vendorUpi: `${vendorName.replace(/\s+/g, '').toLowerCase()}@ybl`,
        },
      });
      console.log(`   -> Added Canteen: ${vendor.name}`);

      // 5. Create 5 to 10 Categories in this canteen
      const numCategories = getRandomInt(5, 10);
      const selectedCategories = getRandomSubset(menuCatalog, numCategories, numCategories);

      for (const catData of selectedCategories) {
        const category = await prisma.category.create({
          data: { name: catData.name, vendorId: vendor.id },
        });

        // 6. Create 3 to 5 Food Items in this category
        const numItems = getRandomInt(3, 5);
        const selectedItems = getRandomSubset(catData.items, numItems, numItems);

        for (const itemData of selectedItems) {
          await prisma.foodItem.create({
            data: {
              name: itemData.name,
              description: `Authentic ${itemData.name} prepared fresh.`,
              price: itemData.price,
              stock: getRandomInt(20, 100),
              isVegetarian: true, // Assuming most of this catalog is veg
              categoryId: category.id,
              imageUrl: itemData.img,
            },
          });
        }
      }
    }
  }

  // Create a Super Admin just in case
  await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@foodzie.com',
      password: hashedPassword,
      role: 'Super Admin',
    },
  });

  console.log('\n✅ Extensive Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
