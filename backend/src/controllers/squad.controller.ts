import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { getIO } from "../lib/socket";

async function enrichCart(cart: any) {
  if (!cart || !cart.items) return cart;
  
  const foodItemIds = cart.items.map((i: any) => i.foodItemId);
  const foodItems = await prisma.foodItem.findMany({
    where: { id: { in: foodItemIds } }
  });
  
  const formattedItems = cart.items.map((cartItem: any) => {
    const fi = foodItems.find(f => f.id === cartItem.foodItemId);
    return {
      id: cartItem.foodItemId, 
      squadCartItemId: cartItem.id,
      name: fi?.name || 'Unknown Item',
      price: fi?.price || 0,
      quantity: cartItem.quantity,
      imageUrl: fi?.imageUrl || null,
      isVegetarian: fi?.isVegetarian ?? true,
      addedById: cartItem.addedById,
    };
  });
  
  const totalAmount = formattedItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
  
  return {
    ...cart,
    items: formattedItems,
    totalAmount
  };
}

export async function createSquadCart(req: Request, res: Response): Promise<void> {
  try {
    const { vendorId } = req.body;
    const creatorId = req.user!.sub;

    if (!vendorId) {
      res.status(400).json({ success: false, message: "vendorId is required" });
      return;
    }

    const cart = await prisma.squadCart.create({
      data: {
        vendorId,
        creatorId,
        isActive: true,
      },
    });

    res.status(201).json({ success: true, id: cart.id });
  } catch (error: any) {
    console.error("Error creating SquadCart:", error.message);
    res.status(500).json({ success: false, message: "Failed to create squad cart" });
  }
}

export async function getSquadCart(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const cart = await prisma.squadCart.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!cart) {
      res.status(404).json({ success: false, message: "Squad cart not found" });
      return;
    }

    const enriched = await enrichCart(cart);
    res.status(200).json({ success: true, cart: enriched, items: enriched.items, totalAmount: enriched.totalAmount });
  } catch (error: any) {
    console.error("Error getting SquadCart:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch squad cart" });
  }
}

export async function addToSquadCart(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { foodItemId, quantity } = req.body;
    const addedById = req.user!.sub;

    if (!foodItemId || quantity == null) {
      res.status(400).json({ success: false, message: "foodItemId and quantity are required" });
      return;
    }

    const cart = await prisma.squadCart.findUnique({ where: { id } });
    if (!cart || !cart.isActive) {
      res.status(400).json({ success: false, message: "Squad cart not found or inactive" });
      return;
    }

    const existingItem = await prisma.squadCartItem.findFirst({
      where: {
        cartId: id,
        foodItemId,
        addedById,
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity <= 0) {
        await prisma.squadCartItem.delete({
          where: { id: existingItem.id }
        });
      } else {
        await prisma.squadCartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
        });
      }
    } else if (quantity > 0) {
      await prisma.squadCartItem.create({
        data: {
          cartId: id,
          foodItemId,
          quantity,
          addedById,
        },
      });
    }

    const updatedCart = await prisma.squadCart.findUnique({
      where: { id },
      include: { items: true },
    });
    
    const enriched = await enrichCart(updatedCart);

    try {
      const io = getIO();
      io.to(`squad:${id}`).emit("squadCartUpdated", { cart: enriched });
    } catch (socketError: any) {
      console.warn("Socket emission failed, possibly not initialized:", socketError.message);
    }

    res.status(200).json({ success: true, cart: enriched, items: enriched.items, totalAmount: enriched.totalAmount });
  } catch (error: any) {
    console.error("Error adding to SquadCart:", error.message);
    res.status(500).json({ success: false, message: "Failed to add to squad cart" });
  }
}
