import { LearnPageLayout } from "@/components/learn/LearnPageLayout";

const FAQS = [
  {
    question: "What is closing line value (CLV)?",
    answer:
      "Closing line value (CLV) is the difference between the odds you bet at and the odds available right before the game starts (the closing line). Positive CLV means you got a better price than the market settled on — the strongest long-run predictor of a bettor's skill.",
  },
  {
    question: "How do you calculate CLV?",
    answer:
      "Convert both your bet price and the closing price to implied probability, then subtract: CLV = closing implied probability − your implied probability. A positive number means you beat the close. ChalkPicks' CLV Tracker does this automatically for every logged bet.",
  },
  {
    question: "Why does CLV matter more than win rate?",
    answer:
      "Win rate is noisy over any single season because of variance — even a +EV bettor can lose more than they win in the short run. CLV isolates whether you're consistently getting better prices than the closing market, which is the market's best available estimate of true probability, so it converges to true skill much faster than win/loss record.",
  },
  {
    question: "Can you have positive CLV and still lose a bet?",
    answer:
      "Yes, constantly. A single game's outcome is a coin flip relative to your edge; CLV measures whether the price you got was good, not whether that particular bet won. Professional bettors track CLV over hundreds of bets, not individual results.",
  },
];

export default function LearnClosingLineValue() {
  return (
    <LearnPageLayout
      path="/learn/closing-line-value"
      badge="Betting Fundamentals"
      title="What Is Closing Line Value (CLV)?"
      intro="The single strongest predictor of long-term betting profitability — and the metric every professional bettor tracks obsessively."
      faqs={FAQS}
      sections={[
        {
          title: "The Definition",
          body: (
            <>
              <p>
                Closing line value is the gap between the price you bet at and
                the price the market settled on right before kickoff — the
                "closing line." Sportsbook closing lines are the sharpest, most
                efficient number available for any game, because they've
                absorbed every bet, every piece of injury news, and every dollar
                of sharp money right up to the last minute.
              </p>
              <p>
                If you bet a team at +150 and the line closes at +120, you got a
                materially better number than the final market consensus. That
                gap — expressed as implied probability — is your CLV on that
                bet.
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
                guess can cash. Over a sample of 50-100 bets, win rate alone
                can't reliably separate a +3% edge from pure noise.
              </p>
              <p>
                CLV sidesteps that problem. Because the closing line is the
                market's best real-time estimate of true probability,
                consistently beating it means you were finding value the market
                hadn't priced in yet — regardless of how any individual game
                turned out. That's why sportsbooks themselves use CLV to
                identify (and sometimes limit) sharp bettors.
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
                <a
                  href="/clv-tracker"
                  className="text-emerald-400 hover:underline"
                >
                  CLV Tracker
                </a>{" "}
                automates this — log a bet and it pulls the closing number
                automatically, so you get a running CLV percentage across every
                sport and market you bet.
              </p>
              <p>
                Pairing CLV tracking with a{" "}
                <a
                  href="/line-movement"
                  className="text-emerald-400 hover:underline"
                >
                  line movement tracker
                </a>{" "}
                also tells you whether the market moved toward or away from your
                side after you bet — an early read on whether you're on the
                sharp side of the number.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
