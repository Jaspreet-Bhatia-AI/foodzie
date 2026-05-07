import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const SALT_ROUNDS = 12;

// ─── Register ─────────────────────────────────────────────────────────────────
export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password, phone, role, universityName, lat, lng } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: "name, email, and password are required" });
    return;
  }

  const validRoles = ["Student", "Vendor", "Delivery"];
  if (role && !validRoles.includes(role)) {
    res.status(400).json({ error: `role must be one of: ${validRoles.join(", ")}` });
    return;
  }

  // Check for duplicate email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "A user with this email already exists" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  let finalUniversityId: string | null = null;
  let finalUniversityName: string | null = null;

  if (universityName) {
    const uni = await prisma.university.upsert({
      where: { name: universityName.trim() },
      update: {},
      create: { 
        name: universityName.trim(),
        lat: typeof lat === 'number' ? lat : null,
        lng: typeof lng === 'number' ? lng : null
      },
    });
    finalUniversityId = uni.id;
    finalUniversityName = uni.name;
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone: phone ?? null,
      role: role ?? "Student",
      universityId: finalUniversityId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      universityId: true,
      createdAt: true,
    },
  });

  const token = signToken(user.id, user.role, finalUniversityName);

  res.status(201).json({ user: { ...user, universityName: finalUniversityName }, token });
}

// ─── Login ────────────────────────────────────────────────────────────────────
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const user = await prisma.user.findUnique({ 
    where: { email },
    include: { university: true }
  });

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken(user.id, user.role, user.university?.name ?? null);

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      universityId: user.universityId,
      universityName: user.university?.name ?? null,
    },
    token,
  });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { university: true }
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      universityId: user.universityId,
      universityName: user.university?.name ?? null,
      vendorDescription: user.vendorDescription,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { name, phone, universityName, vendorDescription } = req.body;

    let finalUniversityId = undefined;
    if (universityName) {
      const uni = await prisma.university.upsert({
        where: { name: universityName.trim() },
        update: {},
        create: { name: universityName.trim() },
      });
      finalUniversityId = uni.id;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        phone,
        universityId: finalUniversityId,
        vendorDescription,
      },
      include: { university: true }
    });

    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      universityId: updatedUser.universityId,
      universityName: updatedUser.university?.name ?? null,
      vendorDescription: updatedUser.vendorDescription,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function signToken(userId: string, role: string, universityName: string | null): string {
  const secret = process.env.JWT_SECRET!;
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"];

  return jwt.sign({ sub: userId, role, universityName }, secret, { expiresIn });
}
