# ChalkPicks Visual Brand Guidelines

## Color Palette (OKLCH for Tailwind 4)

| Role | Color | OKLCH | Hex |
|------|-------|-------|-----|
| Background (primary) | Deep Black | oklch(0.12 0.01 250) | #0d0f14 |
| Background (card) | Dark Navy | oklch(0.18 0.02 250) | #141a24 |
| Background (elevated) | Charcoal | oklch(0.22 0.02 250) | #1a2030 |
| Primary/Premium | Metallic Gold | oklch(0.78 0.15 85) | #d4a017 |
| Primary Hover | Bright Gold | oklch(0.85 0.17 85) | #f0b800 |
| Accent/Action | Neon Green | oklch(0.82 0.25 145) | #39ff14 |
| Accent Muted | Dark Green | oklch(0.55 0.18 145) | #1a8c0a |
| Danger/Loss | Hot Red | oklch(0.60 0.22 25) | #e63946 |
| Text Primary | Crisp White | oklch(0.97 0.01 250) | #f0f2f5 |
| Text Secondary | Cool Gray | oklch(0.70 0.02 250) | #9ca3af |
| Border | Dark Border | oklch(0.30 0.03 250) | #2a3040 |

## Typography

- **Headers (H1-H2):** Bold, heavy, uppercase — font-family: "Oswald" or "Bebas Neue" (Google Fonts)
- **Body/Data:** Clean sans-serif — font-family: "Inter" (already loaded)
- **Accents/Labels:** Condensed uppercase — font-family: "Barlow Condensed"
- **Key numbers (odds, percentages):** Extra bold, slightly larger, gold or green color

## Visual Effects (CSS)

- **Neon glow on accent elements:** `text-shadow: 0 0 10px rgba(57,255,20,0.5), 0 0 20px rgba(57,255,20,0.3)`
- **Gold shimmer on headers:** `background: linear-gradient(135deg, #d4a017, #f0b800, #d4a017); -webkit-background-clip: text`
- **Card borders:** Subtle gradient border with green/gold glow on hover
- **Background texture:** Subtle noise overlay or stadium-blur pattern
- **Shadows:** Deep, layered box-shadows with colored glow (green or gold)

## Layout Principles

- Dark-first design — all backgrounds are near-black
- High contrast — gold and green pop against dark backgrounds
- Center-aligned hero content
- Data-heavy sections use grid layouts with card-based grouping
- Premium feel — generous spacing, subtle animations on hover
- Mobile-first — optimized for 9:16 viewing

## Instagram Content Themes

- **Background:** Always dark (black/deep navy) with subtle stadium or sports textures
- **Headlines:** Metallic gold 3D text with beveled edges
- **Pick/Action text:** Neon green with glow effect, slightly distressed/grunge font
- **Team names:** Clean white on brushed metal nameplates
- **Data sections:** Dark cards with green/gold accent borders
- **Branding:** Crown logo at top, @chalkpicks handle, chalkpicks.live CTA at bottom
- **Disclaimer:** "For entertainment purposes only. Bet responsibly." at bottom
