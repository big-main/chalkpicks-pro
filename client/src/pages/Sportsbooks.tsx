import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { ExternalLink, Star, Shield, Zap, Gift, TrendingUp, DollarSign, ArrowLeft, ChevronDown } from "lucide-react";
import { SPORTSBOOKS, type Sportsbook } from "../../../shared/sportsbooks";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

const DISCLAIMER = "ChalkPicks may earn a commission when you sign up through our links. This helps support the platform at no extra cost to you. Always gamble responsibly. Must be 21+ and in an eligible state. Terms and conditions apply.";

// Feature highlights per book
const BOOK_FEATURES: Record<string, string[]> = {
  draftkings: ["Best mobile app", "Same-game parlays", "Live betting", "Fast payouts"],
  fanduel: ["Fastest withdrawals", "No-sweat first bet", "Live streaming", "Great promos"],
  betmgm: ["Huge welcome offer", "One Game Parlay", "Early cash out", "Loyalty rewards"],
  caesars: ["Caesars Rewards", "Odds boosts daily", "Live betting", "VIP perks"],
  espnbet: ["ESPN integration", "Quick bet", "Odds boosts", "Parlay insurance"],
  bet365: ["Best live betting", "Huge market depth", "Cash out", "Streaming"],
  pointsbet: ["Daily match bonuses", "Fanatics rewards", "Fast payouts", "Great odds"],
  betrivers: ["2nd chance bets", "iRush Rewards", "Live betting", "Quick deposits"],
  bovada: ["Crypto deposits", "No geo-restrictions", "Fast crypto payouts", "Anonymous betting"],
  mybookie: ["Huge deposit match", "Crypto bonuses", "Props builder", "Live betting"],
  betonline: ["Lifetime reload bonuses", "Crypto friendly", "Fast payouts", "Deep markets"],
};

const BOOK_BADGES: Record<string, { label: string; color: string }> = {
  draftkings: { label: "EDITOR'S PICK", color: "#39ff14" },
  fanduel: { label: "TOP RATED", color: "#f0b800" },
  betmgm: { label: "BEST BONUS", color: "#d4a017" },
  caesars: { label: "VIP PERKS", color: "#fbbf24" },
  espnbet: { label: "NEW", color: "#ff4444" },
  bet365: { label: "GLOBAL #1", color: "#00b04f" },
  pointsbet: { label: "RISING STAR", color: "#9333ea" },
  betrivers: { label: "TRUSTED", color: "#3b82f6" },
  bovada: { label: "CRYPTO FRIENDLY", color: "#f97316" },
  mybookie: { label: "BEST MATCH", color: "#e91e63" },
  betonline: { label: "VETERAN", color: "#8b0000" },
};

