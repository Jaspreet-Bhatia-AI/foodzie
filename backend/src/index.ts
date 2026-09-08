import { initCronJobs } from "./cron";
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
import orderRouter from "./routes/order.routes";
import adminRouter from "./routes/admin.routes";
import deliveryRouter from "./routes/delivery.routes";
import jobRouter from "./routes/job.routes";
import reviewRouter from "./routes/review.routes";
import squadRouter from "./routes/squad.routes";
import employeeRouter from "./routes/employee.routes";
import { apiRateLimiter } from "./middleware/rateLimit.middleware";

// ─── Socket.io Handler ───────────────────────────────────────────────────────
import { registerLocationHandlers } from "./sockets/location.socket";

const app: Application = express();
app.set("trust proxy", 1);
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
app.use(express.json());
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

// Apply Rate Limiting to all API routes
app.use("/api", apiRateLimiter);

// ─── Feature Routers ──────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/vendor", vendorRouter);
app.use("/api/menu", menuRouter);
app.use("/api/orders", orderRouter);
app.use("/api/admin", adminRouter);
app.use("/api/delivery", deliveryRouter);
app.use("/api/jobs", jobRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/squad", squadRouter);
app.use("/api/employees", employeeRouter);

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
  initCronJobs();
});

export default app;
