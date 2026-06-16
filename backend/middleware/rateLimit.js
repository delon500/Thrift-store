import rateLimit from "express-rate-limit";

// Throttles login attempts per IP to blunt brute-force / credential-stuffing.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 *failed* attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only failed logins count toward the limit
  message: {
    message: "Too many login attempts. Please try again in a few minutes.",
  },
});

export { loginLimiter };
