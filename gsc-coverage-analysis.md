# Google Search Console Coverage Analysis (Jul 28, 2026)

## Current Indexing Status
- **Indexed:** 12 pages (down from peak of 14 on Jul 1-9)
- **Not Indexed:** 18 pages (spiked to 33 on Jun 30 when new pages added, settled to 18)
- **Total URLs in sitemap:** 564 (includes 130+ individual pick pages /picks/:id)

## Critical Issues Found

### 1. Page with redirect (7 pages)
**Root cause:** `www.chalkpicks.live` pages redirect 301 → `chalkpicks.live` equivalents.
This is CORRECT behavior (www → non-www canonical). Google reports these as "not indexed" because they redirect.
**Fix:** No code fix needed — this is expected. Google will eventually stop reporting these. But ensure `www.chalkpicks.live` is NOT in the sitemap (it isn't — confirmed).

### 2. Duplicate without user-selected canonical (4 pages)
**Root cause:** Multiple individual pick pages (`/picks/1`, `/picks/2`, etc.) have identical thin content when viewed by Googlebot. The prerender serves the SPA shell with a generic title "AI Sports Betting Picks | ChalkPicks" for non-existent picks (returns 200 instead of 404).
**Fix:** 
- Return 404 for non-existent pick IDs in prerender
- For valid picks, the prerender already serves unique title/description (confirmed working for /picks/1)
- The "duplicate" issue is likely from picks that have been deleted or have identical content

### 3. Alternate page with proper canonical tag (4 pages)
**Status:** No fix needed — Google correctly respects the canonical tag.

### 4. Soft 404 (1 page)
**Root cause:** `/picks/999999` returns HTTP 200 but renders generic "AI Sports Betting Picks" content with no actual pick data. Google classifies this as a soft 404.
**Fix:** Return HTTP 404 status for non-existent pick IDs in the prerender middleware.

### 5. Duplicate, Google chose different canonical than user (1 page)
**Root cause:** Likely a pick page where Google decided the canonical should be `/picks` instead of `/picks/:id` because the content is too thin/similar.
**Fix:** Ensure each pick page has unique, substantial content visible to Googlebot.

### 6. Crawled - currently not indexed (1 page)
**Root cause:** Google crawled but decided not to index — likely a thin page.
**Fix:** Add more unique content to the page body.

## Key Fixes to Implement

1. **Prerender: Return 404 for non-existent picks** — check if pick ID exists in DB before serving 200
2. **Remove individual pick pages from sitemap** — 130+ pick URLs are bloating the sitemap and most are thin/duplicate. Only include picks with substantial unique content (high confidence, detailed analysis).
3. **Add noindex to paywall-gated pages** — individual picks behind paywall should use `<meta name="robots" content="noindex">` since Google can't see the content anyway.
4. **Reduce sitemap to ~50 high-value URLs** — focus on landing pages, tools, guides, blog posts.

## WebP CDN URLs (for PageSpeed fix)
- hero-800.webp: https://d2xsxph8kpxj0f.cloudfront.net/310519663518369468/XUi7Hd5RzDcuAESzHPA75p/hero-800.webp (65KB)
- hero-400.webp: https://d2xsxph8kpxj0f.cloudfront.net/310519663518369468/XUi7Hd5RzDcuAESzHPA75p/hero-400.webp (18KB)
- Original PNG: https://files.manuscdn.com/user_upload_by_module/session_file/310519663518369468/UFErFNbZfWFixyyI.png (2.8MB)

## PageSpeed Issues (from pagespeed-notes.md)
- LCP: 19.9s → fix with WebP hero + fetchpriority="high" + preconnect
- CLS: 0.229 → fix PageTransition y:12 animation
- TBT: 390ms → defer HeroBackground on mobile, lazy-load Recharts
- FCP: 4.3s → preconnect fonts, inline critical CSS
