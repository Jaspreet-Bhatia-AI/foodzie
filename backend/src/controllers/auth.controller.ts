import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);
const SALT_ROUNDS = 12;

// Helper to sign access token (15m)
function signAccessToken(userId: string, role: string, universityName: string | null): string {
  const secret = process.env.JWT_SECRET!;
  return jwt.sign({ sub: userId, role, universityName }, secret, { expiresIn: "15m" });
}

// Helper to sign refresh token (7d)
function signRefreshToken(userId: string): string {
  const secret = process.env.JWT_SECRET!;
  return jwt.sign({ sub: userId, type: "refresh" }, secret, { expiresIn: "7d" });
}

// Helper to set refresh token in cookie
function setRefreshCookie(res: Response, token: string): void {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// ─── Register ─────────────────────────────────────────────────────────────────
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email: rawEmail, password, phone, role, universityName, lat, lng } = req.body;
    const email = rawEmail?.toLowerCase().trim();

    if (!name || !email || !password) {
      res.status(400).json({ error: "name, email, and password are required" });
      return;
    }

    let finalRole = role ?? "Student";
    if (finalRole === "Admin") {
      finalRole = "Student";
    }
    const validRoles = ["Student", "Vendor"];
    if (!validRoles.includes(finalRole)) {
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
        role: finalRole,
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

    // Seed default categories for new canteens/vendors (8 default categories)
    if (user.role === "Vendor") {
      const defaultCategories = [
        "Breakfast",
        "Snacks",
        "Meals",
        "Drinks",
        "Desserts",
        "Fast Food",
        "Bakery",
        "Chinese"
      ];
      await prisma.category.createMany({
        data: defaultCategories.map((name) => ({
          name,
          vendorId: user.id,
        })),
      });
    }

    
    // Send Welcome Email asynchronously
    (async () => {
      try {
        let emailHtml = "";
        if (user.role === "Vendor") {
          emailHtml = `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
              <h1 style="color: #ea580c;">Welcome to Foodzie, ${user.name}! 🏪</h1>
              <p>We are thrilled to have you partner with us to serve students at <strong>${finalUniversityName || 'your campus'}</strong>.</p>
              <h3 style="color: #c2410c;">As a Foodzie Vendor, you can:</h3>
              <ul>
                <li><strong>Track Analytics:</strong> See live earnings, top-selling items, and busy hours.</li>
                <li><strong>Manage Staff:</strong> Add riders and kitchen staff to handle high-volume orders.</li>
                <li><strong>Delay Management:</strong> Seamlessly handle kitchen delays by pushing a button to adjust ETA.</li>
                <li><strong>Scheduled Pre-Orders:</strong> See exactly what to cook before students even arrive.</li>
              </ul>
              <p>Log in to your vendor dashboard to start setting up your menu!</p>
            </div>
          `;
        } else if (user.role === "Student") {
          emailHtml = `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
              <h1 style="color: #ea580c;">Welcome to Foodzie, ${user.name}! 🎓</h1>
              <p>Your campus food just got a massive upgrade.</p>
              <h3 style="color: #c2410c;">Here's what you can do with Foodzie:</h3>
              <ul>
                <li><strong>Zero Wait Times:</strong> Order from your dorm and pick up exactly when it's hot.</li>
                <li><strong>Squad Orders:</strong> Invite your roommates to add to a shared multiplayer cart!</li>
                <li><strong>Scheduled Pre-Orders:</strong> Order lunch during your 9AM lecture and have it ready at noon.</li>
                <li><strong>Campus Credits:</strong> Instantly get refunds straight to your wallet if an order is cancelled.</li>
              </ul>
              <p>Head over to the shop and see what's cooking at <strong>${finalUniversityName || 'your campus'}</strong>!</p>
            </div>
          `;
        }
        if (emailHtml) {
          await resend.emails.send({
            from: "Foodzie <admin@foodzie.store>",
            to: user.email,
            subject: `Welcome to Foodzie, ${user.name}!`,
            html: emailHtml
          });
        }
      } catch (err) {
        console.error("Failed to send welcome email", err);
      }
    })();

    const accessToken = signAccessToken(user.id, user.role, finalUniversityName);
    const refreshToken = signRefreshToken(user.id);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      user: { ...user, universityName: finalUniversityName },
      token: accessToken
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email: rawEmail, password } = req.body;
    const email = rawEmail?.toLowerCase().trim();

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

    const accessToken = signAccessToken(user.id, user.role, user.university?.name ?? null);
    const refreshToken = signRefreshToken(user.id);
    setRefreshCookie(res, refreshToken);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        universityId: user.universityId,
        universityName: user.university?.name ?? null,
      },
      token: accessToken,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// ─── Get Current User ─────────────────────────────────────────────────────────
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;

    if (userId === "admin-system-id") {
      res.json({
        id: "admin-system-id",
        name: "Foodzie Admin",
        email: "bhatiajaspreet161@gmail.com",
        phone: null,
        role: "Admin",
        universityId: null,
        universityName: null,
        vendorDescription: null,
      });
      return;
    }

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
      earnedCredits: user.earnedCredits,
      refundedCredits: user.refundedCredits,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// ─── Update User Profile ──────────────────────────────────────────────────────
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

