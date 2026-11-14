import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import express from "express";
import { createServer, type Server } from "node:http";
import { registerOAuthRoutes } from "./_core/oauth";
const mocks = vi.hoisted(() => ({
  byId: vi.fn(),
  byEmail: vi.fn(),
  create: vi.fn(),
  token: vi.fn(),
}));
vi.mock("./db", () => ({
  getUserByOpenId: mocks.byId,
  getUserByEmail: mocks.byEmail,
  createOAuthUser: mocks.create,
}));
vi.mock("./_core/sdk", () => ({ sdk: { createSessionToken: mocks.token } }));
const realFetch = globalThis.fetch;
let server: Server;
let origin: string;
let providerCalls = 0;
beforeAll(async () => {
  vi.stubEnv("VITE_APP_ID", "test-project");
  vi.stubEnv("VITE_OAUTH_PORTAL_URL", "https://manus.im");
  vi.stubEnv("OAUTH_SERVER_URL", "https://api.manus.im");
  const app = express();
  registerOAuthRoutes(app);
  server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Test port missing");
  origin = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  server.closeAllConnections();
  await new Promise<void>(resolve => server.close(() => resolve()));
});
beforeEach(() => {
  providerCalls = 0;
  Object.values(mocks).forEach(mock => mock.mockReset());
  mocks.byId.mockResolvedValue({
    id: 42,
    name: "Owner",
    role: "admin",
    subscriptionTier: "yearly",
  });
  mocks.token.mockResolvedValue("test-session");
  vi.stubGlobal("fetch", ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.startsWith("https://api.manus.im/")) {
      providerCalls++;
      return Promise.resolve(
        Response.json(
          url.endsWith("ExchangeToken")
            ? { accessToken: "verified-token" }
            : {
                openId: "verified-owner-id",
                email: "owner@example.com",
                name: "Owner",
              }
        )
      );
    }
    return realFetch(input, init);
  }) as typeof fetch);
});
async function start() {
  const response = await fetch(`${origin}/api/oauth/start`, {
    redirect: "manual",
  });
  const url = new URL(response.headers.get("location")!);
  return {
    response,
    url,
    state: url.searchParams.get("state")!,
    cookie: response.headers.get("set-cookie")!.split(";")[0],
  };
}
describe("Restored Google / Manus sign-in", () => {
  it("uses a fresh CSRF state and the exact originating callback", async () => {
    const { response, url, state } = await start();
    expect(response.status).toBe(302);
    expect(url.origin).toBe("https://manus.im");
    expect(url.searchParams.get("redirectUri")).toBe(
      `${origin}/api/oauth/callback`
    );
    expect(state.length).toBeGreaterThan(20);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });
  it("rejects callback forgery before exchanging any token", async () => {
    const response = await fetch(
      `${origin}/api/oauth/callback?code=test&state=forged`
    );
    expect(response.status).toBe(400);
    expect(providerCalls).toBe(0);
    expect(mocks.token).not.toHaveBeenCalled();
  });
  it("signs in the existing identity without changing admin or annual access", async () => {
    const { state, cookie } = await start();
    const response = await fetch(
      `${origin}/api/oauth/callback?code=test&state=${state}`,
      { headers: { cookie }, redirect: "manual" }
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/dashboard");
    expect(mocks.token).toHaveBeenCalledWith(42, "Owner", expect.any(Object));
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.byId).toHaveBeenCalledWith("verified-owner-id");
  });
  it("cannot elevate an unrelated identity by matching an email alone", async () => {
    mocks.byId.mockResolvedValue(undefined);
    mocks.byEmail.mockResolvedValue({ id: 42, role: "admin" });
    const { state, cookie } = await start();
    const response = await fetch(
      `${origin}/api/oauth/callback?code=test&state=${state}`,
      { headers: { cookie }, redirect: "manual" }
    );
    expect(response.status).toBe(409);
    expect(mocks.token).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
