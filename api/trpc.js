import "dotenv/config";
import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const trpcHandler = createHTTPHandler({
  router: appRouter,
  basePath: "/",
  createContext: ({ req, res }) => createContext({ req, res }),
});

export default function handler(req, res) {
  // vercel.json rewrites /api/trpc/<procedure> to this exact function and
  // carries the original procedure in ?procedure=. Rebuild the URL that the
  // native Node adapter uses to identify the tRPC procedure.
  const procedure = typeof req.query?.procedure === "string" ? req.query.procedure : "";
  if (procedure) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query ?? {})) {
      if (key === "procedure") continue;
      if (Array.isArray(value)) {
        for (const item of value) query.append(key, String(item));
      } else if (value !== undefined) {
        query.set(key, String(value));
      }
    }
    req.url = `/${procedure}${query.toString() ? `?${query}` : ""}`;
  }
  return trpcHandler(req, res);
}
