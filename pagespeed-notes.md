# PageSpeed Optimization Notes (Jul 28, 2026)

## Current Scores (Mobile)
- Performance: 41
- Accessibility: 74
- Best Practices: 100
- SEO: 100

## Core Web Vitals
- FCP: 4.3s (target: <1.8s)
- LCP: 19.9s (target: <2.5s) — caused by 2.8MB PNG hero image
- TBT: 390ms (target: <200ms) — caused by recharts + framer-motion forced reflow
- CLS: 0.229 (target: <0.1) — caused by PageTransition y:12 animation
- Speed Index: 5.9s

## Issues and Fixes

### 1. Hero Image (CRITICAL — saves ~2,742 KB, fixes LCP)
- Original: https://files.manuscdn.com/user_upload_by_module/session_file/310519663518369468/UFErFNbZfWFixyyI.png (2.8MB, 1920x1920 PNG)
- WebP 800px: https://d2xsxph8kpxj0f.cloudfront.net/310519663518369468/XUi7Hd5RzDcuAESzHPA75p/hero-800.webp (65KB)
- WebP 400px: https://d2xsxph8kpxj0f.cloudfront.net/310519663518369468/XUi7Hd5RzDcuAESzHPA75p/hero-400.webp (18KB)
- Fix: Use <picture> element with srcset, add fetchpriority="high", preconnect d2xsxph8kpxj0f.cloudfront.net

### 2. Render-blocking CSS (saves ~880ms)
- /assets/index-CqwmsicU.css — 35.1KB, 1060ms
- Google Fonts — 2KB, 780ms
- Fix: Add font-display:swap to Google Fonts URL (already has display=swap), preload critical woff2

### 3. CLS 0.229 — PageTransition
- Culprit: PageTransition.tsx y:12 animation causes layout shift on initial load
- Fix: Change initial y:12 to opacity-only (no y translation), or add will-change:transform

### 4. Forced Reflow (TBT contributor)
- vendor-motion-CzJDtXAJ.js — 98ms reflow
- vendor-charts-6VRwYiO7.js — 28ms reflow
- Fix: Defer HeroBackground canvas on mobile, lazy-load Recharts chart below fold

### 5. Missing preconnect
- Add: <link rel="preconnect" href="https://d2xsxph8kpxj0f.cloudfront.net">
- Add: <link rel="preconnect" href="https://files.manuscdn.com">

### 6. DOM Size: 1,055 elements
- HorizontalScrollTicker has 37 children — reduce to 10 visible
- Recharts SVG adds many tspan elements

### 7. Accessibility (74/100)
- Need to audit contrast ratios, missing aria-labels, form labels
