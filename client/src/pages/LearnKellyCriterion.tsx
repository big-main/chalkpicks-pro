import { LearnPageLayout } from "@/components/learn/LearnPageLayout";

const FAQS = [
  {
    question: "What is the Kelly Criterion in sports betting?",
    answer:
      "The Kelly Criterion is a formula for sizing bets that maximizes a bankroll's long-run growth rate given your edge and the odds offered. It tells you what fraction of your bankroll to stake — bet too little and you leave growth on the table; bet too much and variance can wipe you out.",
  },
  {
    question: "What is the Kelly Criterion formula?",
    answer:
      "Kelly fraction f = (bp − q) / b, where b is the decimal payout odds minus 1, p is your true win probability, and q is 1 − p. The result is the percentage of your bankroll to wager on that specific bet.",
  },
  {
    question: "Why do bettors use fractional Kelly instead of full Kelly?",
    answer:
      "Full Kelly assumes your probability estimate is exactly correct, which it never is in practice. Betting a fraction of full Kelly — commonly 25% (quarter-Kelly) or 50% (half-Kelly) — trades some theoretical growth rate for much lower variance, protecting the bankroll against estimation error.",
  },
  {
    question: "What happens if you bet more than your Kelly fraction?",
    answer:
      "Overbetting past full Kelly increases variance faster than it increases expected growth, and betting roughly double the Kelly fraction or more actually reduces long-run bankroll growth toward zero — it's mathematically the same as gambling with no edge at all, despite still having a real edge on the bet.",
  },
];

export default function LearnKellyCriterion() {
  return (
    <LearnPageLayout
      path="/learn/kelly-criterion"
      badge="Betting Fundamentals"
      title="The Kelly Criterion: Sizing Bets for Long-Term Growth"
      intro="The formula professional bettors use to turn a real edge into bankroll growth — without betting so big that variance takes you out."
      faqs={FAQS}
      sections={[
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
                estimate carries error. Because Kelly's growth curve is steep
                and asymmetric, small overestimates of your edge lead to
                outsized bet sizes and painful variance.
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
              Kelly sizing only helps if your win probability estimate is
              actually accurate — it says nothing about whether you have an edge
              in the first place. Start with{" "}
              <a
                href="/learn/no-vig-odds"
                className="text-emerald-400 hover:underline"
              >
                no-vig fair odds
              </a>{" "}
              to estimate true probability, confirm the bet is +EV, and only
              then use Kelly to size it. ChalkPicks'{" "}
              <a
                href="/bet-calculator"
                className="text-emerald-400 hover:underline"
              >
                bet calculator
              </a>{" "}
              computes quarter-Kelly stake sizing directly from your probability
              and odds inputs.
            </p>
          ),
        },
      ]}
    />
  );
}
