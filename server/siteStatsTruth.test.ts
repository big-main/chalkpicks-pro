import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => ({ getDb: mocks.getDb }));

beforeEach(() => {
  vi.resetModules();
  mocks.getDb.mockReset();
});
async function stats() {
  const { systemRouter } = await import("./_core/systemRouter");
  return systemRouter.createCaller({} as TrpcContext).siteStats();
}
function database(rows: Record<string, number>[][]) {
  let index = 0;
  return {
    select: vi.fn(() => ({
      from: () => {
        const result = Promise.resolve(rows[index++]);
        return Object.assign(result, { where: () => result });
      },
    })),
  };
}
describe("Truthful public site stats", () => {
  it("never fabricates membership or performance when the database is unavailable", async () => {
    mocks.getDb.mockResolvedValue(null);
    expect(await stats()).toEqual({
      totalMembers: 0,
      paidSubscribers: 0,
      totalPicksGenerated: 0,
      picksToday: 0,
      winRate: 0,
      newsletterSubscribers: 0,
    });
  });
  it("keeps legitimate zero counts at zero", async () => {
    const db = database([
      [{ count: 0 }],
      [{ count: 0 }],
      [{ count: 0 }],
      [{ count: 0 }],
      [{ wins: 0, losses: 0 }],
      [{ count: 0 }],
    ]);
    mocks.getDb.mockResolvedValue(db);
    expect(await stats()).toEqual({
      totalMembers: 0,
      paidSubscribers: 0,
      totalPicksGenerated: 0,
      picksToday: 0,
      winRate: 0,
      newsletterSubscribers: 0,
    });
  });
  it("uses actual counts and caches the aggregates rather than inflating a small platform", async () => {
    const db = database([
      [{ count: 32 }],
      [{ count: 2 }],
      [{ count: 1039 }],
      [{ count: 4 }],
      [{ wins: 16, losses: 9 }],
      [{ count: 0 }],
    ]);
    mocks.getDb.mockResolvedValue(db);
    const result = await stats();
    expect(result).toEqual({
      totalMembers: 32,
      paidSubscribers: 2,
      totalPicksGenerated: 1039,
      picksToday: 4,
      winRate: 64,
      newsletterSubscribers: 0,
    });
    expect(await stats()).toEqual(result);
    expect(db.select).toHaveBeenCalledTimes(6);
  });
});
