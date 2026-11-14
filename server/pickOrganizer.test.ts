import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  organizerPlanSchema,
  filterOrganizer,
  estimatedReturn,
  type OrganizerRecord,
} from "../shared/pickOrganizer";
import type { TrpcContext } from "./_core/context";
import { MySqlDialect } from "drizzle-orm/mysql-core";
const mocked = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => ({ getDb: mocked.getDb }));
import { pickOrganizerRouter } from "./routers/pickOrganizer";
const plan = {
  title: "Upcoming NBA",
  kind: "pick" as const,
  status: "draft" as const,
  sport: "nba",
  eventAt: null,
  stake: 10,
  notes: "",
  legs: [{ description: "User-entered selection", odds: -110 }],
};
const owner = {
  id: 7,
  role: "user",
  subscriptionTier: "free",
  subscriptionExpiresAt: null,
};
function caller(user: unknown = owner) {
  return pickOrganizerRouter.createCaller({ user } as TrpcContext);
}
beforeEach(() => mocked.getDb.mockReset());
describe("Organizer planning validation", () => {
  it("accepts negative American odds and rejects zero, short odds and negative stakes", () => {
    expect(organizerPlanSchema.safeParse(plan).success).toBe(true);
    for (const odds of [0, 50, -50])
      expect(
        organizerPlanSchema.safeParse({
          ...plan,
          legs: [{ description: "selection", odds }],
        }).success
      ).toBe(false);
    expect(organizerPlanSchema.safeParse({ ...plan, stake: -1 }).success).toBe(
      false
    );
  });
  it("requires at least two unique parlay legs and limits a single pick to one leg", () => {
    expect(
      organizerPlanSchema.safeParse({ ...plan, kind: "parlay" }).success
    ).toBe(false);
    const legs = [
      { pickId: 1, description: "A", odds: 100 },
      { pickId: 1, description: "B", odds: 100 },
    ];
    expect(
      organizerPlanSchema.safeParse({ ...plan, kind: "parlay", legs }).success
    ).toBe(false);
    expect(organizerPlanSchema.safeParse({ ...plan, legs }).success).toBe(
      false
    );
  });
  it("computes gross returns for both signs without pretending trade plans have guaranteed payouts", () => {
    expect(estimatedReturn(plan)).toBeCloseTo(19.0909);
    expect(
      estimatedReturn({
        ...plan,
        kind: "parlay",
        legs: [
          { description: "A", odds: -100 },
          { description: "B", odds: 150 },
        ],
      })
    ).toBe(50);
    expect(estimatedReturn({ ...plan, kind: "trade" })).toBeNull();
    expect(
      estimatedReturn({ ...plan, legs: [{ description: "A", odds: null }] })
    ).toBeNull();
  });
});
describe("Organizer filters", () => {
  const records: OrganizerRecord[] = [
    {
      ...plan,
      id: 3,
      title: "Unknown time",
      eventAt: null,
      updatedAt: "2026-11-14",
    },
    {
      ...plan,
      id: 2,
      title: "Bulls parlay",
      kind: "parlay",
      eventAt: 2000,
      updatedAt: "2026-11-13",
    },
    {
      ...plan,
      id: 1,
      title: "Old plan",
      eventAt: 500,
      updatedAt: "2026-11-12",
      status: "archived",
    },
  ];
  const filters = {
    query: "",
    sport: "all",
    status: "all",
    kind: "all",
    upcomingOnly: false,
    sort: "event" as const,
  };
  it("places unknown event times last and does not mutate input records", () => {
    expect(filterOrganizer(records, filters).map(row => row.id)).toEqual([
      1, 2, 3,
    ]);
    expect(records.map(row => row.id)).toEqual([3, 2, 1]);
  });
  it("combines search, type and upcoming filters excluding archived or unknown events", () => {
    expect(
      filterOrganizer(
        records,
        { ...filters, query: "bulls", kind: "parlay", upcomingOnly: true },
        1000
      ).map(row => row.id)
    ).toEqual([2]);
    expect(
      filterOrganizer(records, { ...filters, upcomingOnly: true }, 3000)
    ).toEqual([]);
  });
});
describe("Organizer authorization", () => {
  it("rejects anonymous callers before accessing the database", async () => {
    await expect(caller(null).list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(caller(null).save({ plan })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(mocked.getDb).not.toHaveBeenCalled();
  });
  it("cannot update or delete another user's plan", async () => {
    const where = vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) }));
    const db = {
      select: vi.fn(() => ({ from: () => ({ where }) })),
      update: vi.fn(),
      delete: vi.fn(),
    };
    mocked.getDb.mockResolvedValue(db);
    await expect(caller().save({ id: 99, plan })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(caller().remove({ id: 99 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    const query = new MySqlDialect().sqlToQuery(where.mock.calls[0][0]);
    expect(query.sql).toContain("userId");
    expect(query.params).toEqual([99, 7]);
    expect(db.update).not.toHaveBeenCalled();
    expect(db.delete).not.toHaveBeenCalled();
  });
  it("blocks free users from saving linked premium picks", async () => {
    let call = 0;
    const db = {
      select: vi.fn(() => ({
        from: () => ({
          where: () => ({
            limit: async () =>
              ++call === 1
                ? [{ total: 0 }]
                : [
                    {
                      id: 10,
                      tier: "premium",
                      result: "pending",
                      isActive: true,
                      recommendation: "premium source",
                      odds: -110,
                    },
                  ],
          }),
        }),
      })),
      insert: vi.fn(),
    };
    mocked.getDb.mockResolvedValue(db);
    await expect(
      caller().save({
        plan: {
          ...plan,
          legs: [{ pickId: 10, description: "client text", odds: 100 }],
        },
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.insert).not.toHaveBeenCalled();
  });
});
