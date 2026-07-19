import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { ArrowLeft, ExternalLink, Twitter, Share2, Bell, Star, Users, Zap, Trophy } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

// Product Hunt launch date — update this to your actual launch date
const LAUNCH_DATE = new Date("2026-08-05T12:00:01-07:00"); // Tuesday Aug 5, 12:00 AM PT

function useCountdown(target: Date) {
  const [diff, setDiff] = useState(() => Math.max(0, target.getTime() - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setDiff(Math.max(0, target.getTime() - Date.now())), 1000);
    return () => clearInterval(t);
  }, [target]);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs, launched: diff === 0 };
}

const SHARE_MESSAGES = {
  twitter: `🏆 ChalkPicks just launched on @ProductHunt — AI-powered sports betting analytics with +EV finder, arbitrage scanner, and expert picks. Check it out and upvote! 🚀`,
  discord: `🚀 ChalkPicks is live on Product Hunt! We need your upvotes to hit #1 today. Takes 10 seconds — click here: https://www.producthunt.com/products/chalkpicks`,
};

export default function Launch() {
  const countdown = useCountdown(LAUNCH_DATE);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notified, setNotified] = useState(false);

  function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    if (!notifyEmail) return;
    // In production, wire this to your newsletter_subscribers table
    setNotified(true);
    toast.success("You're on the list! We'll notify you when we launch.");
  }

  function copyShareText(platform: keyof typeof SHARE_MESSAGES) {
    navigator.clipboard.writeText(SHARE_MESSAGES[platform]);
    toast.success(`${platform === "twitter" ? "Tweet" : "Discord message"} copied to clipboard!`);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Background */}
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
      {/* Glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: "#f0b800" }} />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full opacity-8 blur-3xl" style={{ background: "#39ff14" }} />
      </div>

      <div className="relative z-10 container pt-24 pb-20 max-w-3xl mx-auto">
        {/* Back */}
        <Link href="/">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        </Link>

        {/* Product Hunt badge */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full text-sm font-bold"
            style={{ background: "rgba(240,88,56,0.12)", border: "1px solid rgba(240,88,56,0.3)", color: "#f05838" }}
          >
            <span className="text-lg">🐱</span> PRODUCT HUNT LAUNCH
          </div>

          <h1
            style={{
              fontWeight: 700,
              fontSize: "clamp(2rem, 6vw, 3.5rem)",
              textTransform: "uppercase",
              color: "white",
              lineHeight: 1.1,
            }}
          >
            WE'RE LAUNCHING ON{" "}
            <span style={{ color: "#f05838", textShadow: "0 0 30px rgba(240,88,56,0.4)" }}>PRODUCT HUNT</span>
          </h1>
          <p className="mt-3 text-base max-w-xl mx-auto" style={{ color: "rgba(180,180,210,0.65)" }}>
            Help ChalkPicks hit #1 Product of the Day. Your upvote takes 10 seconds and means everything to an indie team.
          </p>
        </div>

        {/* Countdown */}
        <div
          className="p-6 rounded-2xl mb-8 text-center"
          style={{ background: "rgba(12,12,28,0.9)", border: "1px solid rgba(57,255,20,0.15)" }}
        >
          {countdown.launched ? (
            <div>
              <div className="text-2xl font-bold text-white mb-2">🚀 We're LIVE on Product Hunt!</div>
              <a
                href="https://www.producthunt.com/products/chalkpicks"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-base font-bold transition-all hover:opacity-90 mt-2"
                style={{ background: "#f05838", color: "white" }}
              >
                Upvote ChalkPicks Now <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <>
              <div className="text-xs font-bold tracking-widest mb-4" style={{ color: "rgba(180,180,210,0.5)" }}>
                LAUNCH COUNTDOWN
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "DAYS", value: countdown.days },
                  { label: "HOURS", value: countdown.hours },
                  { label: "MINS", value: countdown.mins },
                  { label: "SECS", value: countdown.secs },
                ].map((unit) => (
                  <div key={unit.label} className="flex flex-col items-center">
                    <div
                      className="w-full py-3 rounded-xl text-center mb-1"
                      style={{ background: "rgba(57,255,20,0.06)", border: "1px solid rgba(57,255,20,0.15)" }}
                    >
                      <span style={{ fontWeight: 700, fontSize: "clamp(1.5rem, 5vw, 2.5rem)", color: "#39ff14", fontVariantNumeric: "tabular-nums" }}>
                        {String(unit.value).padStart(2, "0")}
                      </span>
                    </div>
                    <span className="text-xs font-bold tracking-widest" style={{ color: "rgba(140,140,170,0.5)" }}>
                      {unit.label}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-4" style={{ color: "rgba(140,140,170,0.4)" }}>
                Launching Tuesday, August 5 at 12:00 AM PT — the highest-traffic launch window
              </p>
            </>
          )}
        </div>

        {/* Notify me form */}
        {!countdown.launched && (
          <div
            className="p-6 rounded-2xl mb-8"
            style={{ background: "rgba(12,12,28,0.9)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4" style={{ color: "#f0b800" }} />
              <h3 className="font-bold text-white">Get Notified on Launch Day</h3>
            </div>
            <p className="text-sm mb-4" style={{ color: "rgba(180,180,210,0.55)" }}>
              We'll send you a reminder email when we go live so you can be among the first to upvote.
            </p>
            {notified ? (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold"
                style={{ background: "rgba(57,255,20,0.1)", border: "1px solid rgba(57,255,20,0.25)", color: "#39ff14" }}
              >
                ✓ You're on the list! We'll email you on launch day.
              </div>
            ) : (
              <form onSubmit={handleNotify} className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  required
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm bg-transparent text-white placeholder:text-white/30 outline-none focus:ring-1"
                  style={{ border: "1px solid rgba(255,255,255,0.12)" }}
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:opacity-90"
                  style={{ background: "#f0b800", color: "#080814" }}
                >
                  Notify Me
                </button>
              </form>
            )}
          </div>
        )}

        {/* Share section */}
        <div
          className="p-6 rounded-2xl mb-8"
          style={{ background: "rgba(12,12,28,0.9)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="w-4 h-4" style={{ color: "#39ff14" }} />
            <h3 className="font-bold text-white">Help Us Win — Share the Launch</h3>
          </div>
          <p className="text-sm mb-5" style={{ color: "rgba(180,180,210,0.55)" }}>
            Product Hunt rankings are driven by upvotes in the first 24 hours. Sharing with your network is the single biggest thing you can do to help.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Twitter/X */}
            <div
              className="p-4 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Twitter className="w-4 h-4 text-sky-400" />
                <span className="text-sm font-semibold text-white">Twitter / X</span>
              </div>
              <p className="text-xs mb-3 leading-relaxed" style={{ color: "rgba(180,180,210,0.55)" }}>
                {SHARE_MESSAGES.twitter.slice(0, 100)}...
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => copyShareText("twitter")}
                  className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                  style={{ background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.25)", color: "#38bdf8" }}
                >
                  Copy Tweet
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_MESSAGES.twitter)}&url=https://www.producthunt.com/products/chalkpicks`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                  style={{ background: "rgba(14,165,233,0.2)", border: "1px solid rgba(14,165,233,0.35)", color: "#38bdf8" }}
                >
                  Post <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Discord */}
            <div
              className="p-4 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4" style={{ color: "#5865f2" }} />
                <span className="text-sm font-semibold text-white">Discord Community</span>
              </div>
              <p className="text-xs mb-3 leading-relaxed" style={{ color: "rgba(180,180,210,0.55)" }}>
                {SHARE_MESSAGES.discord.slice(0, 100)}...
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => copyShareText("discord")}
                  className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                  style={{ background: "rgba(88,101,242,0.12)", border: "1px solid rgba(88,101,242,0.25)", color: "#818cf8" }}
                >
                  Copy Message
                </button>
                <a
                  href="https://discord.gg/chalkpicks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                  style={{ background: "rgba(88,101,242,0.2)", border: "1px solid rgba(88,101,242,0.35)", color: "#818cf8" }}
                >
                  Join <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Why upvote / what we built */}
        <div
          className="p-6 rounded-2xl mb-8"
          style={{ background: "rgba(12,12,28,0.9)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h3 className="font-bold text-white mb-4">What We Built</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Zap, label: "+EV Finder", desc: "Identifies positive expected value bets across all major books in real time", color: "#39ff14" },
              { icon: Trophy, label: "Arbitrage Scanner", desc: "Finds risk-free arbitrage opportunities across 11+ sportsbooks automatically", color: "#f0b800" },
              { icon: Star, label: "AI Expert Picks", desc: "Daily AI-generated picks with confidence scores, analysis, and historical ROI", color: "#d4a017" },
              { icon: Users, label: "Community Leaderboard", desc: "Track your record against other bettors and compete for top capper status", color: "#3b82f6" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div
                  className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg"
                  style={{ background: `${item.color}15`, border: `1px solid ${item.color}25` }}
                >
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white mb-0.5">{item.label}</div>
                  <div className="text-xs leading-relaxed" style={{ color: "rgba(140,140,170,0.6)" }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Direct PH link */}
        <div className="text-center">
          <a
            href="https://www.producthunt.com/products/chalkpicks"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold transition-all hover:opacity-90"
            style={{ background: "#f05838", color: "white", boxShadow: "0 0 30px rgba(240,88,56,0.3)" }}
          >
            <span className="text-xl">🐱</span>
            View ChalkPicks on Product Hunt
            <ExternalLink className="w-4 h-4" />
          </a>
          <p className="text-xs mt-3" style={{ color: "rgba(140,140,170,0.4)" }}>
            You'll need a free Product Hunt account to upvote. Takes 30 seconds to create.
          </p>
        </div>
      </div>
    </div>
  );
}
