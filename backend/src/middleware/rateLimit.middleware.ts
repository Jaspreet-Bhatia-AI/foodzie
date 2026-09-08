import rateLimit from "express-rate-limit";

// Rate limiter for authentication routes (login/register)
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // limit each IP to 15 login/register requests per minute
  message: {
    error: "Too many login or registration attempts. Please try again in a minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for general API routes
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // limit each IP to 200 requests per minute
  message: {
    error: "Too many requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
