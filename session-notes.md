# Session Notes - Jul 10, 2026

## Completed This Session
1. Fixed deployment failure (removed Socket Security postinstall script)
2. Aligned all pricing to Stripe: Basic $9.99/mo, Pro $19.99/mo, Elite $59.99/yr
3. Increased rate limit from 100 to 300 req/min
4. Fixed BabyLoveGrowth blog handler - now fetches full articles by ID (list endpoint only returns summaries)
5. Successfully imported 3 articles from BabyLoveGrowth API
6. Created heartbeat cron: blog-content (daily at 7am PT)
7. Created public /blog page (Blog.tsx) - lists published articles from DB
8. Created /blog/:slug detail page (BlogPost.tsx) - renders full article with SEO JSON-LD
9. Added blog routes to App.tsx
10. Added ToolPilot.ai badge to footer (Home.tsx)
11. Added /blog link to footer navigation

## ToolPilot Badge
- Image URL: /manus-storage/toolpilot-badge_17f2d7f0.jpg
- Links to: https://www.toolpilot.ai
- Placed in footer bottom bar

## BabyLoveGrowth API
- Base URL: https://api.babylovegrowth.ai/api/integrations/v1
- API Key: set via environment variable, not committed — rotate the previously-committed key
- List articles: GET /articles?limit=50&offset=0 (returns array, no content)
- Get full article: GET /articles/:id (returns content_html, content_markdown, jsonLd, faqJsonLd)
- Pagination: limit + offset params, max 500 per call

## Still Needs
- Add blog to sitemap.xml
- Add PageMeta SEO entry for /blog
- OpenRouter credits need topping up for AI picks
- Gmail App Password needed (current password may not be an App Password)
- Deployment was successful (chalkpicks.live, chalkpicks.manus.space)
