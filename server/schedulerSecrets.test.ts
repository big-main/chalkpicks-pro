import { describe, it, expect } from "vitest";

// Deployment-config assertions for the two machine-to-machine secrets. They
// verify the *deployed* environment, so they skip where no environment is
// configured — CI supplies no real secrets by design (.github/workflows/ci.yml).
// Endpoint behaviour when these are unset is covered by unit tests that do run
// everywhere: notifications.test.ts and routers/ev.test.ts assert both fail closed.
const configured = Boolean(
  process.env.SCHEDULER_SECRET || process.env.CRON_SERVICE_TOKEN
);

describe.skipIf(!configured)("Scheduler & Cron secrets", () => {
  it("SCHEDULER_SECRET is set and at least 32 chars", () => {
    expect(process.env.SCHEDULER_SECRET).toBeTruthy();
    expect(process.env.SCHEDULER_SECRET!.length).toBeGreaterThanOrEqual(32);
  });

  it("CRON_SERVICE_TOKEN is set and at least 32 chars", () => {
    expect(process.env.CRON_SERVICE_TOKEN).toBeTruthy();
    expect(process.env.CRON_SERVICE_TOKEN!.length).toBeGreaterThanOrEqual(32);
  });

  it("SCHEDULER_SECRET is not the old hardcoded fallback", () => {
    expect(process.env.SCHEDULER_SECRET).not.toBe("chalkpicks-scheduler-2024");
  });

  it("CRON_SERVICE_TOKEN is not the old hardcoded fallback", () => {
    expect(process.env.CRON_SERVICE_TOKEN).not.toBe("chalkpicks_cron_2026");
  });
});
