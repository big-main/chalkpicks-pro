import { describe, expect, it } from "vitest";
import { providerErrorCode } from "./routers/aiPicks";

describe("AI provider error redaction", () => {
  it("returns only stable status and code fields", () => {
    expect(
      providerErrorCode({
        status: 401,
        code: "invalid_api_key",
        message: "Incorrect API key provided: sk_live_secret_value",
      })
    ).toBe("401:invalid_api_key");
  });

  it("does not serialize arbitrary error messages", () => {
    expect(providerErrorCode(new Error("sk_live_secret_value"))).toBe(
      "request_failed"
    );
    expect(providerErrorCode(null)).toBe("request_failed");
  });
});
