import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// ─── GET /api/vendor/categories ───────────────────────────────────────────────
export async function getCategories(req: Request, res: Response): Promise<void> {
  const vendorId = req.user!.sub;

  const categories = await prisma.category.findMany({
    where: { vendorId },
    include: { items: true },
    orderBy: { name: "asc" },
  });

  res.json({ categories });
}

// ─── POST /api/vendor/categories ─────────────────────────────────────────────
export async function createCategory(req: Request, res: Response): Promise<void> {
  const vendorId = req.user!.sub;
  const { name } = req.body;

  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const category = await prisma.category.create({
    data: { name, vendorId },
  });

  res.status(201).json({ category });
}

// ─── PATCH /api/vendor/categories/:id ────────────────────────────────────────
export async function updateCategory(req: Request, res: Response): Promise<void> {
  const vendorId = req.user!.sub;
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  // Ownership check
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  if (existing.vendorId !== vendorId) {
    res.status(403).json({ error: "You do not own this category" });
    return;
  }

  const category = await prisma.category.update({
    where: { id },
    data: { name },
  });

  res.json({ category });
}

// ─── DELETE /api/vendor/categories/:id ───────────────────────────────────────
export async function deleteCategory(req: Request, res: Response): Promise<void> {
  const vendorId = req.user!.sub;
  const { id } = req.params;

  // Ownership check
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  if (existing.vendorId !== vendorId) {
    res.status(403).json({ error: "You do not own this category" });
    return;
  }

  // Cascade delete: remove items first (no onDelete: Cascade in schema)
  await prisma.foodItem.deleteMany({ where: { categoryId: id } });
  await prisma.category.delete({ where: { id } });

  res.json({ message: "Category and its food items deleted successfully" });
}
