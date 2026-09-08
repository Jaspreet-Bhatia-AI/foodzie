import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

import { GoogleGenerativeAI } from "@google/generative-ai";


// ─── GET /api/menu/universities ───────────────────────────────────────────────
export async function getUniversities(req: Request, res: Response): Promise<void> {
  const { lat, lng } = req.query;
  
  let universities = await prisma.university.findMany({
    orderBy: { name: "asc" },
  });

  // If coordinates are provided, sort by distance using Haversine formula
  if (lat && lng && typeof lat === 'string' && typeof lng === 'string') {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    if (!isNaN(userLat) && !isNaN(userLng)) {
      universities = universities.map(uni => {
        let distance = Infinity;
        if (uni.lat !== null && uni.lng !== null) {
          distance = calculateDistance(userLat, userLng, uni.lat, uni.lng);
        }
        return { ...uni, distance };
      }).sort((a, b) => a.distance - b.distance)
        .map(uni => {
          // Remove the temporary distance field before returning
          const { distance, ...rest } = uni;
          return rest as any;
        });
    }
  }

  res.json({ universities });
}

// Haversine formula to calculate distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// ─── GET /api/menu/:universityId ──────────────────────────────────────────────
export async function getUniversityMenu(req: Request, res: Response): Promise<void> {
  const { universityId } = req.params;

  const university = await prisma.university.findUnique({
    where: { id: universityId },
    include: {
      users: {
        where: { role: "Vendor" },
        select: {
          id: true,
          name: true,
          profilePicUrl: true,
          categories: {
            select: {
              id: true,
              name: true,
              items: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  price: true,
                  imageUrl: true,
                  prepTimeMins: true,
                  isCooked: true,
                  stock: true,
                  isVegetarian: true,
                  discountPercent: true,

                  discountStart: true,
                  discountEnd: true,
                  reviews: {
                    select: {
                      rating: true,
                      comment: true,
                      createdAt: true,
                      student: { select: { name: true } }
                    }
                  }
                },
                orderBy: { name: "asc" },
              },
            },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!university) {
    res.status(404).json({ error: "University not found" });
    return;
  }

  const vendors = university.users.map((vendor) => ({
    vendorId: vendor.id,
    vendorName: vendor.name,
    vendorLogoUrl: vendor.profilePicUrl,
    categories: vendor.categories.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      items: cat.items.map((item) => {
        const totalRating = item.reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = item.reviews.length > 0 ? (totalRating / item.reviews.length).toFixed(1) : "0.0";
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          imageUrl: item.imageUrl,
          prepTimeMins: item.prepTimeMins,
          isCooked: item.isCooked,
          stock: item.stock,
          isVegetarian: item.isVegetarian,
          discount: item.discountPercent
            ? {
                percent: item.discountPercent,
                validFrom: item.discountStart,
                validTo: item.discountEnd,
                effectivePrice:
                  item.discountPercent > 0
                    ? parseFloat(
                        (item.price * (1 - item.discountPercent / 100)).toFixed(2)
                      )
                    : item.price,
              }
            : null,
          reviews: item.reviews.map((r) => ({
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt,
            customerName: r.student.name,
          })),
          averageRating: parseFloat(averageRating),
          reviewCount: item.reviews.length,
        };
      }),
    })),
  }));

  res.json({
    universityId: university.id,
    universityName: university.name,
    universityAddress: university.address,
    city: university.city,
    country: university.country,
    vendors,
  });
}

// ─── GET /api/menu/vendor/:vendorId ───────────────────────────────────────────
export async function getVendorMenu(req: Request, res: Response): Promise<void> {
  const { vendorId } = req.params;

  const vendor = await prisma.user.findUnique({
    where: { id: vendorId, role: "Vendor" },
    select: {
      id: true,
      name: true,
      profilePicUrl: true,
      universityId: true,
      vendorUpi: true,
      upi: true,
      categories: {
        select: {
          id: true,
          name: true,
          items: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              imageUrl: true,
              prepTimeMins: true,
              isCooked: true,
              stock: true,
              isVegetarian: true,
              discountPercent: true,
              discountStart: true,
              discountEnd: true,
              reviews: {
                select: {
                  rating: true,
                  comment: true,
                  createdAt: true,
                  student: { select: { name: true } }
                }
              }
            },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!vendor) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }

  res.json({
    vendorId: vendor.id,
    vendorName: vendor.name,
    vendorLogoUrl: vendor.profilePicUrl,
    universityId: vendor.universityId,
    vendorUpi: vendor.vendorUpi || vendor.upi,
    categories: vendor.categories.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      items: cat.items.map((item) => {
        const totalRating = item.reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = item.reviews.length > 0 ? (totalRating / item.reviews.length).toFixed(1) : "0.0";
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          imageUrl: item.imageUrl,
          prepTimeMins: item.prepTimeMins,
          isCooked: item.isCooked,
          stock: item.stock,
          isVegetarian: item.isVegetarian,
          discount: item.discountPercent
            ? {
                percent: item.discountPercent,
                validFrom: item.discountStart,
                validTo: item.discountEnd,
                effectivePrice:
                  item.discountPercent > 0
                    ? parseFloat(
                        (item.price * (1 - item.discountPercent / 100)).toFixed(2)
                      )
                    : item.price,
              }
            : null,
          reviews: item.reviews.map((r) => ({
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt,
            customerName: r.student.name,
          })),
          averageRating: parseFloat(averageRating),
          reviewCount: item.reviews.length,
        };
      }),
    })),
  });
}


