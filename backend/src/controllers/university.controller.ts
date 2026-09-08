import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Haversine formula to calculate distance in km
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180);
}

// GET all active universities
export async function getActiveUniversities(req: Request, res: Response): Promise<void> {
  try {
    const universities = await prisma.university.findMany({
      where: {
        users: { some: { role: 'Vendor' } }
      },
      select: {
        id: true,
        name: true,
        lat: true,
        lng: true,
        areaName: true
      }
    });
    res.json({ universities });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// POST set location for university (Only vendors should call this when onboarding/updating)
export async function setUniversityLocation(req: Request, res: Response): Promise<void> {
  try {
    const vendorId = req.user!.sub;
    const { lat, lng, areaName } = req.body;

    if (!lat || !lng) {
      res.status(400).json({ error: "Latitude and Longitude are required" });
      return;
    }

    const vendor = await prisma.user.findUnique({ where: { id: vendorId }, include: { university: true } });
    if (!vendor || vendor.role !== 'Vendor') {
      res.status(403).json({ error: "Only vendors can update campus locations" });
      return;
    }

    if (!vendor.universityId) {
      res.status(400).json({ error: "Vendor is not assigned to a university" });
      return;
    }

    const updated = await prisma.university.update({
      where: { id: vendor.universityId },
      data: { lat, lng, areaName }
    });

    res.json({ success: true, university: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// POST find nearest university
export async function findNearestUniversity(req: Request, res: Response): Promise<void> {
  try {
    const { lat, lng } = req.body;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      res.status(400).json({ error: "Valid lat and lng are required" });
      return;
    }

    const universities = await prisma.university.findMany({
      where: { lat: { not: null }, lng: { not: null } }
    });

    let nearest = null;
    let minDistance = Infinity;

    for (const uni of universities) {
      const dist = getDistanceFromLatLonInKm(lat, lng, uni.lat!, uni.lng!);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = uni;
      }
    }

    // Default radius threshold: 10 km (students must be within 10km of campus)
    const MAX_RADIUS_KM = 10;
    
    if (nearest && minDistance <= MAX_RADIUS_KM) {
      res.json({ nearest, distanceKm: minDistance, isWithinRadius: true });
    } else if (nearest) {
      res.json({ nearest, distanceKm: minDistance, isWithinRadius: false });
    } else {
      res.status(404).json({ error: "No universities with known locations found" });
    }

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