export default function Sportsbooks() {
  const trackClick = trpc.affiliateClicks.track.useMutation();
  const [showAll, setShowAll] = useState(false);

  // Rotating bonus banner
  const featuredBooks = SPORTSBOOKS.filter((b) => b.featured);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [bannerPaused, setBannerPaused] = useState(false);

  useEffect(() => {
    if (bannerPaused) return;
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % featuredBooks.length), 5000);
    return () => clearInterval(t);
  }, [bannerPaused, featuredBooks.length]);

  const bannerBook = featuredBooks[bannerIdx];

  const visibleBooks = showAll ? SPORTSBOOKS : SPORTSBOOKS.slice(0, 6);

  function handleBookClick(book: Sportsbook) {
    trackClick.mutate({
      sportsbookId: book.id,
      sportKey: "sportsbooks_page",
      source: "sportsbooks_page",
    });
    window.open(book.affiliateUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
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
        {/* Back button */}
        <Link href="/">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        </Link>

        {/* Rotating Bonus Banner */}
        {bannerBook && (
          <div
            className="relative mb-8 rounded-xl overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${bannerBook.color}18, rgba(8,8,20,0.95))`, border: `1px solid ${bannerBook.color}40` }}
            onMouseEnter={() => setBannerPaused(true)}
            onMouseLeave={() => setBannerPaused(false)}
          >
            {/* Glow */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 20% 50%, ${bannerBook.color}10, transparent 60%)` }} />

            <div className="relative flex flex-col sm:flex-row items-center gap-4 px-6 py-4">
              {/* Left: badge + offer */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black"
                  style={{ background: `${bannerBook.color}20`, border: `1px solid ${bannerBook.color}40`, color: bannerBook.color }}
                >
                  🎁
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold tracking-widest" style={{ color: bannerBook.color }}>EXCLUSIVE OFFER</span>
                    <span className="text-xs font-semibold text-white">{bannerBook.shortName}</span>
                  </div>
                  <p className="text-sm font-bold text-white truncate">{bannerBook.signupBonus}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(180,180,210,0.55)" }}>{bannerBook.bonusDetails}</p>
                </div>
              </div>

              {/* Right: CTA + dots */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Dot indicators */}
                <div className="hidden sm:flex items-center gap-1">
                  {featuredBooks.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setBannerIdx(i)}
                      className="w-1.5 h-1.5 rounded-full transition-all"
                      style={{ background: i === bannerIdx ? bannerBook.color : "rgba(255,255,255,0.2)", transform: i === bannerIdx ? "scale(1.3)" : "scale(1)" }}
                    />
                  ))}
                </div>
                {/* Prev/Next */}
                <button
                  onClick={() => setBannerIdx((i) => (i - 1 + featuredBooks.length) % featuredBooks.length)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  ‹
                </button>
                <button
                  onClick={() => setBannerIdx((i) => (i + 1) % featuredBooks.length)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  ›
                </button>
                <button
                  onClick={() => handleBookClick(bannerBook)}
                  className="px-5 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-90"
                  style={{ background: bannerBook.color, color: "#080814" }}
                >
                  Claim Bonus →
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-0.5 w-full" style={{ background: "rgba(255,255,255,0.05)" }}>
              {!bannerPaused && (
                <div
                  key={bannerIdx}
                  className="h-full"
                  style={{
                    background: bannerBook.color,
                    animation: "progress-bar 5s linear forwards",
                  }}
                />
              )}
            </div>
          </div>
        )}

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
              fontWeight: 700,
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              textTransform: "uppercase",
              color: "white",
              lineHeight: 1.1,
            }}
          >
            BEST{" "}
            <span style={{ color: "#39ff14", textShadow: "0 0 20px rgba(57,255,20,0.5)" }}>SPORTSBOOKS</span>
            {" "}2026
          </h1>
          <p className="mt-3 text-base max-w-2xl mx-auto" style={{ color: "rgba(180,180,210,0.65)" }}>
            Our team has vetted every major sportsbook so you don't have to. Sign up through our links to claim exclusive welcome bonuses and support ChalkPicks.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
          {[
            { icon: DollarSign, label: "Total Bonuses", value: "$8,000+" },
            { icon: Star, label: "Books Reviewed", value: `${SPORTSBOOKS.length}` },
            { icon: Shield, label: "Licensed & Safe", value: "100%" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-4 rounded"
              style={{ background: "rgba(57,255,20,0.04)", border: "1px solid rgba(57,255,20,0.1)" }}
            >
              <stat.icon className="w-5 h-5 mx-auto mb-1" style={{ color: "#39ff14" }} />
              <div style={{ fontWeight: 700, fontSize: "1.3rem", color: "#39ff14" }}>{stat.value}</div>
              <div className="text-xs" style={{ color: "rgba(140,140,170,0.6)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Sportsbook cards */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {visibleBooks.map((book, idx) => {
            const badge = BOOK_BADGES[book.id] || { label: "VERIFIED", color: book.color };
            const features = BOOK_FEATURES[book.id] || ["Live betting", "Fast payouts", "Mobile app", "Bonuses"];

            return (
              <div
                key={book.id}
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
                        style={{ background: `${book.color}15`, border: `2px solid ${book.color}40`, color: book.color, letterSpacing: "0.05em" }}
                      >
                        {book.shortName.slice(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "white" }}>
                          {book.shortName}
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
                        style={{ background: `${badge.color}15`, border: `1px solid ${badge.color}30`, color: badge.color }}
                      >
                        <Gift className="w-3 h-3" />
                        {badge.label}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: "1rem", color: "#39ff14" }}>
                        {book.signupBonus}
                      </div>
                      <p className="text-xs mt-1" style={{ color: "rgba(140,140,170,0.65)" }}>
                        {book.bonusDetails}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {features.map((f) => (
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
                      <button
                        onClick={() => handleBookClick(book)}
                        className="w-full py-3 text-sm font-bold tracking-wider flex items-center justify-center gap-2 rounded transition-all cursor-pointer"
                        style={{
                          background: book.color,
                          color: "#080814",
                          boxShadow: `0 0 15px ${book.color}40`,
                        }}
                      >
                        CLAIM BONUS <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <div className="text-xs text-center" style={{ color: "rgba(100,100,130,0.6)" }}>
                        {book.availableStates.includes("ALL") ? "Available everywhere" : `Available in ${book.availableStates.length}+ states`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Show more button */}
        {!showAll && SPORTSBOOKS.length > 6 && (
          <div className="text-center mt-8">
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all"
              style={{ background: "rgba(57,255,20,0.08)", border: "1px solid rgba(57,255,20,0.25)", color: "#39ff14" }}
            >
              Show All {SPORTSBOOKS.length} Sportsbooks <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* How it works */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-center text-2xl font-bold text-white mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "1", title: "Choose a Sportsbook", desc: "Pick from our vetted list of trusted, licensed sportsbooks above." },
              { icon: "2", title: "Claim Your Bonus", desc: "Sign up through our link to get the best available welcome offer." },
              { icon: "3", title: "Place Your Bets", desc: "Use ChalkPicks AI picks and analysis to make informed bets." },
            ].map((step) => (
              <div
                key={step.icon}
                className="text-center p-6 rounded-lg"
                style={{ background: "rgba(12,12,28,0.8)", border: "1px solid rgba(57,255,20,0.1)" }}
              >
                <div
                  className="w-10 h-10 mx-auto mb-3 flex items-center justify-center rounded-full text-sm font-bold"
                  style={{ background: "rgba(57,255,20,0.15)", color: "#39ff14", border: "1px solid rgba(57,255,20,0.3)" }}
                >
                  {step.icon}
                </div>
                <h3 className="font-bold text-white mb-2">{step.title}</h3>
                <p className="text-xs" style={{ color: "rgba(140,140,170,0.65)" }}>{step.desc}</p>
              </div>
            ))}
          </div>
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
