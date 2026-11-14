import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { createServer, type Server } from "node:http";

const config = JSON.parse(
  readFileSync(new URL("../vercel.json", import.meta.url), "utf8")
);
let server: Server;
let origin: string;

beforeAll(async () => {
  vi.stubEnv("VERCEL", "1");
  vi.stubEnv("JWT_SECRET", "test-only-vercel-session-secret-32-chars");
  const { createApp } = await import("./_core/app");
  const initialized = await createApp({ serverless: true });
  expect(initialized.server.listening).toBe(false);
  const { default: handler } = await import("../api/index.js");
  server = createServer(handler);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Test port unavailable");
  origin = `http://127.0.0.1:${address.port}`;
}, 20_000);

afterAll(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
  vi.unstubAllEnvs();
});

describe("Vercel existing Express backend", () => {
  it("returns JSON health rather than an HTML 200", async () => {
    const response = await fetch(`${origin}/health`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toMatchObject({ status: "ok" });
  });

  it("serves the actual tRPC auth contract for anonymous visitors", async () => {
    const response = await fetch(`${origin}/api/trpc/auth.me`);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      result: { data: { json: null } },
    });
  });

  it("does not expose scheduled social posts or payouts on the function", async () => {
    const response = await fetch(`${origin}/api/scheduled/distribute-payouts`, {
      method: "POST",
    });
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: "Scheduled jobs require the dedicated worker",
    });
  });

  it("returns JSON 404 for nonexistent API paths", async () => {
    const response = await fetch(`${origin}/api/does-not-exist`);
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
  });
});

describe("Vercel routing guardrails", () => {
  const rewrites = config.rewrites as { source: string; destination: string }[];
  const spa = rewrites.find(rule => rule.destination === "/index.html")!;
  const spaPattern = new RegExp(`^${spa.source}$`);

  it("routes backend paths before the SPA fallback", () => {
    for (const source of [
      "/api/:path*",
      "/health",
      "/openapi.json",
      "/manus-storage/:path*",
    ]) {
      expect(rewrites.find(rule => rule.source === source)?.destination).toBe(
        "/api/index"
      );
    }
    expect(rewrites.at(-1)).toBe(spa);
  });

  it("allows client routes but does not mask missing assets or verification files", () => {
    for (const path of [
      "/signup",
      "/login",
      "/picks",
      "/tools/odds-calculator",
      "/api-access",
    ]) {
      expect(spaPattern.test(path)).toBe(true);
    }
    for (const path of [
      "/api/trpc/auth.me",
      "/assets/missing.js",
      "/missing.png",
      "/robots.txt",
      "/.well-known/apple-app-site-association",
    ]) {
      expect(spaPattern.test(path)).toBe(false);
    }
  });

  it("canonicalizes www and configures path-preserving legacy redirects", () => {
    for (const host of [
      "www.chalkpicks.pro",
      "chalkpicks.live",
      "www.chalkpicks.live",
    ]) {
      const rule = config.redirects.find(
        (r: { has: { value: string }[] }) => r.has[0].value === host
      );
      expect(rule.destination).toBe("https://chalkpicks.pro/:path*");
      expect(rule.source).toBe("/:path*");
      expect(rule.permanent === true || rule.statusCode === 301).toBe(true);
    }
  });
});
