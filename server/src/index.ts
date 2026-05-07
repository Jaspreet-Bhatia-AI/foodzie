import express, { Application, Request, Response, NextFunction } from "express";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import { initSocket } from "./lib/socket";

// ─── Load environment variables ───────────────────────────────────────────────
dotenv.config();

// ─── Route Imports ────────────────────────────────────────────────────────────
import authRouter from "./routes/auth.routes";
import vendorRouter from "./routes/vendor.routes";
import menuRouter from "./routes/menu.routes";
import paymentRouter from "./routes/payment.routes";
import orderRouter from "./routes/order.routes";

// ─── Socket.io Handler ───────────────────────────────────────────────────────
import { registerLocationHandlers } from "./sockets/location.socket";

const app: Application = express();
const httpServer = createServer(app);
const PORT = process.env.PORT ?? 5000;

// ─── CORS Configuration ───────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} is not allowed`));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({
  verify: (req: any, res, buf) => {
    if (req.originalUrl.includes("/api/payment/webhook")) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: true }));

// ─── Socket.io Setup ──────────────────────────────────────────────────────────
const io = initSocket(httpServer, allowedOrigins);

registerLocationHandlers(io);

// ─── Health & Root Routes ─────────────────────────────────────────────────────
app.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "🍔 Foodzie API is running",
    version: "1.0.0",
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Feature Routers ──────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/vendor", vendorRouter);
app.use("/api/menu", menuRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/orders", orderRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Foodzie Error]", err.message);
  res.status(500).json({ error: err.message ?? "Internal server error" });
});

// ─── Start Server (httpServer instead of app.listen for Socket.io) ────────────
httpServer.listen(PORT, () => {
  console.log(`🚀 Foodzie server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.io attached on the same port`);
});

export default app;
