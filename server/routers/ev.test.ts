import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

// ─── Mock DB ──────────────────────────────────────────────────────────────────
// Tracks insert/update calls so the fail-closed tests can assert no write was
// ever attempted when auth is rejected. Declared via vi.hoisted since vi.mock
// factories are hoisted above normal top-level const declarations.
const { insertValues, updateSet } = vi.hoisted(() => ({
  insertValues: vi.fn().mockResolvedValue(undefined),
  updateSet: vi
    .fn()
    .mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
}));

vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: vi.fn().mockReturnValue({ values: insertValues }),
    update: vi.fn().mockReturnValue({ set: updateSet }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  }),
}));

function createCaller() {
  const ctx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
  return appRouter.createCaller(ctx);
}

// ─── ev.stampClosingLines / ev.stampCLV (n8n cron, public endpoints) ──────────
// These are the only access control on the endpoint (no session/user), so a
// rejected token must short-circuit before touching the DB at all.
describe("ev cron endpoints", () => {
  const configuredValue = `cron-fixture-${Date.now()}`;

  beforeEach(() => {
    process.env.CRON_SERVICE_TOKEN = configuredValue;
    insertValues.mockClear();
    updateSet.mockClear();
  });

  afterEach(() => {
    delete process.env.CRON_SERVICE_TOKEN;
  });

  describe("stampClosingLines", () => {
    it("rejects an incorrect service token without writing snapshots", async () => {
      const caller = createCaller();
      await expect(
        caller.ev.stampClosingLines({ serviceToken: "wrong-value", sports: [] })
      ).rejects.toThrow("Invalid service token");
      expect(insertValues).not.toHaveBeenCalled();
    });

    it("fails closed when CRON_SERVICE_TOKEN is not configured", async () => {
      delete process.env.CRON_SERVICE_TOKEN;
      const caller = createCaller();
      await expect(
        caller.ev.stampClosingLines({
          serviceToken: configuredValue,
          sports: [],
        })
      ).rejects.toThrow("Invalid service token");
      expect(insertValues).not.toHaveBeenCalled();
    });

    it("accepts the configured token and proceeds (empty sports list, no snapshots to insert)", async () => {
      const caller = createCaller();
      const result = await caller.ev.stampClosingLines({
        serviceToken: configuredValue,
        sports: [],
      });
      expect(result.inserted).toBe(0);
    });
  });

  describe("stampCLV", () => {
    it("rejects an incorrect service token without updating bets", async () => {
      const caller = createCaller();
      await expect(
        caller.ev.stampCLV({ serviceToken: "wrong-value" })
      ).rejects.toThrow("Invalid service token");
      expect(updateSet).not.toHaveBeenCalled();
    });

    it("fails closed when CRON_SERVICE_TOKEN is not configured", async () => {
      delete process.env.CRON_SERVICE_TOKEN;
      const caller = createCaller();
      await expect(
        caller.ev.stampCLV({ serviceToken: configuredValue })
      ).rejects.toThrow("Invalid service token");
      expect(updateSet).not.toHaveBeenCalled();
    });
  });
});
