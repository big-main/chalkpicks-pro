import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  ev: vi.fn(),
  arb: vi.fn(),
  lowHold: vi.fn(),
  game: vi.fn(),
}));
vi.mock("./services/dataService", () => ({
  fetchSharpEVOpportunities: mocks.ev,
  fetchSharpArbOpportunities: mocks.arb,
  fetchSharpLowHoldLines: mocks.lowHold,
  fetchSharpGameState: mocks.game,
}));
import { sharpOpportunitiesRouter } from "./routers/sharpOpportunities";
import { SharpApiError } from "./services/sharpApiClient";
import type { TrpcContext } from "./_core/context";
const caller = (admin: boolean) =>
  sharpOpportunitiesRouter.createCaller({
    user: admin ? { id: 1, role: "admin", subscriptionTier: "yearly" } : null,
    req: {},
    res: {},
  } as unknown as TrpcContext);
beforeEach(() => {
  vi.clearAllMocks();
});
describe("SharpAPI provider failure API contract", () => {
  it("reports upstream plan restrictions separately from an admin's valid subscription", async () => {
    const error = new SharpApiError(403, "tier_restricted");
    mocks.ev.mockRejectedValue(error);
    mocks.arb.mockRejectedValue(error);
    mocks.lowHold.mockRejectedValue(error);
    const api = caller(true);
    for (const load of [
      () => api.getEVOpportunities({}),
      () => api.getArbOpportunities({}),
      () => api.getLowHoldLines({}),
    ]) {
      await expect(load()).rejects.toMatchObject({
        code: "SERVICE_UNAVAILABLE",
        message: error.message,
      });
    }
  });
  it("does not tell visitors to sign in again when the upstream credential is invalid", async () => {
    mocks.game.mockRejectedValue(new SharpApiError(401, "invalid_api_key"));
    await expect(caller(false).getGameState({})).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
  });
  it("preserves provider rate limiting as a retryable API error", async () => {
    mocks.game.mockRejectedValue(new SharpApiError(429, "rate_limited"));
    await expect(caller(false).getGameState({})).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
  });
  it("still rejects anonymous paid-tool requests before calling the provider", async () => {
    await expect(caller(false).getEVOpportunities({})).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(mocks.ev).not.toHaveBeenCalled();
  });
});
