import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));

const trpcMiddleware = createExpressMiddleware({
  router: appRouter,
  createContext,
});

app.use((req, res, next) => {
  // vercel.json rewrites /api/trpc/<procedure> to this exact function and
  // carries the original procedure in ?procedure=. Preserve all other query
  // parameters, including tRPC's batch/input payload.
  const procedure = typeof req.query.procedure === "string" ? req.query.procedure : "";
  if (procedure) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (key === "procedure") continue;
      if (Array.isArray(value)) {
        for (const item of value) query.append(key, String(item));
      } else if (value !== undefined) {
        query.set(key, String(value));
      }
    }
    req.url = `/${procedure}${query.toString() ? `?${query}` : ""}`;
  }
  return trpcMiddleware(req, res, next);
});

export default app;
