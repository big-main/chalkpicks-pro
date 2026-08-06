# Domain Migration: chalkpicks.live → chalkpicks.pro

## Status

| Step                                                    | Status                 |
| ------------------------------------------------------- | ---------------------- |
| Code references updated (462 occurrences in 100+ files) | ✅ Complete            |
| Checkpoint deployed to Manus hosting                    | ✅ Complete            |
| Add chalkpicks.pro in Manus Management UI               | ⏳ You (manual)        |
| Transfer DNS to Cloudflare                              | ⏳ You (manual)        |
| Point CNAME records at Manus                            | ⏳ You (manual)        |
| SSL auto-provision                                      | ⏳ Automatic after DNS |
| Update Stripe webhook URL                               | ⏳ You (manual)        |
| Keep chalkpicks.live as 301 redirect                    | ⏳ Optional            |

---

## Step 1: Add Domain in Manus Management UI

1. Open the ChalkPicks project in Manus
2. Click the Management UI (right panel) → **Settings** → **Domains**
3. Click **Add Domain**
4. Enter: `chalkpicks.pro`
5. Click **Add Domain** again
6. Enter: `www.chalkpicks.pro`
7. Note the **CNAME target** shown (likely `chalkpicks-xui7hd5r.manus.space`)

---

## Step 2: Transfer DNS to Cloudflare (Free)

1. Go to https://dash.cloudflare.com → **Add a Site** → enter `chalkpicks.pro`
2. Select the **Free** plan
3. Cloudflare will show you two nameservers (e.g., `ada.ns.cloudflare.com`, `bob.ns.cloudflare.com`)
4. Go to Railway dashboard → **Settings** → **Domains** → `chalkpicks.pro` → **DNS Settings**
5. Change the nameservers to the Cloudflare ones
6. Wait 5-60 minutes for propagation

---

## Step 3: Configure DNS Records in Cloudflare

Once nameservers are active, add these records:

| Type  | Name       | Target                            | Proxy          |
| ----- | ---------- | --------------------------------- | -------------- |
| CNAME | `@` (root) | `chalkpicks-xui7hd5r.manus.space` | OFF (DNS only) |
| CNAME | `www`      | `chalkpicks-xui7hd5r.manus.space` | OFF (DNS only) |

**Important:** Set proxy to OFF (grey cloud) — Manus handles SSL itself.

---

## Step 4: Update Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Find the existing webhook for `https://chalkpicks.live/api/stripe/webhook`
3. Update the URL to: `https://chalkpicks.pro/api/stripe/webhook`
4. Or create a new webhook endpoint with the new URL

---

## Step 5: Keep chalkpicks.live as Redirect (Optional but Recommended)

Since chalkpicks.live already has some SEO equity and backlinks:

1. Keep the domain active
2. In Cloudflare (or wherever .live DNS is managed), add a Page Rule:
   - URL: `*chalkpicks.live/*`
   - Setting: Forwarding URL → 301 Permanent Redirect
   - Destination: `https://chalkpicks.pro/$2`

This preserves any existing Google rankings and link juice.

---

## Step 6: Verify Everything Works

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
