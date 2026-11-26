import { describe, expect, it } from "vitest";
import Stripe from "stripe";

const configuredKey = process.env.CHALKPICKS_STRIPE_SECRET_KEY;

describe.skipIf(!configuredKey)(
  "Chalkpicks Stripe account configuration",
  () => {
    it("authenticates to the intended live Chalkpicks Pro account", async () => {
      expect(configuredKey).toMatch(/^sk_live_/);
      const stripe = new Stripe(configuredKey!);
      const account = await stripe.accounts.retrieve();

      expect(account.id).toBe("acct_1TovY5JXlShpHPhg");
      expect(account.charges_enabled).toBe(true);
      expect(account.payouts_enabled).toBe(true);
    });
  }
);
