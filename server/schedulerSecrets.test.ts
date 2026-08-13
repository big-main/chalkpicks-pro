import { describe, it, expect } from "vitest";

describe("Scheduler & Cron secrets", () => {
  it.skipIf(!process.env.SCHEDULER_SECRET)(
    "SCHEDULER_SECRET is set and at least 32 chars",
    () => {
      expect(process.env.SCHEDULER_SECRET).toBeTruthy();
      expect(process.env.SCHEDULER_SECRET!.length).toBeGreaterThanOrEqual(32);
    }
  );

  it.skipIf(!process.env.CRON_SERVICE_TOKEN)(
    "CRON_SERVICE_TOKEN is set and at least 32 chars",
    () => {
      expect(process.env.CRON_SERVICE_TOKEN).toBeTruthy();
      expect(process.env.CRON_SERVICE_TOKEN!.length).toBeGreaterThanOrEqual(32);
    }
  );

  it.skipIf(!process.env.SCHEDULER_SECRET)(
    "SCHEDULER_SECRET is not the old hardcoded fallback",
    () => {
      expect(process.env.SCHEDULER_SECRET).not.toBe(
        "chalkpicks-scheduler-2024"
      );
    }
  );

  it.skipIf(!process.env.CRON_SERVICE_TOKEN)(
    "CRON_SERVICE_TOKEN is not the old hardcoded fallback",
    () => {
      expect(process.env.CRON_SERVICE_TOKEN).not.toBe("chalkpicks_cron_2026");
    }
  );
});
