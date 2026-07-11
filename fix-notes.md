# Fix Notes (Jul 10, 2026)

## Issues to Fix
1. **Deployment failure** - Socket Security postinstall script was failing. FIXED by removing it from package.json.
2. **Tool pages not loading** - User reports some tools show error pages. Need to audit all /tools/* routes.
3. **Pricing mismatch** - User says pricing isn't working on one page and doesn't match Stripe prices.

## Stripe Prices (from previous sessions)
- Daily Pass: $9.99
- Monthly Pro: $29.99
- Yearly Elite: $199.99

## Key Files
- Pricing page: client/src/pages/Pricing.tsx
- PayPal pricing: client/src/pages/PayPalPricing.tsx (may still exist and have wrong prices)
- Tools page: client/src/pages/Tools.tsx
- App routes: client/src/App.tsx

## Admin Account
- Email: admin@chalkpicks.live
- Password: REDACTED — rotate this credential, it was previously committed in plaintext
- Role: admin

## BabyLoveGrowth API
- Key: set via environment variable, not committed — rotate the previously-committed key
- Base URL: https://api.babylovegrowth.ai/api/integrations
- Endpoints: GET /v1/articles, GET /v1/articles/:id
- Headers: X-API-Key, Content-Type: application/json
- Pagination: limit (max 500), offset
- Fields returned: title, content_html, content_markdown, slug, meta_description, hero_image_url, jsonLd
