import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export function initCronJobs() {
  console.log("CRON: Initializing background jobs...");

  // Run every day at 11:30 AM (or adjust as needed)
  cron.schedule("30 11 * * *", async () => {
    console.log("CRON: Running Daily AI Recommendations Job...");
    try {
      await sendDailyRecommendations();
    } catch (err) {
      console.error("CRON Error in sendDailyRecommendations:", err);
    }
  });
}

async function sendDailyRecommendations() {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("CRON: GEMINI_API_KEY missing, skipping AI recommendations.");
    return;
  }
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Get up to 50 active students
  const students = await prisma.user.findMany({
    where: { role: "Student" },
    include: { university: true },
    take: 50,
  });

  for (const student of students) {
    if (!student.universityId || !student.email) continue;

    // Get a highly rated or random food item from their university's vendors
    const popularItems = await prisma.foodItem.findMany({
      where: {
        category: {
          vendor: {
            universityId: student.universityId
          }
        }
      },
      include: {
        category: { include: { vendor: true } }
      },
      take: 10
    });

    if (popularItems.length === 0) continue;

    // Pick a random popular item
    const recommendedItem = popularItems[Math.floor(Math.random() * popularItems.length)];

    // Generate a Zomato/Swiggy style push notification / email body
    const prompt = `
You are a creative marketer for Foodzie, a campus food delivery app like Zomato/Swiggy.
Write a very short, catchy, mouth-watering push-notification-style message to recommend this food item to a student named ${student.name.split(' ')[0]}.
Food Item: ${recommendedItem.name}
Description: ${recommendedItem.description || "Delicious campus food"}
Canteen/Vendor: ${recommendedItem.category.vendor.name}

Keep it under 3 sentences. Be witty, friendly, and use 1 or 2 emojis.
Example vibe: "Hey Jaspreet! Craving something spicy? 🌶️ The Peri Peri Fries from Cafe Central are calling your name. Order now and skip the line!"
`;

    let aiMessage = "";
    try {
      const result = await model.generateContent(prompt);
      aiMessage = result.response.text().trim();
    } catch (e) {
      console.error("Gemini AI generation failed for student", student.email);
      continue;
    }

    try {
      await resend.emails.send({
        from: 'Foodzie Recommendations <hello@foodzie.store>',
        to: student.email,
        subject: `Your Daily Bite: ${recommendedItem.name} 🍔`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff8f0; border-radius: 12px; max-width: 500px; margin: 0 auto; text-align: center;">
            <h2 style="color: #f97316;">Foodzie Daily Pick</h2>
            <p style="font-size: 16px; color: #333; line-height: 1.5; margin: 20px 0;">${aiMessage}</p>
            ${recommendedItem.imageUrl ? `<img src="${recommendedItem.imageUrl}" alt="${recommendedItem.name}" style="max-width: 100%; border-radius: 8px; margin: 15px 0;" />` : ''}
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fbd38d;">
              <h3 style="margin: 0; color: #1f2937;">${recommendedItem.name}</h3>
              <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">from ${recommendedItem.category.vendor.name}</p>
              <p style="margin: 10px 0 0; font-weight: bold; color: #f97316;">₹${recommendedItem.price}</p>
            </div>
            <a href="https://foodzie.store/shop/${recommendedItem.category.vendor.id}?add_item=${recommendedItem.id}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Order Now</a>
          </div>
        `
      });
      console.log(`Sent daily recommendation to ${student.email}`);
    } catch (err) {
      console.error("Failed to send Resend email", err);
    }
  }
}
