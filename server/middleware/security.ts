/**
 * Security Middleware — Rate Limiting, Helmet, Secure Headers
 * Protects against brute force, DDoS, and common web vulnerabilities.
 */
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import type { Express, Request, Response, NextFunction } from "express";

// Global rate limiter: 300 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

// Strict rate limiter for auth endpoints: 10 requests per minute
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Please wait before trying again." },
});

// Webhook rate limiter: 50 requests per minute (Stripe/PayPal webhooks)
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Webhook rate limit exceeded." },
});

// Sanitize request body — neutralize active script vectors while PRESERVING
// legitimate markup and text. The previous version stripped ALL tags from
// every tRPC body, which silently destroyed blog contentHtml on save and
// mangled any text containing "<" (e.g. "spread < 3.5").
function sanitizeValue(value: any): any {
  if (typeof value === "string") {
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/\son\w+\s*=\s*(["'])[^"']*\1/gi, "")
      .replace(/javascript\s*:/gi, "");
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === "object") {
    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }
  return value;
}

function inputSanitizer(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  next();
}

// Register all security middleware on the Express app
export function registerSecurityMiddleware(app: Express) {
  // Helmet for secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.)
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disabled for SPA compatibility (Vite injects inline scripts)
      crossOriginEmbedderPolicy: false, // Allow embedding external resources
      crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow CDN assets
    })
  );

  // HSTS header (force HTTPS in production)
  if (process.env.NODE_ENV === "production") {
    app.use((_req: Request, res: Response, next: NextFunction) => {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
      next();
    });
  }

  // Global rate limiter on API routes
  app.use("/api/trpc", globalLimiter);

  // Strict rate limiter on auth-related tRPC calls.
  // NOTE: tRPC batches requests as /api/trpc/proc1,proc2?batch=1 — a
  // path-mounted limiter on "/api/trpc/auth.login" is trivially bypassed by
  // batching auth.login behind another procedure. Inspect the full URL instead.
  app.use("/api/trpc", (req: Request, res: Response, next: NextFunction) => {
    if (/auth\.(login|register)/.test(req.originalUrl)) {
      return authLimiter(req, res, next);
    }
    next();
  });

  // Webhook rate limiter
  app.use("/api/stripe/webhook", webhookLimiter);
  app.use("/api/paypal/webhook", webhookLimiter);

  // Input sanitization (after body parser, before tRPC)
  app.use("/api/trpc", inputSanitizer);

  // Prevent sensitive info leakage
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.removeHeader("X-Powered-By");
    next();
  });
}
