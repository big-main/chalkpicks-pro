# Grok Premium Optimization Plan — Phase 46

## Source: Pasted_content_11.txt + Pasted_content_12.txt

## Brand Copy Changes (DONE)
- Hero: "Gain a Mathematical Edge with AI-Driven Analysis" (was "Beat the Sportsbooks with AI")
- Subheadline: "institutional-grade sports analytics" (was "professional betting analytics")
- Footer: "Analyze responsibly" (was "Bet responsibly")
- Footer: "Predictive sports analysis involves variance" (was "Sports betting involves risk")

## UI/UX Theme Upgrades (IN PROGRESS)
- Deep Slate bg: #0B0F19 (main), #1A2235 (card surface), #2A3653 (borders)
- Neon Mint: #10B981 for +EV indicators
- Electric Cyan: #06B6D4 for AI confidence scores
- Rose: #F43F5E for negative indicators
- JetBrains Mono for data tables (ALREADY loaded in index.html)
- Inter for body text (ALREADY loaded)
- Glassmorphism mobile nav: MobileBottomNav.tsx ALREADY has backdrop-blur(24px) + saturate(1.5)
- Add `.data-table` utility class with tabular-nums + font-mono

## Current Theme State
- Background: oklch(0.06 0.015 270) ≈ very dark blue-black (close to #0B0F19)
- Card: oklch(0.10 0.015 270) ≈ dark panel (close to #1A2235)
- Border: oklch(0.18 0.015 270) ≈ subtle border (close to #2A3653)
- Primary: oklch(0.82 0.25 145) = neon green
- JetBrains Mono already loaded via Google Fonts CDN
- MobileBottomNav already has glassmorphism with backdrop-blur(24px)

## What Still Needs Doing
1. Add accent-mint (#10B981), accent-cyan (#06B6D4), accent-rose (#F43F5E) as CSS vars
2. Add `.data-table` utility class (font-variant-numeric: tabular-nums + font-mono)
3. Add glow-mint and glow-cyan box shadows
4. Apply font-mono to data tables in EVFinder, SteamMoves, Arbitrage pages

## WebSocket Architecture (TO DO)
- Existing: server/websocket.ts with ws package, path /api/ws, channels: subscribe/unsubscribe
- Already integrated into server/_core/index.ts via initializeWebSocket(server)
- broadcastToChannel() and broadcastToAll() exported
- Cloud Computer: nginx already proxies /api/ with WebSocket upgrade headers
- What's needed: Wire the steam move data source to broadcast on "steam-moves" channel
- Frontend hook: useLiveMarketData connecting to wss://chalkpicks.live/api/ws

## Cloud Computer State
- nginx: /api/ location already has Upgrade + Connection headers for WebSocket
- PM2: chalkpicks-prod on port 3001
- The WebSocket server is ALREADY part of the main app (not a separate process)
- Just need to wire data → broadcastToChannel("steam-moves", data)
