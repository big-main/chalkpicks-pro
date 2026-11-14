import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const response = (
  status: number,
  code?: string,
  headers?: Record<string, string>
) =>
  new Response(JSON.stringify(code ? { error: { code } } : { data: [] }), {
    status,
    headers,
  });
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("SHARPAPI_KEY", "primary-test-key");
  vi.stubEnv("SHARPAPI_KEY_2", "backup-test-key");
  vi.stubEnv("SHARPAPI_KEY_3", "");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});
describe("Shared SharpAPI authentication", () => {
  it("retries an invalid primary with the configured backup once and remembers the working key", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response(401, "invalid_api_key"))
      .mockImplementation(async () => response(200));
    vi.stubGlobal("fetch", fetch);
    const { sharpApiJson } = await import("./services/sharpApiClient");
    await sharpApiJson("/odds?limit=1");
    await sharpApiJson("/opportunities/ev?limit=1");
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(
      fetch.mock.calls.map(([, init]) => init.headers.get("X-API-Key"))
    ).toEqual(["primary-test-key", "backup-test-key", "backup-test-key"]);
  });
  it.each(["expired_api_key", "disabled_api_key"])(
    "handles documented %s failures",
    async code => {
      const fetch = vi
        .fn()
        .mockResolvedValueOnce(response(401, code))
        .mockResolvedValueOnce(response(200));
      vi.stubGlobal("fetch", fetch);
      await (await import("./services/sharpApiClient")).sharpApiJson("/odds");
      expect(fetch).toHaveBeenCalledTimes(2);
    }
  );
  it("supports backup-only configuration and strips whitespace/duplicates", async () => {
    vi.stubEnv("SHARPAPI_KEY", " ");
    vi.stubEnv("SHARPAPI_KEY_2", " backup-test-key\n");
    vi.stubEnv("SHARPAPI_KEY_3", "backup-test-key");
    const fetch = vi.fn().mockImplementation(async () => response(200));
    vi.stubGlobal("fetch", fetch);
    const client = await import("./services/sharpApiClient");
    expect(client.getSharpApiKeys()).toEqual(["backup-test-key"]);
    await client.sharpApiJson("/odds");
    expect(fetch.mock.calls[0][1].headers.get("X-API-Key")).toBe(
      "backup-test-key"
    );
  });
  it("does not retry arbitrary unauthorized responses", async () => {
    const fetch = vi
      .fn()
      .mockImplementation(async () => response(401, "unauthorized"));
    vi.stubGlobal("fetch", fetch);
    await expect(
      (await import("./services/sharpApiClient")).sharpApiJson("/odds")
    ).rejects.toMatchObject({ status: 401, code: "unauthorized" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("does not rotate credentials to bypass plan permissions", async () => {
    const fetch = vi
      .fn()
      .mockImplementation(async () => response(403, "tier_restricted"));
    vi.stubGlobal("fetch", fetch);
    await expect(
      (await import("./services/sharpApiClient")).sharpApiJson(
        "/opportunities/ev"
      )
    ).rejects.toMatchObject({ status: 403, code: "tier_restricted" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("honors Retry-After instead of rotating or flooding a rate-limited account", async () => {
    vi.useFakeTimers();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        response(429, "rate_limited", { "Retry-After": "60" })
      )
      .mockImplementation(async () => response(200));
    vi.stubGlobal("fetch", fetch);
    const { sharpApiJson } = await import("./services/sharpApiClient");
    await expect(sharpApiJson("/odds")).rejects.toMatchObject({ status: 429 });
    await expect(sharpApiJson("/odds")).rejects.toMatchObject({ status: 429 });
    expect(fetch).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(60001);
    await sharpApiJson("/odds");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("does not keep resending credentials already rejected by the provider", async () => {
    const fetch = vi
      .fn()
      .mockImplementation(async () => response(401, "invalid_api_key"));
    vi.stubGlobal("fetch", fetch);
    const { sharpApiJson } = await import("./services/sharpApiClient");
    await expect(sharpApiJson("/odds")).rejects.toMatchObject({ status: 401 });
    await expect(sharpApiJson("/odds")).rejects.toMatchObject({ status: 401 });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("recognizes a replaced configuration without a hard-coded boot-time key", async () => {
    const fetch = vi
      .fn()
      .mockImplementation(async () => response(401, "invalid_api_key"));
    vi.stubGlobal("fetch", fetch);
    const { sharpApiJson } = await import("./services/sharpApiClient");
    await expect(sharpApiJson("/odds")).rejects.toMatchObject({ status: 401 });
    vi.stubEnv("SHARPAPI_KEY", "replacement-test-key");
    fetch.mockImplementation(async () => response(200));
    await sharpApiJson("/odds");
    expect(fetch.mock.calls[2][1].headers.get("X-API-Key")).toBe(
      "replacement-test-key"
    );
  });
  it("keeps credentials out of URLs and prevents redirecting them to another host", async () => {
    const fetch = vi.fn().mockImplementation(async () => response(200));
    vi.stubGlobal("fetch", fetch);
    const { sharpApiRequest } = await import("./services/sharpApiClient");
    await expect(sharpApiRequest("https://example.com/")).rejects.toThrow(
      "relative API path"
    );
    await sharpApiRequest("/stream", {
      headers: { Accept: "text/event-stream" },
    });
    expect(fetch.mock.calls[0][0]).toBe(
      "https://api.sharpapi.io/api/v1/stream"
    );
    expect(fetch.mock.calls[0][1]).toMatchObject({ redirect: "error" });
    expect(fetch.mock.calls[0][1].headers.get("Accept")).toBe(
      "text/event-stream"
    );
  });
  it("throws an explicit configuration error without making unauthenticated requests", async () => {
    for (const key of ["SHARPAPI_KEY", "SHARPAPI_KEY_2"]) vi.stubEnv(key, "");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(
      (await import("./services/sharpApiClient")).sharpApiJson("/odds")
    ).rejects.toMatchObject({ status: 503, code: "missing_api_key" });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("premium adapters reject upstream permission failures instead of resolving to empty arrays", async () => {
    const fetch = vi
      .fn()
      .mockImplementation(async () => response(403, "tier_restricted"));
    vi.stubGlobal("fetch", fetch);
    const service = await import("./services/dataService");
    for (const load of [
      service.fetchSharpEVOpportunities,
      service.fetchSharpArbOpportunities,
      service.fetchSharpLowHoldLines,
      service.fetchSharpGameState,
    ]) {
      await expect(load()).rejects.toMatchObject({
        status: 403,
        code: "tier_restricted",
      });
    }
    expect(fetch).toHaveBeenCalledTimes(4);
  });
  it("REST data adapters all use the shared client and never hide premium errors as successful empty results", async () => {
    const fs = await import("node:fs");
    const service = fs.readFileSync(
      new URL("./services/dataService.ts", import.meta.url),
      "utf8"
    );
    expect(service).not.toContain("rotateSharpKey");
    expect(service).not.toContain('"X-API-Key": SHARPAPI_KEY');
    for (const path of [
      "opportunities/ev",
      "opportunities/arbitrage",
      "opportunities/low_hold",
      "gamestate",
    ])
      expect(service).toContain(path);
    expect(service).not.toContain('console.warn("[SharpAPI EV] fetch failed:');
  });
});
