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

// Throttles sticker lookup/activation per IP so the sequential codes can't be
// enumerated (harvesting labels or claiming unclaimed stickers wholesale).
// Generous for legitimate use — a real user does a handful, not hundreds.
const tagActivationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many attempts. Please slow down and try again shortly.",
  },
});

// Staff sticker lookups while adding found items. Generous (legit bulk add-item
// sessions do many), but still caps mass enumeration of student names by code.
const stickerLookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many sticker lookups. Please slow down and try again shortly.",
  },
});

export { loginLimiter, tagActivationLimiter, stickerLookupLimiter };
