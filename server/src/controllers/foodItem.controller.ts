import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// ─── GET /api/vendor/items ────────────────────────────────────────────────────
export async function getFoodItems(req: Request, res: Response): Promise<void> {
  const vendorId = req.user!.sub;

  // Fetch all items across all of this vendor's categories
  const items = await prisma.foodItem.findMany({
    where: {
      category: { vendorId },
    },
    include: { category: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });

  res.json({ items });
}

// ─── POST /api/vendor/items ───────────────────────────────────────────────────
export async function createFoodItem(req: Request, res: Response): Promise<void> {
  const vendorId = req.user!.sub;
  const {
    name,
    description,
    price,
    imageUrl,
    prepTimeMins,
    isCooked,
    stock,
    discountPercent,
    discountStart,
    discountEnd,
    categoryId,
  } = req.body;

  if (!name || price === undefined || !categoryId) {
    res.status(400).json({ error: "name, price, and categoryId are required" });
    return;
  }

  // Ensure the category belongs to this vendor
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  if (category.vendorId !== vendorId) {
    res.status(403).json({ error: "You do not own this category" });
    return;
  }

  const item = await prisma.foodItem.create({
    data: {
      name,
      description: description ?? null,
      price: Number(price),
      imageUrl: imageUrl ?? null,
      prepTimeMins: prepTimeMins !== undefined ? Number(prepTimeMins) : 15,
      isCooked: isCooked !== undefined ? Boolean(isCooked) : true,
      // null means "cooked item – available"; 0 means out of stock; positive = packaged stock count
      stock: stock === null ? null : (stock !== undefined ? Number(stock) : null),
      discountPercent: discountPercent !== undefined ? Number(discountPercent) : null,
      discountStart: discountStart ? new Date(discountStart) : null,
      discountEnd: discountEnd ? new Date(discountEnd) : null,
      categoryId,
    },
  });

  res.status(201).json({ item });
}

// ─── PATCH /api/vendor/items/:id ──────────────────────────────────────────────
export async function updateFoodItem(req: Request, res: Response): Promise<void> {
  const vendorId = req.user!.sub;
  const { id } = req.params;

  // Ownership check via category → vendor chain
  const existing = await prisma.foodItem.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!existing) {
    res.status(404).json({ error: "Food item not found" });
    return;
  }
  if (existing.category.vendorId !== vendorId) {
    res.status(403).json({ error: "You do not own this food item" });
    return;
  }

  const {
    name,
    description,
    price,
    imageUrl,
    prepTimeMins,
    isCooked,
    stock,
    discountPercent,
    discountStart,
    discountEnd,
    categoryId,
  } = req.body;

  // If categoryId is being changed, verify the new category belongs to the same vendor
  if (categoryId && categoryId !== existing.categoryId) {
    const newCategory = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!newCategory || newCategory.vendorId !== vendorId) {
      res.status(403).json({ error: "Target category is invalid or not owned by you" });
      return;
    }
  }

  const item = await prisma.foodItem.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: Number(price) }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(prepTimeMins !== undefined && { prepTimeMins: Number(prepTimeMins) }),
      ...(isCooked !== undefined && { isCooked: Boolean(isCooked) }),
      // Handle stock carefully: null = cooked+available, 0 = out of stock, N = packaged count
      // MUST NOT use Number(null) as that coerces to 0 (the bug!)
      ...(stock !== undefined && { stock: stock === null ? null : Number(stock) }),
      ...(discountPercent !== undefined && { discountPercent: Number(discountPercent) }),
      ...(discountStart !== undefined && { discountStart: new Date(discountStart) }),
      ...(discountEnd !== undefined && { discountEnd: new Date(discountEnd) }),
      ...(categoryId !== undefined && { categoryId }),
    },
  });

  res.json({ item });
}

// ─── DELETE /api/vendor/items/:id ─────────────────────────────────────────────
export async function deleteFoodItem(req: Request, res: Response): Promise<void> {
  const vendorId = req.user!.sub;
  const { id } = req.params;

  const existing = await prisma.foodItem.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!existing) {
    res.status(404).json({ error: "Food item not found" });
    return;
  }
  if (existing.category.vendorId !== vendorId) {
    res.status(403).json({ error: "You do not own this food item" });
    return;
  }

  await prisma.foodItem.delete({ where: { id } });

  res.json({ message: "Food item deleted successfully" });
}
