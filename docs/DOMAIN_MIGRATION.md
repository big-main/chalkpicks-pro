# Domain Migration: chalkpicks.live → chalkpicks.pro

## Status

| Step                                                    | Status            |
| ------------------------------------------------------- | ----------------- |
| Code references updated (462 occurrences in 100+ files) | ✅ Complete       |
| Checkpoint deployed to Manus hosting                    | ✅ Complete       |
| Add chalkpicks.pro in Manus Management UI               | ✅ Verified       |
| Transfer DNS to Cloudflare                              | ✅ HTTPS verified |
| Point CNAME records at Manus                            | ✅ HTTPS verified |
| SSL auto-provision                                      | ✅ Active         |
| Update Stripe webhook URL                               | ⏳ You (manual)   |
| Keep chalkpicks.live as 301 redirect                    | ⚠️ Legacy only    |

---

## Step 1: Verify the Published Domain

The published project has `chalkpicks.pro` and `www.chalkpicks.pro` attached. The apex is canonical; `www` redirects to the apex while preserving paths and queries.

---

## Step 2: DNS and SSL

DNS and HTTPS for the attached `.pro` hosts are verified. Do not change the working records unless the domain provider explicitly requests a DNS validation update.

---

## Step 3: Legacy `.live` Handling

`.live` is retired and must not be used for previews, marketing, OAuth callbacks, webhooks, or generated links. If its DNS remains available, forward both `chalkpicks.live/*` and `www.chalkpicks.live/*` to the equivalent `https://chalkpicks.pro/*` path. If it is unavailable, use `.pro` directly.

---

## Step 4: Update Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Find the existing webhook for `https://chalkpicks.live/api/stripe/webhook`
3. Update the URL to: `https://chalkpicks.pro/api/stripe/webhook`
4. Or create a new webhook endpoint with the new URL

---

## Step 5: Verify Everything Works

After DNS propagates (5-60 min):

```bash
# Check DNS resolution
dig chalkpicks.pro CNAME
dig www.chalkpicks.pro CNAME

# Check HTTPS works
curl -sI https://chalkpicks.pro | head -5
curl -sI https://www.chalkpicks.pro | head -5

# Check health endpoint
curl -s https://chalkpicks.pro/health

# Check sitemap accessible
curl -s https://chalkpicks.pro/sitemap-index.xml | head -3
```

---

## Post-Migration Checklist

- [ ] Submit new sitemap to Google Search Console: `https://chalkpicks.pro/sitemap-index.xml`
- [ ] Add chalkpicks.pro as a new property in Google Search Console
- [ ] Update Google Analytics property URL
- [ ] Update social media profile links (Twitter, Reddit, Discord)
- [ ] Update Product Hunt listing URL
- [ ] Update directory submissions to new domain
- [ ] Ping IndexNow with new URLs: `scripts/ping-indexnow.sh --sitemap https://chalkpicks.pro/sitemap-index.xml`
- [ ] Update Stripe webhook endpoint URL
- [ ] Update n8n webhook URLs if any reference the old domain
