import { describe, it, expect } from "vitest";
import { hasSharpApiKey, sharpApiRequest } from "./services/sharpApiClient";

describe.skipIf(!hasSharpApiKey())(
  "SharpAPI live account and feature validation",
  () => {
    async function get(path: string) {
      const response = await sharpApiRequest(path, {
        signal: AbortSignal.timeout(10000),
      });
      const json = await response.json();
      // Only status and machine-readable code enter failure output. Never keys/messages.
      expect(
        response.status,
        `SharpAPI ${path.split("?")[0]}: HTTP ${response.status}, ${json.error?.code ?? "ok"}`
      ).toBe(200);
      return json;
    }
    it("authenticates the configured account", async () => {
      const json = await get("/account");
      expect(json.data).toBeDefined();
      expect(typeof json.data.tier).toBe("string");
    }, 15000);
    it("odds endpoint returns its documented data array", async () => {
      const json = await get("/odds?limit=1");
      expect(Array.isArray(json.data)).toBe(true);
    }, 15000);
    it.each([
      ["+EV opportunities", "/opportunities/ev?limit=1"],
      ["arbitrage opportunities", "/opportunities/arbitrage?limit=1"],
      ["low hold lines", "/opportunities/low_hold?limit=1"],
      ["live game state", "/gamestate"],
    ])(
      "%s is authorized and returns its documented data array",
      async (_, path) => {
        const json = await get(path);
        expect(Array.isArray(json.data)).toBe(true);
      },
      15000
    );
  }
);
