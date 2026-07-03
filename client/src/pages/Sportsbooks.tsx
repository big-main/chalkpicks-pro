import Navbar from "@/components/Navbar";
import { ExternalLink, Star, Shield, Zap, Gift, TrendingUp, DollarSign } from "lucide-react";

const SPORTSBOOKS = [
  {
    name: "DraftKings",
    logo: "DK",
    color: "#f0b800",
    bonus: "Bet $5, Get $200 in Bonus Bets",
    rating: 4.9,
    features: ["Best mobile app", "Same-game parlays", "Live betting", "Fast payouts"],
    url: "https://www.draftkings.com/r/sb/ChalkPicks",
    badge: "EDITOR'S PICK",
    badgeColor: "#39ff14",
    description: "The #1 rated sportsbook in the US. Exceptional app, deep markets, and the best same-game parlay builder.",
    states: "Available in 20+ states",
  },
  {
    name: "FanDuel",
    logo: "FD",
    color: "#39ff14",
    bonus: "Bet $5, Get $200 in Bonus Bets",
    rating: 4.8,
    features: ["Fastest withdrawals", "No-sweat first bet", "Live streaming", "Great promos"],
    url: "https://www.fanduel.com/join/sportsbook?referral=ChalkPicks",
    badge: "TOP RATED",
    badgeColor: "#f0b800",
    description: "Lightning-fast withdrawals and the most generous welcome bonus. Perfect for new bettors.",
    states: "Available in 18+ states",
  },
  {
    name: "BetMGM",
    logo: "MGM",
    color: "#d4a017",
    bonus: "First Bet Offer Up to $1,500",
    rating: 4.7,
    features: ["Huge welcome offer", "One Game Parlay", "Early cash out", "Loyalty rewards"],
    url: "https://sports.betmgm.com/en/sports?referral=chalkpicks",
    badge: "BEST BONUS",
    badgeColor: "#d4a017",
    description: "The King of Sportsbooks. Largest first-bet insurance offer and a robust loyalty program.",
    states: "Available in 22+ states",
  },
  {
    name: "Caesars Sportsbook",
    logo: "CZR",
    color: "#fbbf24",
    bonus: "First Bet on Caesars Up to $1,000",
    rating: 4.6,
    features: ["Caesars Rewards", "Odds boosts daily", "Live betting", "VIP perks"],
    url: "https://www.caesars.com/sportsbook-and-casino?referral=chalkpicks",
    badge: "VIP PERKS",
    badgeColor: "#fbbf24",
    description: "Earn Caesars Rewards points on every bet. The best loyalty program in sports betting.",
    states: "Available in 20+ states",
  },
  {
    name: "BetRivers",
    logo: "BR",
    color: "#f97316",
    bonus: "2nd Chance Bet Up to $500",
    rating: 4.4,
    features: ["iRush Rewards", "Live in-play", "Competitive odds", "Fast signup"],
    url: "https://www.betrivers.com/?page=sportsbook&referral=chalkpicks",
    badge: "GREAT VALUE",
    badgeColor: "#f97316",
    description: "Excellent odds and a top-tier loyalty program. Ideal for value bettors.",
    states: "Available in 15+ states",
  },
  {
    name: "PointsBet",
    logo: "PB",
    color: "#ef4444",
    bonus: "Up to $500 in Second Chance Bets",
    rating: 4.3,
    features: ["PointsBetting", "Unique bet types", "Daily promos", "Great NFL odds"],
    url: "https://pointsbet.com/sports/?referral=chalkpicks",
    badge: "UNIQUE BETS",
    badgeColor: "#ef4444",
    description: "Home of PointsBetting — a unique format where your winnings scale with how right you are.",
    states: "Available in 12+ states",
  },
  {
    name: "ESPN BET",
    logo: "ESPN",
    color: "#ff6b35",
    bonus: "First Bet Reset Up to $1,000",
    rating: 4.5,
    features: ["ESPN integration", "Sports news", "Live scores", "Parlay builder"],
    url: "https://espnbet.com/?referral=chalkpicks",
    badge: "NEW",
    badgeColor: "#ff6b35",
    description: "Powered by ESPN — seamlessly integrated with scores, news, and analytics you already use.",
    states: "Available in 17+ states",
  },
  {
    name: "Bet365",
    logo: "B365",
    color: "#00b04f",
    bonus: "Bet $1, Get $365 in Bonus Bets",
    rating: 4.7,
    features: ["Best live betting", "Huge market depth", "Cash out", "Streaming"],
    url: "https://www.bet365.com/?referral=chalkpicks",
    badge: "GLOBAL #1",
    badgeColor: "#00b04f",
    description: "The world's largest sportsbook. Unmatched live betting markets and real-time streaming.",
    states: "Available in select states",
  },
];

const DISCLAIMER = "ChalkPicks may earn a commission when you sign up through our links. This helps support the platform at no extra cost to you. Always gamble responsibly. Must be 21+ and in an eligible state. Terms and conditions apply.";

