/**
 * Single source of truth for the /learn/* evergreen definitional pages'
 * title, description, and FAQ content — consumed by:
 *   - shared/routeMeta.ts (client PageMeta + server injectSeo fallback title/description)
 *   - shared/seo-routes.ts (sitemap entries)
 *   - server/prerender.ts (bot-facing FAQPage + Breadcrumb JSON-LD)
 *   - client/src/data/learnPages.tsx (the rendered page content; sections/prose
 *     live there since they're React nodes, not shareable with the server)
 *
 * One array instead of hand-duplicating the same title/description/FAQ text
 * in four places per page.
 */
export interface LearnPageMeta {
  slug: string;
  path: string;
  breadcrumbName: string;
  title: string;
  description: string;
  faqs: { q: string; a: string }[];
}

export const LEARN_PAGES_META: LearnPageMeta[] = [
  {
    slug: "closing-line-value",
    path: "/learn/closing-line-value",
    breadcrumbName: "Closing Line Value",
    title: "What Is Closing Line Value (CLV)? | ChalkPicks",
    description:
      "Closing line value (CLV) explained: how to calculate it, why it beats win rate as a skill metric, and how to track it on every bet.",
    faqs: [
      {
        q: "What is closing line value (CLV)?",
        a: "Closing line value (CLV) is the difference between the odds you bet at and the odds available right before the game starts (the closing line). Positive CLV means you got a better price than the market settled on — the strongest long-run predictor of a bettor's skill.",
      },
      {
        q: "How do you calculate CLV?",
        a: "Convert both your bet price and the closing price to implied probability, then subtract: CLV = closing implied probability − your implied probability. A positive number means you beat the close. ChalkPicks' CLV Tracker does this automatically for every logged bet.",
      },
      {
        q: "Why does CLV matter more than win rate?",
        a: "Win rate is noisy over any single season because of variance — even a +EV bettor can lose more than they win in the short run. CLV isolates whether you're consistently getting better prices than the closing market, which is the market's best available estimate of true probability, so it converges to true skill much faster than win/loss record.",
      },
      {
        q: "Can you have positive CLV and still lose a bet?",
        a: "Yes, constantly. A single game's outcome is a coin flip relative to your edge; CLV measures whether the price you got was good, not whether that particular bet won. Professional bettors track CLV over hundreds of bets, not individual results.",
      },
    ],
  },
  {
    slug: "no-vig-odds",
    path: "/learn/no-vig-odds",
    breadcrumbName: "No-Vig Odds",
    title: "No-Vig Odds Explained | ChalkPicks",
    description:
      "How to remove the sportsbook's vig from any odds to find the true, fair probability — and use it to spot +EV bets.",
    faqs: [
      {
        q: "What does 'no-vig' or 'devigged' odds mean?",
        a: "No-vig (or devigged) odds are betting odds with the sportsbook's built-in profit margin — the vig, or juice — mathematically removed, leaving only the market's true, fair probability estimate for each outcome.",
      },
      {
        q: "Why do sportsbook odds add up to more than 100%?",
        a: "Every priced market has implied probabilities that sum to slightly over 100% (often 104-108%) because the book bakes in a margin on both sides of the bet. That extra percentage is the vig — the book's guaranteed edge if it takes balanced action on both sides.",
      },
      {
        q: "How do you remove the vig from odds?",
        a: "The simplest method (proportional devigging) converts each side's American odds to implied probability, sums them, then divides each individual probability by that sum so they total exactly 100%. More advanced methods (power, Shin) adjust for favorite-longshot bias, but proportional devigging is accurate enough for most two-way markets.",
      },
      {
        q: "Why do bettors care about no-vig odds?",
        a: "No-vig odds are the closest available estimate of a game's true probability. Comparing your bet's price to a sharp book's no-vig line is the standard way to check whether a bet is +EV before you place it — if your price implies a lower probability than the no-vig fair number, you likely have an edge.",
      },
    ],
  },
  {
    slug: "kelly-criterion",
    path: "/learn/kelly-criterion",
    breadcrumbName: "Kelly Criterion",
    title: "The Kelly Criterion for Bet Sizing | ChalkPicks",
    description:
      "The Kelly Criterion formula explained: how to size bets for long-term bankroll growth, and why fractional Kelly is the practical choice.",
    faqs: [
      {
        q: "What is the Kelly Criterion in sports betting?",
        a: "The Kelly Criterion is a formula for sizing bets that maximizes a bankroll's long-run growth rate given your edge and the odds offered: f = (bp − q) / b.",
      },
      {
        q: "What is the Kelly Criterion formula?",
        a: "Kelly fraction f = (bp − q) / b, where b is the decimal payout odds minus 1, p is your true win probability, and q is 1 − p. The result is the percentage of your bankroll to wager on that specific bet.",
      },
      {
        q: "Why do bettors use fractional Kelly instead of full Kelly?",
        a: "Full Kelly assumes your probability estimate is exactly correct, which it never is in practice. Betting a fraction of full Kelly — commonly 25% (quarter-Kelly) or 50% (half-Kelly) — trades some theoretical growth rate for much lower variance, protecting the bankroll against estimation error.",
      },
      {
        q: "What happens if you bet more than your Kelly fraction?",
        a: "Overbetting past full Kelly increases variance faster than it increases expected growth, and betting roughly double the Kelly fraction or more actually reduces long-run bankroll growth toward zero — it's mathematically the same as gambling with no edge at all, despite still having a real edge on the bet.",
      },
    ],
  },
  {
    slug: "line-movement",
    path: "/learn/line-movement",
    breadcrumbName: "Line Movement",
    title: "Line Movement & Steam Moves Explained | ChalkPicks",
    description:
      "How betting lines move, what a steam move is, how it differs from reverse line movement, and how to track sharp money in real time.",
    faqs: [
      {
        q: "What is a steam move in sports betting?",
        a: "A steam move is a sudden, sharp shift in the betting line — often several points or a large odds jump — that happens nearly simultaneously across multiple sportsbooks, typically signaling professional money hit the market.",
      },
      {
        q: "What's the difference between a steam move and reverse line movement?",
        a: "A steam move is defined by speed and size — a fast, large shift across books. Reverse line movement (RLM) is defined by direction relative to public betting: the line moves toward a team even though the majority of public bets are on the other side, which suggests sharp money is outweighing public volume.",
      },
      {
        q: "How can bettors track line movement in real time?",
        a: "Track the opening line at multiple sportsbooks and monitor it through game time, watching for sudden multi-point or odds jumps that hit several books close together. ChalkPicks' Line Movement Tracker automates this, flagging steam moves and reverse line movement the moment they happen.",
      },
      {
        q: "Should bettors always follow steam moves?",
        a: "Not blindly — by the time a steam move is visible, some of its value is often already priced in, and not every steam move is driven by informed money (some reflect large recreational bets or trap lines set by books). Steam is a strong signal worth weighing alongside your own analysis, not a standalone betting system.",
      },
    ],
  },
];
