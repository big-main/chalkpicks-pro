import { describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import type { Request, Response, NextFunction } from "express";
import { canonicalDomainRedirect } from "./middleware/canonicalDomain";
import { SITE_URL } from "../shared/seo-routes";

function request(hostname: string, originalUrl = "/picks?league=nfl") {
  const redirect = vi.fn();
  const next = vi.fn();
  canonicalDomainRedirect(
    { hostname, originalUrl } as Request,
    { redirect } as unknown as Response,
    next as NextFunction
  );
  return { redirect, next };
}

describe("ChalkPicks .pro canonical domain", () => {
  it("does not redirect the active apex domain", () => {
    const { redirect, next } = request("chalkpicks.pro");
    expect(redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });
  it.each(["www.chalkpicks.pro", "chalkpicks.live", "www.chalkpicks.live"])(
    "preserves path, query and method from %s",
    hostname => {
      const { redirect, next } = request(
        hostname,
        "/api/trpc/auth.login?batch=1"
      );
      expect(redirect).toHaveBeenCalledWith(
        308,
        "https://chalkpicks.pro/api/trpc/auth.login?batch=1"
      );
      expect(next).not.toHaveBeenCalled();
    }
  );
  it("leaves Manus preview and hosting subdomains alone", () => {
    const { redirect, next } = request("chalkpicks-xui7hd5r.manus.space");
    expect(redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });
  it("publishes .pro in canonical SEO and sitemaps", () => {
    expect(SITE_URL).toBe("https://chalkpicks.pro");
    for (const file of [
      "../client/index.html",
      "../client/public/sitemap.xml",
      "../client/public/robots.txt",
    ]) {
      const text = readFileSync(new URL(file, import.meta.url), "utf8");
      expect(text).toContain("https://chalkpicks.pro");
      expect(text).not.toContain("https://chalkpicks.live");
    }
  });
  it("uses the canonical domain for notification links", () => {
    const source = readFileSync(
      new URL("./notificationService.ts", import.meta.url),
      "utf8"
    );
    expect(source).toContain("const APP_URL = SITE_URL");
    expect(source).not.toContain("process.env.APP_URL");
  });
  it("enables the tested backend deployment path", () => {
    const config = JSON.parse(
      readFileSync(new URL("../vercel.json", import.meta.url), "utf8")
    );
    expect(config.git.deploymentEnabled).toBe(true);
    expect(existsSync(new URL("../api/index.js", import.meta.url))).toBe(true);
  });
});
