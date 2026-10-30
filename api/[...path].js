import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { registerStripeWebhook } from "../server/webhook";

const app = express();
app.set("trust proxy", 1);

// Stripe requires the raw request body for signature verification. This must
// be registered before any JSON parser.
registerStripeWebhook(app);

const trpcMiddleware = createExpressMiddleware({
  router: appRouter,
  createContext,
});

// Vercel preserves the /api prefix for catch-all functions. The /trpc mount
// is retained as a compatibility fallback for alternate function routing.
app.use("/api/trpc", express.json({ limit: "50mb" }));
app.use("/trpc", express.json({ limit: "50mb" }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));
app.use("/api/trpc", trpcMiddleware);
app.use("/trpc", trpcMiddleware);

const health = (_req, res) => {
  res.status(200).json({
    status: "ok",
    runtime: "vercel",
    timestamp: new Date().toISOString(),
  });
};
app.get(["/health", "/api/health"], health);

export default app;