export default function Sportsbooks() {
  return (
    <div className="min-h-screen" style={{ background: "#080814", color: "#e8e8f0" }}>
      <Navbar />

      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(57,255,20,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(57,255,20,0.02) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          zIndex: 0,
        }}
      />

      <div className="relative z-10 container pt-24 pb-20">
        {/* Header */}
        <div className="text-center mb-14">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-bold tracking-widest"
            style={{ background: "rgba(57,255,20,0.08)", border: "1px solid rgba(57,255,20,0.25)", borderRadius: "4px", color: "#39ff14" }}
          >
            <Shield className="w-3 h-3" /> TRUSTED SPORTSBOOK PARTNERS
          </div>
          <h1
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              textTransform: "uppercase",
              color: "white",
              lineHeight: 1.1,
            }}
          >
            BEST{" "}
            <span style={{ color: "#39ff14", textShadow: "0 0 20px rgba(57,255,20,0.5)" }}>SPORTSBOOKS</span>
            {" "}2024
          </h1>
          <p className="mt-3 text-base max-w-2xl mx-auto" style={{ color: "rgba(180,180,210,0.65)" }}>
            Our team has vetted every major sportsbook so you don't have to. Sign up through our links to claim exclusive welcome bonuses and support ChalkPicks.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
          {[
            { icon: DollarSign, label: "Total Bonuses", value: "$5,000+" },
            { icon: Star, label: "Books Reviewed", value: "25+" },
            { icon: Shield, label: "Licensed & Safe", value: "100%" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-4 rounded"
              style={{ background: "rgba(57,255,20,0.04)", border: "1px solid rgba(57,255,20,0.1)" }}
            >
              <stat.icon className="w-5 h-5 mx-auto mb-1" style={{ color: "#39ff14" }} />
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.3rem", color: "#39ff14" }}>{stat.value}</div>
              <div className="text-xs" style={{ color: "rgba(140,140,170,0.6)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Sportsbook cards */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {SPORTSBOOKS.map((book, idx) => (
            <div
              key={book.name}
              className="relative rounded-lg overflow-hidden"
              style={{
                background: "rgba(12, 12, 28, 0.9)",
                border: `1px solid ${book.color}20`,
                backdropFilter: "blur(12px)",
                transition: "all 0.25s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = `${book.color}50`;
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px ${book.color}15`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = `${book.color}20`;
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
              }}
            >
              {/* Rank badge */}
              <div
                className="absolute top-4 left-4 w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold"
                style={{ background: `${book.color}20`, border: `1px solid ${book.color}40`, color: book.color }}
              >
                {idx + 1}
              </div>

              <div className="p-6 pl-14">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Logo + name */}
                  <div className="flex items-center gap-4 md:w-48 flex-shrink-0">
                    <div
                      className="w-14 h-14 flex items-center justify-center rounded-lg text-sm font-black"
                      style={{ background: `${book.color}15`, border: `2px solid ${book.color}40`, color: book.color, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.05em" }}
                    >
                      {book.logo}
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "white" }}>
                        {book.name}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3" style={{ color: i < Math.floor(book.rating) ? "#fbbf24" : "rgba(100,100,130,0.3)", fill: i < Math.floor(book.rating) ? "#fbbf24" : "none" }} />
                        ))}
                        <span className="text-xs ml-1" style={{ color: "rgba(140,140,170,0.7)" }}>{book.rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bonus */}
                  <div className="flex-1">
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-2 text-xs font-bold tracking-wider rounded"
                      style={{ background: `${book.badgeColor}15`, border: `1px solid ${book.badgeColor}30`, color: book.badgeColor }}
                    >
                      <Gift className="w-3 h-3" />
                      {book.badge}
                    </div>
                    <div style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#39ff14" }}>
                      {book.bonus}
                    </div>
                    <p className="text-xs mt-1" style={{ color: "rgba(140,140,170,0.65)" }}>
                      {book.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {book.features.map((f) => (
                        <span
                          key={f}
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(180,180,210,0.7)" }}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex flex-col items-center gap-2 md:w-44 flex-shrink-0">
                    <a
                      href={book.url}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="w-full py-3 text-sm font-bold tracking-wider flex items-center justify-center gap-2 rounded transition-all"
                      style={{
                        background: book.color,
                        color: "#080814",
                        fontFamily: "'Exo 2', sans-serif",
                        boxShadow: `0 0 15px ${book.color}40`,
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    >
                      CLAIM BONUS <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <div className="text-xs text-center" style={{ color: "rgba(100,100,130,0.6)" }}>
                      {book.states}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Responsible gambling */}
        <div
          className="max-w-4xl mx-auto mt-10 p-5 rounded-lg"
          style={{ background: "rgba(255,100,50,0.05)", border: "1px solid rgba(255,100,50,0.15)" }}
        >
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold mb-1" style={{ color: "#f97316" }}>Responsible Gambling & Affiliate Disclosure</div>
              <p className="text-xs" style={{ color: "rgba(180,180,210,0.55)" }}>{DISCLAIMER}</p>
              <div className="flex flex-wrap gap-3 mt-3">
                <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: "rgba(140,140,170,0.6)" }}>
                  National Problem Gambling Helpline: 1-800-522-4700
                </a>
                <a href="https://www.gamblersanonymous.org" target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: "rgba(140,140,170,0.6)" }}>
                  Gamblers Anonymous
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
