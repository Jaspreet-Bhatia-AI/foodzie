import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

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
      items: cat.items.map((item) => ({
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
      })),
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
    categories: vendor.categories.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      items: cat.items.map((item) => ({
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
      })),
    })),
  });
}
