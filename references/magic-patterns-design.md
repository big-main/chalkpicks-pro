# Magic Patterns Generated Design — ChalkPicks Pro Hero

Generated at: https://www.magicpatterns.com/c/9ucsajjzs4pibvt5t7gctb
Preview: https://project-untitled-101.magicpatterns.app
Artifact ID: c944142d-e9e8-4540-ae71-466526c4b596

## Key Design Decisions from Magic Patterns

### Tailwind Config Colors Used:
- `chalk-bg`: #0d0f14 (near-black background)
- `chalk-gold`: #f0b800 (metallic gold)
- `chalk-neon`: #39ff14 (neon green)
- `chalk-red`: #ff3b3b (brand red)
- `chalk-blue`: #3b82f6 (brand blue)
- `chalk-card`: slightly lighter than bg for cards

### Typography:
- Display: Oswald (font-oswald class, bold, tracking-wider, uppercase)
- Body: Inter (font-inter class)

### Key Visual Elements:
1. Diagonal slash divider (skew-x-12 transform on right panel)
2. Radial blur blobs (blue top-left, gold bottom-right) for depth
3. Grid pattern SVG overlay (subtle white lines at 2% opacity)
4. Hero headline: THE FUTURE OF / SPORTS (gold) / BETTING (neon) / IS HERE
5. Live ticker at bottom with framer-motion infinite scroll
6. Stat cards with gold glow drop-shadow
7. CTA button: neon green bg, dark text, hover scale effect
8. Secondary button: gold border, transparent bg

### Component Structure:
- HeroSection.tsx — main layout with bg effects, nav, hero copy, stat grid
- LiveTicker.tsx — animated scrolling ticker with framer-motion
- StatCard.tsx — animated stat card with gold number and hover effect

### Framer Motion Animations:
- Staggered fade-in-up for hero elements (delays: 0, 0.1, 0.2, 0.3, 0.5)
- StatCards: delay 0.4, 0.5, 0.6, 0.7
- Ticker: infinite x scroll from 0 to -1000px over 20s
