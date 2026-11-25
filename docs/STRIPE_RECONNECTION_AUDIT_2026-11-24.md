# Stripe reconnection audit — 2026-11-24

The Stripe connector is now targeting the live `Chalkpicks` account `acct_1TovY5JXlShpHPhg`. The account is fully submitted, charges are enabled, payouts are enabled, and there are no currently due or past-due verification requirements.

## Verified live plans

| ChalkPicks tier             | Amount | Cadence | Live Stripe price                |
| --------------------------- | -----: | ------- | -------------------------------- |
| Basic (`daily` legacy key)  |  $9.99 | monthly | `price_1TyE4dJXlShpHPhg9dzcCcI3` |
| Pro (`monthly` legacy key)  | $19.99 | monthly | `price_1TyE4dJXlShpHPhgkvMuFmfz` |
| Elite (`yearly` legacy key) | $59.99 | yearly  | `price_1TyE4dJXlShpHPhg8rAyn1VZ` |

The application fallbacks in `server/routers/subscription.ts` now match these IDs. Environment-variable overrides remain supported, so the production runtime must not retain old-account overrides.

## Webhooks

The canonical live endpoint is enabled at `https://chalkpicks.pro/api/stripe/webhook` (`we_1TovtHJXlShpHPhgIOLDl5Yk`). Its event list now includes checkout completion, subscription lifecycle events, payment-intent events, `invoice.paid`, `invoice.payment_succeeded`, and `invoice.payment_failed`, matching the renewal and failed-payment handlers in `server/webhook.ts`.

The duplicate live endpoint at `https://chalkpicks.manus.space/api/stripe/webhook` was disabled. This leaves `.pro` as the single live Stripe delivery path.

## Customer Portal

The active default configuration `bpc_1TqP7iJXlShpHPhg6IIRLUqA` now returns customers to `https://chalkpicks.pro/account-settings`, supports customer details, payment-method updates, invoice history, cancel-at-period-end with reasons, and subscription updates with promotion-code support.

Stripe rejected a configuration containing both monthly prices because Basic and Pro are attached to the same Stripe product and the portal permits only one price per billing interval for a product. The compatible portal update therefore exposes the Pro monthly and Elite yearly prices for portal plan changes; Basic remains available through the main pricing checkout. The portal login page was disabled so its stale `.live` share URL cannot be used.

## Safety

No customer charge or payment method was created. No secret key, webhook signing secret, customer payment detail, or bank detail is recorded here.
