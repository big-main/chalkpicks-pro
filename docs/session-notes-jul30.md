# Session Notes — Jul 30 2026

## Secrets Set This Session

- SCHEDULER_SECRET = 6be1f8817321d5ddfaba79dc84902a2d2489c906008e8ebbcd8b521c1a97c764
- CRON_SERVICE_TOKEN = 1b38254724009209ec24cbd53a673f00c1fbc33baa791879e9d2276ea0f7cb1f
- PAGESPEED_API_KEY = AIzaSyCGJoltLOP4RKkGgFx140NGGcAl6_h_93c

## n8n Workflows to Update

These endpoints need their request payloads updated with the new secrets:

1. notifications.scheduledDailyPicks → `secret` field = SCHEDULER_SECRET value
2. ev.stampClosingLines → `token` field = CRON_SERVICE_TOKEN value
3. ev.stampCLV → `token` field = CRON_SERVICE_TOKEN value

n8n instance: bigmain.app.n8n.cloud

## Claude Artifact — Directory Submissions Tracker

Source: https://claude.ai/public/artifacts/8fdc2d1f-1730-4eb5-94b5-651f1831a428

### Positioning Copy (corrected pricing: Basic $9.99/mo · Pro $19.99/mo · Elite $59.99/yr)

- Tagline: AI-Powered Sports Betting Analytics with Cryptographically Verified Picks — +EV Finder, CLV Tracker, Steam Move Alerts
- Short (150 chars): AI sports betting analytics with cryptographically verified picks. +EV finder, CLV tracker, steam move alerts. Free tier available.
- Medium (300 chars): ChalkPicks uses AI and real-time odds data to find mathematically profitable betting opportunities — +EV scanning, steam move detection, closing line value tracking. Every pick is hashed and locked before results are known, publicly verifiable at chalkpicks.live/verify. Covers NFL, NBA, MLB, NHL and more.

### Tier 1 (Highest impact, do first)

| Directory     | URL                                          | DA  |
| ------------- | -------------------------------------------- | --- |
| Product Hunt  | https://www.producthunt.com/posts/new        | 91  |
| AlternativeTo | https://alternativeto.net/software/add       | 82  |
| G2            | https://www.g2.com/products/new              | 92  |
| Capterra      | https://www.capterra.com/vendors/sign-up     | 93  |
| Trustpilot    | https://www.trustpilot.com/businesses/signup | —   |

### Tier 2 (AI tool directories, free, low effort)

- There's An AI For That: https://theresanaiforthat.com/submit
- Futurepedia: https://www.futurepedia.io/submit-tool
- FutureTools: https://futuretools.io
- AI Tool Directory: https://aitoolsdirectory.com
- TopAI.tools: https://topai.tools
- AItoolsclub: https://aitoolsclub.com
- Toolify.ai: https://www.toolify.ai

### Tier 3 (Startup/SaaS directories)

- Indie Hackers: https://www.indiehackers.com
- Hacker News (Show HN): https://news.ycombinator.com/submit
- BetaList: https://betalist.com/startups/new
- Peerlist: https://peerlist.io
- Uneed: https://uneed.best
- Launching Next: https://www.launchingnext.com
- SourceForge: https://sourceforge.net
- Slant: https://slant.co

### Tier 4 (Sports betting niche)

- SportsBettingTools.io: https://sportsbettingtools.io
- SmartBettingGuide: https://smartbettingguide.com
- SharpSide: https://sharpside.com
- Sports Insights: https://www.sportsinsights.com

### Reddit (organic, not submission)

- r/sportsbook (1M+), r/sportsbetting (500K+), r/DFS (100K+)
- r/sideproject, r/SaaS, r/startups
- r/datascience

### Guest post / backlink targets

- Medium / Substack: "How we verify picks with cryptographic hashing"
- Niche betting blogs: Tool review / comparison placement
- The Ringer, SI, Bleacher Report: Long-shot, high-DA

### Product Hunt Launch Checklist

- Tuesday–Thursday launch
- Logo 240×240, 4 screenshots 1270×952
- Tagline: lead with "cryptographically verified picks"
- Line up network for early upvotes (first 2 hours matter most)
- Cross-post to r/sideproject same day

### Status Summary

- Google/Bing sitemap ping URLs: DEAD (404/410)
- Google Search Console: ✅ Done
- Bing Webmaster / IndexNow: ✅ Done
- Discord: ✅ Done (4x/day)
- SaaSHub: 🟡 Listed, verification pending
- Everything else: 🔴 Not submitted yet

## Deployment Issue

- Last checkpoint (2c5c0f2d) failed deploy with "Cannot find module dist/index.js"
- Root cause: The platform's container build ran pnpm install but not pnpm build
- Build works fine locally (dist/index.js = 729.9kb)
- Re-saved checkpoint to trigger fresh deploy attempt
