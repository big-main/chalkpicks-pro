import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

// Source guards intentionally avoid provider calls and preserve historical docs.
// The active Manus -> GitHub -> Vercel path is covered by vercelDeployment.test.ts.
describe("Historic Railway deployment runtime retirement", () => {
  it("does not import or register Railway controls in production API entrypoints", () => {
    for (const path of [
      "./routers.ts",
      "./_core/app.ts",
      "./_core/vercelHandler.ts",
      "./_core/index.ts",
      "../api/index.js",
    ]) {
      expect(source(path), path).not.toMatch(/railway/i);
    }
  });

  it("does not import, mount, or call Railway controls in the admin UI", () => {
    expect(source("../client/src/pages/AdminStats.tsx")).not.toMatch(
      /railway/i
    );
  });

  it("keeps obsolete runtime files and their provider probe retired", () => {
    for (const path of [
      "./routers/railway.ts",
      "../client/src/components/RailwayStatusWidget.tsx",
      "./railway.test.ts",
    ]) {
      expect(existsSync(new URL(path, import.meta.url)), path).toBe(false);
    }
  });
});