// ─── Refresh Token (GET /api/auth/refresh) ────────────────────────────────────
export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const cookies = req.headers.cookie?.split(";").reduce((acc: any, c) => {
      const [key, val] = c.trim().split("=");
      acc[key] = val;
      return acc;
    }, {});
    
    const refreshToken = cookies?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ error: "Refresh token missing" });
      return;
    }

    const secret = process.env.JWT_SECRET!;
    const decoded = jwt.verify(refreshToken, secret) as any;

    if (!decoded || decoded.type !== "refresh") {
      res.status(401).json({ error: "Invalid refresh token type" });
      return;
    }

    const userId = decoded.sub;
    let userRole = "Student";
    let universityName = null;

    if (userId === "admin-system-id") {
      userRole = "Admin";
    } else {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { university: true },
      });

      if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
      }
      userRole = user.role;
      universityName = user.university?.name ?? null;
    }

    const newAccessToken = signAccessToken(userId, userRole, universityName);
    res.json({ token: newAccessToken });
  } catch (error: any) {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
}

// ─── Logout (POST /api/auth/logout) ───────────────────────────────────────────
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// ─── Change Password ──────────────────────────────────────────────────────────
export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "currentPassword and newPassword are required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const passwordValid = await bcrypt.compare(currentPassword, user.password);
    if (!passwordValid) {
      res.status(401).json({ error: "Invalid current password" });
      return;
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour
    await prisma.user.update({
      where: { email },
      data: { resetToken: token, resetTokenExpiry: expiry }
    });
    
    await resend.emails.send({
      from: 'Foodzie <support@foodzie.store>',
      to: email,
      subject: 'Reset Your Foodzie Password',
      html: `<p>Click <a href="http://localhost:3000/reset-password?token=${token}">here</a> to reset your password. This link expires in 1 hour.</p>`
    });
    res.json({ success: true, message: "Password reset email sent" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ error: "Token and new password are required" });
      return;
    }
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() }
      }
    });
    if (!user) {
      res.status(400).json({ error: "Invalid or expired token" });
      return;
    }
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null }
    });
    res.json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function withdrawCredits(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user!.sub;
    const { amount, upiId } = req.body;

    if (!amount || amount <= 0 || !upiId) {
      res.status(400).json({ error: "Invalid amount or UPI ID" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: studentId } });
    if (!user || (user.refundedCredits || 0) < amount) {
      res.status(400).json({ error: "Insufficient refunded credits to withdraw. You can only withdraw refunded credits, not earned credits." });
      return;
    }

    const [withdrawal] = await prisma.$transaction([
      prisma.withdrawalRequest.create({
        data: {
          studentId,
          amount,
          upiId
        }
      }),
      prisma.user.update({
        where: { id: studentId },
        data: { refundedCredits: { decrement: amount } }
      })
    ]);

    res.json({ success: true, message: "Withdrawal request submitted successfully", withdrawal });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
