import {
  InternalLink,
  type LearnFaq,
  type LearnSection,
} from "@/components/learn/LearnPageLayout";
import { LEARN_PAGES_META } from "@shared/learnPagesMeta";

export interface LearnPageContent {
  path: string;
  badge: string;
  title: string;
  intro: string;
  sections: LearnSection[];
  faqs: LearnFaq[];
}

/** FAQ content lives once, in shared/learnPagesMeta.ts — reused for the page body's FAQ section here and for FAQPage JSON-LD on both the client (FaqJsonLd) and the bot-facing server render (server/prerender.ts). */
function faqsFor(slug: string): LearnFaq[] {
  const meta = LEARN_PAGES_META.find(p => p.slug === slug);
  return meta ? meta.faqs.map(f => ({ question: f.q, answer: f.a })) : [];
}

/**
 * Content for the /learn/:slug evergreen definitional pages, keyed by slug.
 * One shared data map + one dynamic route (client/src/pages/LearnPage.tsx)
 * instead of four near-identical page components — same content, no
 * structural duplication across files. `title` here is the page's reader-
 * facing H1 (distinct copy from the <title>/meta title in learnPagesMeta.ts).
 */
export const LEARN_PAGES: Record<string, LearnPageContent> = {
  "closing-line-value": {
    path: "/learn/closing-line-value",
    badge: "Betting Fundamentals",
    title: "What Is Closing Line Value (CLV)?",
    intro:
      "The single strongest predictor of long-term betting profitability — and the metric every professional bettor tracks obsessively.",
    faqs: faqsFor("closing-line-value"),
    sections: [
      {
        title: "The Definition",
        body: (
          <>
            <p>
              Closing line value is the gap between the price you bet at and the
              price the market settled on right before kickoff — the "closing
              line." Sportsbook closing lines are the sharpest, most efficient
              number available for any game, because they've absorbed every bet,
              every piece of injury news, and every dollar of sharp money right
              up to the last minute.
            </p>
            <p>
              If you bet a team at +150 and the line closes at +120, you got a
              materially better number than the final market consensus. That gap
              — expressed as implied probability — is your CLV on that bet.
            </p>
          </>
        ),
      },
      {
        title: "Why CLV Beats Win Rate as a Skill Metric",
        body: (
          <>
            <p>
              Any single bet is dominated by variance. A well-handicapped 55%
              winner will still lose plenty of individual bets, and a lucky
              guess can cash. Over a sample of 50-100 bets, win rate alone can't
              reliably separate a +3% edge from pure noise.
            </p>
            <p>
              CLV sidesteps that problem. Because the closing line is the
              market's best real-time estimate of true probability, consistently
              beating it means you were finding value the market hadn't priced
              in yet — regardless of how any individual game turned out. That's
              why sportsbooks themselves use CLV to identify (and sometimes
              limit) sharp bettors.
            </p>
          </>
        ),
      },
      {
        title: "How to Track Your CLV",
        body: (
          <>
            <p>
              Every time you place a bet, note the exact odds you got. Compare
              those to the closing line for the same market once the game
              starts. ChalkPicks'{" "}
              <InternalLink href="/clv-tracker">CLV Tracker</InternalLink>{" "}
              automates this — log a bet and it pulls the closing number
              automatically, so you get a running CLV percentage across every
              sport and market you bet.
            </p>
            <p>
              Pairing CLV tracking with a{" "}
              <InternalLink href="/line-movement">
                line movement tracker
              </InternalLink>{" "}
              also tells you whether the market moved toward or away from your
              side after you bet — an early read on whether you're on the sharp
              side of the number.
            </p>
          </>
        ),
      },
    ],
  },

  "no-vig-odds": {
    path: "/learn/no-vig-odds",
    badge: "Betting Fundamentals",
    title: "No-Vig Odds Explained: Finding the True Line",
    intro:
      "How to strip the sportsbook's margin out of any price to see what the market actually thinks will happen.",
    faqs: faqsFor("no-vig-odds"),
    sections: [
      {
        title: "What Is the Vig?",
        body: (
          <p>
            The vig (short for "vigorish," also called juice or margin) is the
            cut a sportsbook builds into its odds to guarantee itself a profit
            regardless of the outcome. On a typical -110/-110 two-way spread,
            each side implies roughly 52.4% probability — 104.8% combined, about
            4.8 points of built-in vig. That gap is pure sportsbook margin, not
            real probability.
          </p>
        ),
      },
      {
        title: "The Math: Proportional Devigging",
        body: (
          <>
            <p>
              To find the no-vig, fair probability of each outcome: convert
              every side's American odds to implied probability, add them up,
              then divide each side's probability by that total so the set sums
              to exactly 100%.
            </p>
            <p>
              Example: -110 vs -110 gives 52.38% and 52.38% implied, summing to
              104.76%. Dividing each by 1.0476 gives a true fair line of 50% /
              50% — exactly what you'd expect from a genuine coin-flip matchup
              once the sportsbook's cut is removed.
            </p>
            <p>
              ChalkPicks' free{" "}
              <InternalLink href="/tools/devig-calculator">
                devig calculator
              </InternalLink>{" "}
              runs this automatically for any two-sided market.
            </p>
          </>
        ),
      },
      {
        title: "Using No-Vig Odds to Find Value",
        body: (
          <p>
            The standard way pros screen for +EV bets is to compare a book's
            offered price against the no-vig line from a sharp, high-limit book
            like Pinnacle. If your sportsbook's price implies a lower
            probability than the sharp no-vig fair number, the market thinks
            that outcome is more likely than your price suggests — that gap is
            your expected value. ChalkPicks'{" "}
            <InternalLink href="/ev-finder">+EV Finder</InternalLink> scans this
            exact comparison across 10+ sportsbooks in real time.
          </p>
        ),
      },
    ],
  },

  "kelly-criterion": {
    path: "/learn/kelly-criterion",
    badge: "Betting Fundamentals",
    title: "The Kelly Criterion: Sizing Bets for Long-Term Growth",
    intro:
      "The formula professional bettors use to turn a real edge into bankroll growth — without betting so big that variance takes you out.",
    faqs: faqsFor("kelly-criterion"),
    sections: [
      {
        title: "The Formula",
        body: (
          <>
            <p>
              Kelly fraction:{" "}
              <code className="text-emerald-400">f = (bp − q) / b</code>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>b</strong> — decimal odds minus 1 (the net payout per
                dollar staked)
              </li>
              <li>
                <strong>p</strong> — your true win probability
              </li>
              <li>
                <strong>q</strong> — the probability of losing (1 − p)
              </li>
            </ul>
            <p>
              Example: at +150 odds (b = 1.5) with a true win probability of
              45%, Kelly says bet{" "}
              <code className="text-emerald-400">
                (1.5 × 0.45 − 0.55) / 1.5 ≈ 8.3%
              </code>{" "}
              of your bankroll.
            </p>
          </>
        ),
      },
      {
        title: "Why Fractional Kelly Is the Practical Choice",
        body: (
          <>
            <p>
              Full Kelly assumes perfect knowledge of your true edge — an
              assumption no real bettor can satisfy, since every probability
              estimate carries error. Because Kelly's growth curve is steep and
              asymmetric, small overestimates of your edge lead to outsized bet
              sizes and painful variance.
            </p>
            <p>
              Most professional bettors stake a fraction of full Kelly —
              quarter-Kelly (25%) is a common, conservative default. It
              sacrifices some theoretical growth rate in exchange for a much
              smoother bankroll curve, which matters far more in practice than
              it does on paper.
            </p>
          </>
        ),
      },
      {
        title: "Kelly Needs a Real Edge First",
        body: (
          <p>
            Kelly sizing only helps if your win probability estimate is actually
            accurate — it says nothing about whether you have an edge in the
            first place. Start with{" "}
            <InternalLink href="/learn/no-vig-odds">
              no-vig fair odds
            </InternalLink>{" "}
            to estimate true probability, confirm the bet is +EV, and only then
            use Kelly to size it. ChalkPicks'{" "}
            <InternalLink href="/bet-calculator">bet calculator</InternalLink>{" "}
            computes quarter-Kelly stake sizing directly from your probability
            and odds inputs.
          </p>
        ),
      },
    ],
  },

  "line-movement": {
    path: "/learn/line-movement",
    badge: "Betting Fundamentals",
    title: "Line Movement & Steam Moves Explained",
    intro:
      "How to read a moving line, spot sharp money the moment it hits the market, and tell a real steam move from noise.",
    faqs: faqsFor("line-movement"),
    sections: [
      {
        title: "What Moves a Betting Line",
        body: (
          <>
            <p>
              Sportsbooks set an opening line based on their own models, then
              adjust it as bets come in — mostly to balance their liability,
              sometimes in response to injury news or weather. Two forces move a
              line the most: recreational ("public") money, which tends to be
              slow and predictable, and professional ("sharp") money, which is
              fast, large, and well-informed.
            </p>
            <p>
              Because sharp bettors typically wager close to a book's limits,
              their action can move a line by itself — which is exactly the
              signal line-movement tracking is built to catch.
            </p>
          </>
        ),
      },
      {
        title: "Steam Moves vs. Reverse Line Movement",
        body: (
          <>
            <p>
              A <strong>steam move</strong> is speed-and-size: a line jumps
              sharply — a full point or more on a spread, or a big odds swing on
              a moneyline — across several sportsbooks within minutes of each
              other. It usually means one or more sharp bettors (or a syndicate)
              just placed a large, informed bet.
            </p>
            <p>
              <strong>Reverse line movement (RLM)</strong> is
              direction-vs-volume: the line moves toward a team even though most
              public bets are on the opposing side. Since books normally shade a
              line away from the side getting more bets to balance their
              liability, a line moving the "wrong" way relative to public
              tickets is a classic tell that sharp money outweighs public volume
              on the other side.
            </p>
          </>
        ),
      },
      {
        title: "Using Line Movement in Your Own Betting",
        body: (
          <p>
            Line movement tells you where informed money is going, not
            necessarily who's right — treat it as one input alongside your own
            handicapping, not a signal to blindly chase. ChalkPicks'{" "}
            <InternalLink href="/line-movement">
              Line Movement Tracker
            </InternalLink>{" "}
            surfaces steam moves and RLM in real time across every book we
            cover, and pairs naturally with{" "}
            <InternalLink href="/learn/closing-line-value">
              closing line value
            </InternalLink>{" "}
            tracking — betting ahead of a steam move, before the number adjusts,
            is one of the most reliable ways to generate positive CLV.
          </p>
        ),
      },
    ],
  },
};
