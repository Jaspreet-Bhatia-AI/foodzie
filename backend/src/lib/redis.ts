import Redis from "ioredis";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../../.env") });

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const redis = new Redis(REDIS_URL);

redis.on("connect", () => {
  console.log("🔌 Connected to Redis successfully");
});

redis.on("error", (err: any) => {
  console.error("❌ Redis connection error:", err.message);
});
