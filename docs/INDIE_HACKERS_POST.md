# Indie Hackers Post — ChalkPicks Pro

**Category:** Show IH / Product Launch

---

## Title

```
I built an AI sports betting analytics platform with a cryptographic pick ledger — here's why the "proof" feature matters more than the win rate
```

---

## Body (paste as-is)

```
Most sports picks services have a trust problem: they show you their winners after the game.

There's no way to verify the pick existed before tip-off. No timestamp. No proof. Just a screenshot they could have taken at any time.

I built ChalkPicks Pro to fix that.

---

**The core idea: hash-lock picks before the game.**

When a pick is published, we compute a SHA-256 hash of the pick content (team, line, sport, timestamp) and write it to an immutable ledger. The hash is locked — if anyone edits the pick after the fact, the hash breaks and the verify URL shows "invalid."

Every pick has a public verify URL:
https://chalkpicks.live/verify/173a20e7629e0617d78b75279a69fceec7cb99b9dd26616b3bb39bd897382937

That's a real ledger entry: Tampa Bay Rays +1.5, locked 19 hours before game time, CLV +21.02%, WIN.

---

**What else is in the platform:**

- AI-scored picks across NFL, NBA, MLB, NHL, Soccer (confidence scores, edge context)
- +EV Finder — live line shopping across major books
- CLV tracking — closing line value measures process quality, not just outcomes
- Steam move alerts — sharp money signals
- 10 free calculators (odds, Kelly, EV, devig, parlay, free bet converter) — no signup required

**Pricing:** Free tools forever. Premium starts at $9.99/mo.

---

**The stack:**

React 19 + Tailwind 4 + tRPC + Drizzle ORM + MySQL. Deployed on Manus (managed hosting). SharpAPI for odds data with a 3-tier fallback cascade. Heartbeat jobs for cache warmup and daily pick generation.

---

**What I learned building this:**

The hardest part wasn't the AI picks or the odds integration. It was the trust layer. Sports betting has so much noise and so many bad actors that even a legitimate analytics product has to over-engineer the proof.

The ledger is that proof. It's the moat.

---

**Looking for feedback on:**

1. Is the verify URL UX clear enough? Does it communicate "this pick was locked before the game" without needing a paragraph of explanation?
2. Free tools as the acquisition channel — is 10 calculators too many? Should I consolidate?
3. CLV as the primary performance metric — does this resonate with bettors outside the sharp community?

Happy to answer questions about the stack, the odds data pipeline, or the business model.

18+ / 21+ where required. Analytics only — not financial advice. Gamble responsibly.
```

---

## Notes

- Post in "Show IH" category for maximum visibility
- Respond to every comment within the first 24 hours
- If asked about revenue, share MRR honestly (or say "pre-revenue, launched today")
- Link to the verify URL in comments when trust questions come up
- Do not claim win rates — point to the performance page and the ledger
