# ChalkPicks Optimization Plan — Consolidated from Monica AI Multi-Model Audit

Source: Monica AI chat (GPT-5.5, Gemini 3.1 Pro, Claude Sonnet 4.6, Grok 4.3, Monica)
Date: July 19, 2026

---

## Priority 1: IMMEDIATE (This Week) — Traffic & Distribution

### 1A. Free Tier / Lead Magnet (CRITICAL)
- Ship a **free daily pick** (1 pick/day, email-gated at most)
- Yesterday's picks unlocked after grading (public, indexable)
- Public track record page with real, transparent stats
- Steam alert teasers (delayed 15-30 min) for free users
- This single change enables ALL social distribution

### 1B. Social Distribution (Manual / Automation)
- X/Twitter: @ChalkPicks — post 2-4 free picks daily with AI analysis
- Post graded recaps every night: "Yesterday's AI card: 3-1, +2.4u"
- Use Steam Move Detector as unique automated content
- TikTok/Reels/Shorts: 30-60s "My AI made today's picks" videos
- Reddit: r/sportsbook value posts (no links, site in profile only)
- Discord: #free-daily-pick + #steam-alerts channels (retention engine)

### 1C. Analytics & Search Console
- Google Search Console: verify site, submit sitemap
- Analytics: already have Plausible/PostHog — confirm tracking works
- Conversion funnel: Visitor → Pricing View → Checkout Start → Paid

---

## Priority 2: SEO & Indexability (Weeks 2-8)

### 2A. Fix SPA Rendering for Crawlers
- Already have prerender middleware (server/prerender.ts) — verify it works for all key pages
- Ensure unique <title> and <meta description> per page
- Confirm sitemap.xml includes all public routes
- Verify robots.txt is correct

### 2B. Auto-Generate Daily Pick Pages (SEO Content Machine)
- `/picks/nfl/2026-07-20` with unique titles: "NFL Picks Today — July 20 AI Best Bets"
- Scheduler already creates content — publish free versions as indexable pages
- Target keywords: "NBA picks today", "NFL picks today", "MLB picks today"

### 2C. Free Tool Landing Pages (Passive Traffic)
- `/tools/kelly-calculator` — Kelly Criterion Calculator (free, no login)
- `/tools/parlay-calculator` — Parlay Odds Calculator (free)
- `/tools/arbitrage-calculator` — Arbitrage Calculator (free)
- `/tools/ev-calculator` — Expected Value Calculator (free)
- These earn search traffic and backlinks passively

### 2D. Structured Data (JSON-LD)
- Organization schema on homepage
- Article schema on blog posts
- FAQ schema on pricing page
- BreadcrumbList on all pages

---

## Priority 3: Design & UX Polish

### 3A. Color System Refinement
- Already using Neon Cyber dark theme — verify contrast ratios ≥ 4.5:1
- Semantic consistency: green = win/positive ROI, red = loss, amber = push/pending
- Never communicate win/loss with color alone — add ✓/✗ icons

### 3B. Typography
- Mono font for odds/records/ROI (tabular-nums): already using JetBrains Mono
- Verify font-display: swap and font preloading

### 3C. Mobile Optimization
- Header height under 72px
- Tap targets at least 44px
- Pick cards instead of wide tables on mobile
- Filters collapsible on mobile
- Skeleton loaders (already implemented)

### 3D. Premium Pick Card UX
- Blurred/locked premium picks with gradient fade + "Unlock" CTA
- Status badges: Won (green), Lost (red), Push (amber), Pending (blue)
- Don't show stale picks as "active" after game starts

---

## Priority 4: Trust & Conversion

### 4A. Track Record Page (May Be More Important Than Pricing)
- Filters: Sport, Month, Year, Bet type, Result, Odds range
- Key metrics: Total picks, Win rate, Units won/lost, ROI, Current streak
- Show both win rate AND ROI (win rate alone is misleading)
- CLV tracking display: "Posted: -110, Closing: -125, CLV: +15 cents"

### 4B. Homepage Conversion
- Live results ticker at top (recent record scrolling)
- Trust bar: "+127.4 Units All-Time | 58.2% Win Rate | Transparent Record"
- Hero with preview pick card
- CTAs: "View Today's Picks" + "See Track Record"

### 4C. Methodology Section
- "How We Pick" page explaining the AI process
- Builds trust without revealing proprietary logic

---

## Priority 5: Legal & Compliance

### 5A. README Security
- Remove admin credentials from public GitHub README
- Remove SQL promotion instructions
- Remove "guaranteed profit" language anywhere

### 5B. Disclaimer Pages
- /responsible-gambling (already exists)
- /terms (already exists)
- /privacy (already exists)
- Footer disclaimer on every page
- Link to 1-800-GAMBLER

### 5C. Premium Gating Security
- Never send locked pick content to browser if user not subscribed
- Verify server-side subscription checks (already using premiumProcedure)

---

## Priority 6: Retention & Email

### 6A. Email Sequences (n8n drip — partially built)
- Welcome email (Day 0)
- "How to use today's card" (Day 1)
- Win recap + social proof (Day 3)
- "You're missing picks" re-engagement (Day 7)

### 6B. Notification Preferences
- Email alerts, Push notifications, Discord alerts
- Sport-specific notification toggles
- Already have push notifications — verify preferences UI

---

## Priority 7: Paid Acquisition (After Organic Foundation)

- Micro-influencers on betting Twitter/Instagram ($50-300/shoutout)
- Newsletter sponsorships in sports betting newsletters
- Affiliate/rev-share program for creators
- Reddit ads ($10-20/day — one of few platforms allowing gambling-adjacent)

---

## Implementation Order (What Manus Should Build)

1. **Free daily pick page** — public, indexable, email-capture
2. **Public track record page** — filterable, transparent stats
3. **Free calculator tools** — Kelly, Parlay, EV, Arbitrage
4. **Daily pick archive pages** — `/picks/{sport}/{date}` with SEO titles
5. **Homepage trust bar + live ticker**
6. **README security cleanup**
7. **Verify prerender + sitemap coverage**
