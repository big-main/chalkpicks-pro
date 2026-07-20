import { LearnPageLayout } from "@/components/learn/LearnPageLayout";

const FAQS = [
  {
    question: "What does 'no-vig' or 'devigged' odds mean?",
    answer:
      "No-vig (or devigged) odds are betting odds with the sportsbook's built-in profit margin — the vig, or juice — mathematically removed, leaving only the market's true, fair probability estimate for each outcome.",
  },
  {
    question: "Why do sportsbook odds add up to more than 100%?",
    answer:
      "Every priced market has implied probabilities that sum to slightly over 100% (often 104-108%) because the book bakes in a margin on both sides of the bet. That extra percentage is the vig — the book's guaranteed edge if it takes balanced action on both sides.",
  },
  {
    question: "How do you remove the vig from odds?",
    answer:
      "The simplest method (proportional devigging) converts each side's American odds to implied probability, sums them, then divides each individual probability by that sum so they total exactly 100%. More advanced methods (power, Shin) adjust for favorite-longshot bias, but proportional devigging is accurate enough for most two-way markets.",
  },
  {
    question: "Why do bettors care about no-vig odds?",
    answer:
      "No-vig odds are the closest available estimate of a game's true probability. Comparing your bet's price to a sharp book's no-vig line is the standard way to check whether a bet is +EV before you place it — if your price implies a lower probability than the no-vig fair number, you likely have an edge.",
  },
];

export default function LearnNoVigOdds() {
  return (
    <LearnPageLayout
      path="/learn/no-vig-odds"
      badge="Betting Fundamentals"
      title="No-Vig Odds Explained: Finding the True Line"
      intro="How to strip the sportsbook's margin out of any price to see what the market actually thinks will happen."
      faqs={FAQS}
      sections={[
        {
          title: "What Is the Vig?",
          body: (
            <p>
              The vig (short for "vigorish," also called juice or margin) is the
              cut a sportsbook builds into its odds to guarantee itself a profit
              regardless of the outcome. On a typical -110/-110 two-way spread,
              each side implies roughly 52.4% probability — 104.8% combined,
              about 4.8 points of built-in vig. That gap is pure sportsbook
              margin, not real probability.
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
                then divide each side's probability by that total so the set
                sums to exactly 100%.
              </p>
              <p>
                Example: -110 vs -110 gives 52.38% and 52.38% implied, summing
                to 104.76%. Dividing each by 1.0476 gives a true fair line of
                50% / 50% — exactly what you'd expect from a genuine coin-flip
                matchup once the sportsbook's cut is removed.
              </p>
              <p>
                ChalkPicks' free{" "}
                <a
                  href="/tools/devig-calculator"
                  className="text-emerald-400 hover:underline"
                >
                  devig calculator
                </a>{" "}
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
              offered price against the no-vig line from a sharp, high-limit
              book like Pinnacle. If your sportsbook's price implies a lower
              probability than the sharp no-vig fair number, the market thinks
              that outcome is more likely than your price suggests — that gap is
              your expected value. ChalkPicks'{" "}
              <a href="/ev-finder" className="text-emerald-400 hover:underline">
                +EV Finder
              </a>{" "}
              scans this exact comparison across 10+ sportsbooks in real time.
            </p>
          ),
        },
      ]}
    />
  );
}
