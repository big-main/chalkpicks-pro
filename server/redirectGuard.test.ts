/**
 * Tests for safeRedirectPath — the open-redirect guard used by the auth pages
 * to decide where to send a user after login/signup.
 */
import { describe, it, expect } from "vitest";
import { safeRedirectPath } from "@shared/utils";

describe("safeRedirectPath", () => {
  it("allows same-origin absolute paths", () => {
    expect(safeRedirectPath("/pricing")).toBe("/pricing");
    expect(safeRedirectPath("/picks?sport=nba")).toBe("/picks?sport=nba");
  });

  it("falls back for external and protocol-relative URLs", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/");
    expect(safeRedirectPath("//evil.com")).toBe("/");
    expect(safeRedirectPath("http://evil.com/path")).toBe("/");
  });

  it("falls back for relative (non-root) or empty values", () => {
    expect(safeRedirectPath("pricing")).toBe("/");
    expect(safeRedirectPath("")).toBe("/");
    expect(safeRedirectPath(null)).toBe("/");
    expect(safeRedirectPath(undefined)).toBe("/");
  });

  it("honors a custom fallback", () => {
    expect(safeRedirectPath(null, "/dashboard")).toBe("/dashboard");
  });
});
