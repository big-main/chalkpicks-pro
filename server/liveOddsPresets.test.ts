import { describe, expect, it, vi, beforeEach } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import type { TrpcContext } from "./_core/context";

const mocked = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => ({ getDb: mocked.getDb }));

import { liveOddsPresetsRouter } from "./routers/liveOddsPresets";

const owner = { id: 7, role: "user" };
const config = {
  selectedSport: "nba",
  search: "Bulls",
  selectedBook: "all",
  selectedMarket: "moneyline",
  movementOnly: true,
  sort: "odds_desc" as const,
};

function caller(user: unknown = owner) {
  return liveOddsPresetsRouter.createCaller({ user } as TrpcContext);
}

beforeEach(() => mocked.getDb.mockReset());

describe("live odds preset authorization", () => {
  it("rejects anonymous list, save, and remove calls before database access", async () => {
    await expect(caller(null).list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(
      caller(null).save({ name: "NBA movers", config })
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(caller(null).remove({ id: 1 })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(mocked.getDb).not.toHaveBeenCalled();
  });

  it("rejects unsupported sort values before touching the database", async () => {
    await expect(
      caller().save({
        name: "Bad preset",
        config: { ...config, sort: "unsupported" as never },
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocked.getDb).not.toHaveBeenCalled();
  });

  it("scopes list queries to the authenticated user", async () => {
    const where = vi.fn(() => ({
      orderBy: () => ({ limit: async () => [] }),
    }));
    mocked.getDb.mockResolvedValue({
      select: vi.fn(() => ({ from: () => ({ where }) })),
    });

    await expect(caller().list()).resolves.toEqual([]);
    const query = new MySqlDialect().sqlToQuery(where.mock.calls[0][0]);
    expect(query.sql).toContain("userId");
    expect(query.params).toEqual([7]);
  });
});
