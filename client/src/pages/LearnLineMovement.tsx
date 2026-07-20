import { LearnPageLayout } from "@/components/learn/LearnPageLayout";

const FAQS = [
  {
    question: "What is a steam move in sports betting?",
    answer:
      'A steam move is a sudden, sharp shift in the betting line — often several points or a large odds jump — that happens nearly simultaneously across multiple sportsbooks. It typically signals that professional ("sharp") money has hit the market hard enough that books are racing to adjust before taking on more of that side.',
  },
  {
    question:
      "What's the difference between a steam move and reverse line movement?",
    answer:
      "A steam move is defined by speed and size — a fast, large shift across books. Reverse line movement (RLM) is defined by direction relative to public betting: the line moves toward a team even though the majority of public bets are on the other side, which suggests sharp money is outweighing public volume.",
  },
  {
    question: "How can bettors track line movement in real time?",
    answer:
      "Track the opening line at multiple sportsbooks and monitor it through game time, watching for sudden multi-point or odds jumps that hit several books close together. ChalkPicks' Line Movement Tracker automates this, flagging steam moves and reverse line movement the moment they happen.",
  },
  {
    question: "Should bettors always follow steam moves?",
    answer:
      "Not blindly — by the time a steam move is visible, some of its value is often already priced in, and not every steam move is driven by informed money (some reflect large recreational bets or trap lines set by books). Steam is a strong signal worth weighing alongside your own analysis, not a standalone betting system.",
  },
];

export default function LearnLineMovement() {
  return (
    <LearnPageLayout
      path="/learn/line-movement"
      badge="Betting Fundamentals"
      title="Line Movement & Steam Moves Explained"
      intro="How to read a moving line, spot sharp money the moment it hits the market, and tell a real steam move from noise."
      faqs={FAQS}
      sections={[
        {
          title: "What Moves a Betting Line",
          body: (
            <>
              <p>
                Sportsbooks set an opening line based on their own models, then
                adjust it as bets come in — mostly to balance their liability,
                sometimes in response to injury news or weather. Two forces move
                a line the most: recreational ("public") money, which tends to
                be slow and predictable, and professional ("sharp") money, which
                is fast, large, and well-informed.
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
                sharply — a full point or more on a spread, or a big odds swing
                on a moneyline — across several sportsbooks within minutes of
                each other. It usually means one or more sharp bettors (or a
                syndicate) just placed a large, informed bet.
              </p>
              <p>
                <strong>Reverse line movement (RLM)</strong> is
                direction-vs-volume: the line moves toward a team even though
                most public bets are on the opposing side. Since books normally
                shade a line away from the side getting more bets to balance
                their liability, a line moving the "wrong" way relative to
                public tickets is a classic tell that sharp money outweighs
                public volume on the other side.
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
              <a
                href="/line-movement"
                className="text-emerald-400 hover:underline"
              >
                Line Movement Tracker
              </a>{" "}
              surfaces steam moves and RLM in real time across every book we
              cover, and pairs naturally with{" "}
              <a
                href="/learn/closing-line-value"
                className="text-emerald-400 hover:underline"
              >
                closing line value
              </a>{" "}
              tracking — betting ahead of a steam move, before the number
              adjusts, is one of the most reliable ways to generate positive
              CLV.
            </p>
          ),
        },
      ]}
    />
  );
}
