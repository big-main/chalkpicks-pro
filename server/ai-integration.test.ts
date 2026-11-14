import { describe, it, expect } from "vitest";
import OpenAI from "openai";

describe("AI API Integration", () => {
  it.skipIf(!process.env.OPENAI_API_KEY)(
    "should validate OpenAI API key",
    async () => {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      try {
        const response = await openai.models.list();
        expect(response).toBeDefined();
        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        console.log(
          `✓ OpenAI API key valid. Found ${response.data.length} models`
        );
      } catch (error: any) {
        // A provider error is not healthy integration. Do not log error.message:
        // OpenAI sometimes echoes the rejected credential in that message.
        throw new Error(
          `OpenAI /models validation failed: HTTP ${error.status ?? "network"}, ${error.code ?? "request_failed"}`
        );
      }
    },
    15000
  );

  it.skipIf(!process.env.OPENROUTER_API_KEY)(
    "validates OpenRouter using authenticated key metadata",
    async () => {
      // /models is public and cannot prove key validity; /key is authenticated.
      const response = await fetch("https://openrouter.ai/api/v1/key", {
        signal: AbortSignal.timeout(12000),
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
      });

      expect(response.status, `OpenRouter /key: HTTP ${response.status}`).toBe(
        200
      );
      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(typeof data.data.is_free_tier).toBe("boolean");
    },
    15000
  );

  it.skipIf(!process.env.ANTHROPIC_API_KEY)(
    "should validate Anthropic Claude API key directly",
    async () => {
      const response = await fetch("https://api.anthropic.com/v1/models", {
        signal: AbortSignal.timeout(10000),
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01",
        },
      });

      expect(
        response.status,
        `Anthropic /models: HTTP ${response.status}`
      ).toBe(200);
      const json = await response.json();
      expect(Array.isArray(json.data)).toBe(true);
    },
    15000
  );
});