export async function getVendorLeaderboard(req: Request, res: Response): Promise<void> {
  try {
    const { vendorId } = req.params;
    
    // Helper to mask names (e.g., "Jaspreet Bhatia" -> "Jaspreet B.")
    const maskName = (name: string) => {
      if (!name) return "Anonymous";
      const parts = name.trim().split(" ");
      if (parts.length > 1) {
        return `${parts[0]} ${parts[parts.length - 1][0]}.`;
      }
      return name;
    };

    const now = new Date();
    
    // Current Month bounds
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Last Month bounds
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Fetch all delivered/completed orders for this vendor from start of last month
    const orders = await prisma.order.findMany({
      where: {
        vendorId,
        status: { in: ['Delivered', 'Completed'] },
        createdAt: { gte: startOfLastMonth }
      },
      include: { customer: { select: { id: true, name: true } } }
    });

    const currentMonthSpend = new Map<string, { id: string, name: string, spent: number, orders: number }>();
    const lastMonthSpend = new Map<string, { id: string, name: string, spent: number, orders: number }>();

    orders.forEach(o => {
      const isCurrentMonth = o.createdAt >= startOfCurrentMonth;
      const mapToUse = isCurrentMonth ? currentMonthSpend : lastMonthSpend;
      
      const cId = o.customer.id;
      if (!mapToUse.has(cId)) {
        mapToUse.set(cId, { id: cId, name: maskName(o.customer.name), spent: 0, orders: 0 });
      }
      const data = mapToUse.get(cId)!;
      data.spent += o.totalAmount;
      data.orders += 1;
    });

    const currentMonthTop10 = Array.from(currentMonthSpend.values())
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 10);
      
    const lastMonthTop3 = Array.from(lastMonthSpend.values())
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 3);

    res.json({
      currentMonthTop10,
      lastMonthTop3
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}


// ─── POST /api/menu/vendor/:vendorId/cross-sell ──────────────────────────────
export async function getCrossSell(req: Request, res: Response): Promise<void> {
  try {
    const { vendorId } = req.params;
    const { cartItemIds } = req.body; // array of string IDs

    if (!cartItemIds || cartItemIds.length === 0) {
      res.json({ recommendation: null });
      return;
    }

    // 1. Find orders that contain at least one of these items
    const relatedOrders = await prisma.order.findMany({
      where: {
        vendorId,
        items: { some: { foodItemId: { in: cartItemIds } } }
      },
      include: { items: { include: { foodItem: true } } }
    });

    // 2. Count frequency of OTHER items in these orders
    const frequency = new Map<string, { count: number, item: any }>();
    
    relatedOrders.forEach(order => {
      order.items.forEach(orderItem => {
        const fId = orderItem.foodItemId;
        if (!cartItemIds.includes(fId) && orderItem.foodItem) {
          if (!frequency.has(fId)) {
            frequency.set(fId, { count: 0, item: orderItem.foodItem });
          }
          frequency.get(fId)!.count += 1;
        }
      });
    });

    // 3. Get top item
    const sorted = Array.from(frequency.values()).sort((a, b) => b.count - a.count);
    
    if (sorted.length > 0) {
      res.json({ recommendation: sorted[0].item });
    } else {
      // Fallback: Just return a random popular item not in cart
      const fallback = await prisma.foodItem.findFirst({
        where: { category: { vendorId }, id: { notIn: cartItemIds } }
      });
      res.json({ recommendation: fallback });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// ─── POST /api/menu/vendor/:vendorId/ai-recommend ────────────────────────────
export async function getAiRecommendation(req: Request, res: Response): Promise<void> {
  try {
    const { vendorId } = req.params;
    const { query } = req.body;

    if (!query) {
      res.status(400).json({ error: "Query is required" });
      return;
    }

    // Fetch the menu and reviews to give context to the AI
    const menuItems = await prisma.foodItem.findMany({
      where: { category: { vendorId } },
      include: {
        reviews: { select: { rating: true, comment: true }, take: 3 }
      }
    });

    const contextMenu = menuItems.map(item => {
      const reviewText = item.reviews.filter(r => r.comment).map(r => r.comment).join(" | ");
      return `ID: ${item.id}, Name: ${item.name}, Price: ₹${item.price}, Desc: ${item.description || 'N/A'}, Reviews: ${reviewText || 'None'}`;
    }).join("\n");

    // Check for API key
    if (!process.env.GEMINI_API_KEY) {
      // Graceful fallback if no key
      res.json({ 
        message: "AI recommends:", 
        items: menuItems.slice(0, 3) 
      });
      return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are a helpful AI Waiter for a campus canteen.
A student just asked: "${query}"

Here is the current menu with reviews:
${contextMenu}

Based ONLY on the menu above and their vibe/request, pick the top 3 best matching items.
Return ONLY a valid JSON array of strings containing the exact item IDs, like this:
["id1", "id2", "id3"]
Do not add markdown formatting, just the raw JSON array.`;

    const result = await model.generateContent(prompt);
    let textResponse = result.response.text().trim();
    
    // Strip markdown if AI added it
    if (textResponse.startsWith("```json")) textResponse = textResponse.slice(7);
    if (textResponse.startsWith("```")) textResponse = textResponse.slice(3);
    if (textResponse.endsWith("```")) textResponse = textResponse.slice(0, -3);
    
    const recommendedIds = JSON.parse(textResponse.trim());
    
    const recommendedItems = menuItems.filter(i => recommendedIds.includes(i.id));

    res.json({
      message: "Here is what I recommend based on your vibe!",
      items: recommendedItems.length > 0 ? recommendedItems : menuItems.slice(0, 3)
    });
  } catch (error: any) {
    console.error("AI Gen Error:", error);
    res.status(500).json({ error: error.message });
  }
}
