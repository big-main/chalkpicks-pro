import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Current-user response", () => {
  it("redacts the hash without removing admin or subscription access", async () => {
    const user = {
      id: 1,
      name: "Owner",
      email: "owner@example.com",
      passwordHash: "private-hash",
      role: "admin",
      subscriptionTier: "yearly",
    } as TrpcContext["user"];
    const caller = appRouter.createCaller({ user } as TrpcContext);
    const result = await caller.auth.me();
    expect(result).toMatchObject({
      role: "admin",
      subscriptionTier: "yearly",
      id: 1,
    });
    expect(result).not.toHaveProperty("passwordHash");
  });
});
