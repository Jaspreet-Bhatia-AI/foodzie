import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// POST /api/reviews
export async function submitReview(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user!.sub;
    const { rating, comment, type, canteenId, foodItemId, orderId } = req.body;

    const valRating = Number(rating);
    if (isNaN(valRating) || valRating < 1 || valRating > 5) {
      res.status(400).json({ error: "Rating must be between 1 and 5 stars" });
      return;
    }

    const validTypes = ["Canteen", "FoodItem", "Platform"];
    if (!type || !validTypes.includes(type)) {
      res.status(400).json({ error: "Invalid review type" });
      return;
    }


    if (type === "FoodItem" && foodItemId && orderId) {
      // VERIFIED PURCHASE CHECK
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          customerId: studentId,
          status: { in: ["Delivered", "Completed"] },
          items: {
            some: { foodItemId: foodItemId }
          }
        }
      });
      
      if (!order) {
        res.status(403).json({ error: "You can only review items you have successfully ordered and received." });
        return;
      }
      
      // Check if already reviewed
      const existing = await prisma.review.findFirst({
        where: { studentId, foodItemId, orderId }
      });
      if (existing) {
        res.status(400).json({ error: "You have already reviewed this item for this order." });
        return;
      }
    }


    const review = await prisma.review.create({
      data: {
        studentId,
        rating: valRating,
        comment: comment ? comment.trim() : null,
        type,
        canteenId: canteenId || null,
        foodItemId: foodItemId || null,
        orderId: orderId || null,
      },
    });

    res.status(201).json({
      success: true,
      id: review.id,
      message: "Review submitted successfully",
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// GET /api/reviews
export async function getReviews(req: Request, res: Response): Promise<void> {
  try {
    const { canteenId, foodItemId, type } = req.query;

    const conditions: any = {};
    if (canteenId) conditions.canteenId = String(canteenId);
    if (foodItemId) conditions.foodItemId = String(foodItemId);
    if (type) conditions.type = String(type);

    const reviews = await prisma.review.findMany({
      where: conditions,
      include: {
        student: {
          select: { name: true, profilePicUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Map output to match PHP naming format
    const formattedReviews = reviews.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      canteenId: r.canteenId,
      foodItemId: r.foodItemId,
      orderId: r.orderId,
      rating: r.rating,
      comment: r.comment,
      type: r.type,
      createdAt: r.createdAt,
      studentName: r.student.name,
      studentPic: r.student.profilePicUrl,
    }));

    const totalReviews = formattedReviews.length;
    let averageRating = 0;
    if (totalReviews > 0) {
      const sum = formattedReviews.reduce((acc, r) => acc + r.rating, 0);
      averageRating = Number((sum / totalReviews).toFixed(1));
    }

    res.json({
      reviews: formattedReviews,
      summary: {
        total: totalReviews,
        average: averageRating,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
