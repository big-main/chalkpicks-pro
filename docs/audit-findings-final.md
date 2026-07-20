# Final Audit Findings

## Current State Summary

### Picks System
- picks.list is a PUBLIC procedure — anyone can see picks
- Free users see pick recommendation + teams but odds/confidence/analysis are LOCKED behind "Upgrade" CTA
- Premium users see full pick details
- There IS a "free" tier concept in picks (tier: "free" vs "premium")
- The "START FREE TRIAL" button goes to /pricing

### Performance/Track Record
- /performance page is PUBLIC (uses publicProcedure: picks.performance, picks.recentSettled)
- Shows ROI, win rate, charts — already a public track record page!
- Has a CTA at the bottom to upgrade

### Existing Calculator Tools (ALL EXIST)
- /tools/odds-calculator — OddsCalculator.tsx
- /tools/roi-calculator — ROICalculator.tsx
- /tools/parlay-calculator — ParlayCalculator.tsx
- /tools/devig-calculator — DevigCalculator.tsx
- /tools/bankroll-manager — BankrollManager.tsx
- /bet-calculator — BetCalculator.tsx

### What's MISSING (from Monica recommendations)
1. **Free daily pick page** — NOT a separate page. Free picks exist in the system but they're mixed in with premium picks on /picks. Need a dedicated `/free-pick` or `/free-daily-pick` page that's indexable and shows 1 full free pick with analysis (no blur).
2. **Kelly Criterion standalone calculator** — Kelly is embedded in Backtesting and BankrollManager but no standalone /tools/kelly-calculator page
3. **EV Calculator standalone** — EVFinder exists but requires premium. Need a free /tools/ev-calculator
4. **Homepage trust bar** — Homepage has animated counters but no live results ticker at the top
5. **README security** — Admin credentials exposed in public GitHub README
6. **Structured data JSON-LD** — Needs Organization, Article, FAQ schemas

### What ALREADY EXISTS (don't rebuild)
- Public track record: /performance (public, shows ROI, win rate, recent settled picks)
- SEO system: shared/seo-routes.ts, prerender, sitemap
- Blog system: /blog with AI-generated content
- Sport-specific pages: /nfl-picks, /nba-picks, etc.
- Daily picks archive: /daily-picks
- Calculator tools: 6 different calculators
- Newsletter system: newsletter_subscribers table + SMTP
