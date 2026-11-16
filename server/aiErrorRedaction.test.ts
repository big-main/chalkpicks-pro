import { describe, expect, it } from "vitest";
import { providerErrorCode } from "./routers/aiPicks";

describe("AI provider error redaction", () => {
  it("returns only stable status and code fields", () => {
    expect(
      providerErrorCode({
        status: 401,
        code: "invalid_api_key",
        message: "Incorrect API key provided: provider-token-placeholder",
      })
    ).toBe("401:invalid_api_key");
  });

  it("does not serialize arbitrary error messages", () => {
    expect(providerErrorCode(new Error("provider-token-placeholder"))).toBe(
      "request_failed"
    );
    expect(providerErrorCode(null)).toBe("request_failed");
  });
});
