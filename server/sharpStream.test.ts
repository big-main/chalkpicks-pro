import { EventEmitter } from "node:events";
import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  request: vi.fn(),
  configured: vi.fn(),
}));
vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: mocks.auth } }));
vi.mock("./services/sharpApiClient", async importOriginal => ({
  ...(await importOriginal<typeof import("./services/sharpApiClient")>()),
  sharpApiRequest: mocks.request,
  hasSharpApiKey: mocks.configured,
}));
import { sharpStreamHandler } from "./routes/sharpStream";
function fixture() {
  const req = Object.assign(new EventEmitter(), { query: {} });
  const res = Object.assign(new EventEmitter(), {
    headersSent: false,
    writableEnded: false,
    destroyed: false,
    status: vi.fn(),
    json: vi.fn(),
    setHeader: vi.fn(),
    flushHeaders: vi.fn(),
    write: vi.fn(),
    end: vi.fn(),
  });
  res.status.mockReturnValue(res);
  res.json.mockImplementation(() => {
    res.writableEnded = true;
    return res;
  });
  res.flushHeaders.mockImplementation(() => {
    res.headersSent = true;
  });
  res.end.mockImplementation(() => {
    res.writableEnded = true;
  });
  return {
    req,
    res,
    run: () =>
      sharpStreamHandler(req as unknown as Request, res as unknown as Response),
  };
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({
    id: 1,
    role: "admin",
    subscriptionTier: "yearly",
  });
  mocks.configured.mockReturnValue(true);
});
afterEach(() => {
  vi.useRealTimers();
});
describe("SharpAPI stream contract", () => {
  it("does not open an upstream for anonymous clients", async () => {
    mocks.auth.mockResolvedValue(null);
    const f = fixture();
    await f.run();
    expect(f.res.status).toHaveBeenCalledWith(401);
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it("rejects free and expired subscribers server-side", async () => {
    for (const user of [
      { role: "user", subscriptionTier: "free" },
      {
        role: "user",
        subscriptionTier: "monthly",
        subscriptionExpiresAt: new Date(0),
      },
    ]) {
      mocks.auth.mockResolvedValue(user);
      const f = fixture();
      await f.run();
      expect(f.res.status).toHaveBeenCalledWith(403);
    }
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it("reports upstream entitlement failures without sending fake SSE success headers", async () => {
    mocks.request.mockResolvedValue(
      new globalThis.Response(
        JSON.stringify({ error: { code: "tier_restricted" } }),
        { status: 403 }
      )
    );
    const f = fixture();
    await f.run();
    expect(f.res.status).toHaveBeenCalledWith(503);
    expect(f.res.json).toHaveBeenCalledWith(
      expect.objectContaining({ upstreamStatus: 403 })
    );
    expect(f.res.flushHeaders).not.toHaveBeenCalled();
  });
  it("cancels the provider stream when the client disconnects", async () => {
    const cancel = vi.fn();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode("event: heartbeat\ndata: {}\n\n")
        );
      },
      cancel,
    });
    mocks.request.mockResolvedValue(new globalThis.Response(stream));
    const f = fixture();
    f.res.write.mockImplementation(() => {
      f.res.emit("close");
      return true;
    });
    await f.run();
    expect(mocks.request).toHaveBeenCalledWith(
      expect.stringContaining("/stream?"),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(f.res.listenerCount("close")).toBe(0);
    expect(f.req.listenerCount("aborted")).toBe(0);
  });
  it("reports missing configuration without a network request", async () => {
    mocks.configured.mockReturnValue(false);
    const f = fixture();
    await f.run();
    expect(f.res.status).toHaveBeenCalledWith(503);
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it("times out stalled stream connections rather than returning an empty 200", async () => {
    vi.useFakeTimers();
    mocks.request.mockImplementation(
      (_, init) =>
        new Promise((_, reject) =>
          init.signal.addEventListener("abort", () =>
            reject(new Error("aborted"))
          )
        )
    );
    const f = fixture();
    const run = f.run();
    await vi.advanceTimersByTimeAsync(10001);
    await run;
    expect(f.res.status).toHaveBeenCalledWith(504);
    expect(f.res.flushHeaders).not.toHaveBeenCalled();
  });
});
