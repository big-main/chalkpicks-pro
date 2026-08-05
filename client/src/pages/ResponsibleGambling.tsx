import { Link } from "wouter";
import Navbar from "@/components/Navbar";

export default function ResponsibleGambling() {
  const resources = [
    {
      name: "National Problem Gambling Helpline",
      contact: "1-800-522-4700",
      url: "https://www.ncpgambling.org",
      desc: "24/7 confidential helpline for problem gambling",
    },
    {
      name: "Gamblers Anonymous",
      contact: "gamblersanonymous.org",
      url: "https://www.gamblersanonymous.org",
      desc: "12-step fellowship for compulsive gamblers",
    },
    {
      name: "National Council on Problem Gambling",
      contact: "ncpgambling.org",
      url: "https://www.ncpgambling.org",
      desc: "Resources, treatment referrals, and support",
    },
    {
      name: "BeGambleAware",
      contact: "begambleaware.org",
      url: "https://www.begambleaware.org",
      desc: "Free support and advice for gambling problems",
    },
  ];

  const warningSigns = [
    "Spending more money or time on gambling than you can afford",
    "Finding it hard to manage or stop your gambling",
    "Having arguments with family or friends about money and gambling",
    "Losing interest in usual activities or hobbies",
    "Borrowing money or selling possessions to fund gambling",
    "Feeling anxious, worried, or guilty about your gambling",
    "Chasing losses — betting more to try to win back what you've lost",
    "Gambling to escape problems or relieve feelings of helplessness",
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container max-w-3xl py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-lime-400 transition-colors mb-8"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-4 h-4"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to Home
        </Link>

        {/* Hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium mb-4">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-3.5 h-3.5"
            >
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            Important Information
          </div>
          <h1 className="text-4xl font-bold mb-4">Responsible Gambling</h1>
          <p className="text-white/60 text-lg leading-relaxed">
            ChalkPicks Pro provides sports analytics and insights for
            informational purposes. We are committed to promoting responsible
            gambling and helping our users maintain healthy habits.
          </p>
        </div>

        <div className="space-y-8 text-white/70 leading-relaxed">
          {/* Core message */}
          <div className="p-6 rounded-2xl bg-lime-400/5 border border-lime-400/15">
            <h2 className="text-xl font-semibold text-lime-400 mb-3">
              Our Commitment
            </h2>
            <p>
              Sports betting should be entertainment — not a financial strategy.
              ChalkPicks Pro's analytics are tools to help you make more
              informed decisions, not guarantees of profit. We encourage all
              users to set strict limits, bet only what they can afford to lose,
              and seek help immediately if gambling stops being fun.
            </p>
          </div>

          {/* Warning signs */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              Warning Signs of Problem Gambling
            </h2>
            <p className="mb-4">
              Seek help if you recognize any of these patterns in yourself or
              someone you know:
            </p>
            <ul className="space-y-2">
              {warningSigns.map((sign, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  <span>{sign}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Safe gambling tips */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              Safe Gambling Guidelines
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: "💰",
                  title: "Set a Budget",
                  desc: "Only bet money you can afford to lose. Treat it as entertainment spending, not investment.",
                },
                {
                  icon: "⏱️",
                  title: "Set Time Limits",
                  desc: "Decide in advance how long you'll spend reviewing picks and placing bets.",
                },
                {
                  icon: "🚫",
                  title: "Never Chase Losses",
                  desc: "Accept losses as part of the game. Chasing losses leads to bigger losses.",
                },
                {
                  icon: "🧠",
                  title: "Stay Sober",
                  desc: "Never gamble under the influence of alcohol or substances.",
                },
                {
                  icon: "📊",
                  title: "Track Everything",
                  desc: "Keep records of wins and losses to maintain perspective on your actual results.",
                },
                {
                  icon: "🛑",
                  title: "Take Breaks",
                  desc: "Regular breaks help you maintain perspective and avoid impulsive decisions.",
                },
              ].map(({ icon, title, desc }) => (
                <div
                  key={title}
                  className="p-4 rounded-xl bg-white/3 border border-white/8"
                >
                  <div className="text-2xl mb-2">{icon}</div>
                  <h3 className="font-semibold text-white mb-1">{title}</h3>
                  <p className="text-sm text-white/50">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Resources */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              Help &amp; Resources
            </h2>
            <p className="mb-5">
              If you or someone you know needs help with problem gambling, these
              organizations provide free, confidential support:
            </p>
            <div className="space-y-3">
              {resources.map(({ name, contact, url, desc }) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/3 border border-white/8 hover:border-lime-400/30 hover:bg-lime-400/5 transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white group-hover:text-lime-400 transition-colors">
                      {name}
                    </p>
                    <p className="text-sm text-white/50 mt-0.5">{desc}</p>
                    <p className="text-sm text-lime-400/70 mt-1">{contact}</p>
                  </div>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-4 h-4 text-white/30 group-hover:text-lime-400 flex-shrink-0 mt-1 transition-colors"
                  >
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                  </svg>
                </a>
              ))}
            </div>
          </section>

          {/* Self-exclusion */}
          <section className="p-6 rounded-2xl bg-red-500/5 border border-red-500/15">
            <h2 className="text-xl font-semibold text-red-400 mb-3">
              Self-Exclusion
            </h2>
            <p className="mb-3">
              If you feel you need to take a break from sports betting, most
              sportsbooks offer self-exclusion programs. You can also contact us
              to have your ChalkPicks Pro account temporarily suspended or
              permanently deleted.
            </p>
            <a
              href="mailto:support@chalkpicks.pro"
              className="inline-flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
            >
              Request account suspension →
            </a>
          </section>

          <p className="text-sm text-white/30 text-center pt-4">
            ChalkPicks Pro does not accept bets and does not operate as a
            sportsbook. We are a sports analytics platform. If you are
            struggling with problem gambling, please reach out to one of the
            resources above.
          </p>
        </div>
      </div>
    </div>
  );
}
