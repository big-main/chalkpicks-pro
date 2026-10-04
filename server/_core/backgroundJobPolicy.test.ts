import { describe, expect, it } from "vitest";
import { shouldRunBackgroundJobs } from "./backgroundJobPolicy";

describe("shouldRunBackgroundJobs", () => {
  it("runs in production", () => {
    expect(shouldRunBackgroundJobs("production", undefined)).toBe(true);
  });

  it("does not run in development by default", () => {
    expect(shouldRunBackgroundJobs("development", undefined)).toBe(false);
  });

  it("allows explicit preview opt-in", () => {
    expect(shouldRunBackgroundJobs("development", "true")).toBe(true);
    expect(shouldRunBackgroundJobs("test", "true")).toBe(true);
  });

  it("rejects non-true opt-in values", () => {
    expect(shouldRunBackgroundJobs("development", "1")).toBe(false);
    expect(shouldRunBackgroundJobs("development", "false")).toBe(false);
  });
});
