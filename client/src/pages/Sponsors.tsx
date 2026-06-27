import Navbar from "@/components/Navbar";
import { Mail, TrendingUp, Users, Eye, DollarSign, Star, Zap, BarChart3, Shield, CheckCircle2, ExternalLink } from "lucide-react";

const SPONSOR_TIERS = [
  {
    name: "Bronze Partner",
    price: "$299/mo",
    color: "#cd7f32",
    glow: "rgba(205,127,50,0.25)",
    features: [
      "Logo in footer on all pages",
      "1 sponsored pick per week",
      "Social media mention (1x/month)",
      "Link in newsletter",
      "Basic analytics report",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Silver Partner",
    price: "$699/mo",
    color: "#00d4ff",
    glow: "rgba(0,212,255,0.25)",
    features: [
      "Logo in navbar + footer",
      "3 sponsored picks per week",
      "Banner ad on Picks page",
      "Social media mention (2x/month)",
      "Featured in email newsletter",
      "Monthly analytics dashboard",
      "Dedicated sponsor page section",
    ],
    cta: "Most Popular",
    popular: true,
  },
  {
    name: "Gold Partner",
    price: "$1,499/mo",
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.25)",
    features: [
      "Premium placement — homepage hero",
      "Daily sponsored picks",
      "Full-page banner ads",
      "Exclusive sportsbook listing spot",
      "Weekly social media posts",
      "Co-branded email campaigns",
      "Real-time analytics access",
      "Quarterly strategy call",
      "Custom integration options",
    ],
    cta: "Premium Sponsor",
    popular: false,
  },
];

const STATS = [
  { icon: Users, label: "Monthly Active Users", value: "10,000+", color: "#00ff88" },
  { icon: Eye, label: "Page Views / Month", value: "50,000+", color: "#00d4ff" },
  { icon: TrendingUp, label: "Avg Session Duration", value: "8+ min", color: "#a855f7" },
  { icon: BarChart3, label: "Picks Viewed / Day", value: "2,500+", color: "#fbbf24" },
];

const AD_PLACEMENTS = [
  {
    name: "Homepage Hero Banner",
    dimensions: "1200×250px",
    location: "Above the fold on homepage",
    impressions: "~15,000/mo",
    price: "$399/mo",
  },
  {
    name: "Picks Page Sidebar",
    dimensions: "300×600px",
    location: "Right sidebar on Picks page",
    impressions: "~12,000/mo",
    price: "$299/mo",
  },
  {
    name: "Sportsbooks Featured Slot",
    dimensions: "Full card listing",
    location: "Top position on Sportsbooks page",
    impressions: "~8,000/mo",
    price: "$499/mo",
  },
  {
    name: "Newsletter Sponsorship",
    dimensions: "600×200px",
    location: "Weekly email to subscribers",
    impressions: "~5,000/send",
    price: "$199/send",
  },
];

export default function Sponsors() {
  return (
    <div className="min-h-screen" style={{ background: "#080814", color: "#e8e8f0" }}>
      <Navbar />

      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,136,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,136,0.02) 1px, transparent 1px)
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
            style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.25)", borderRadius: "4px", color: "#00ff88" }}
          >
            <Star className="w-3 h-3" /> PARTNER WITH CHALKPICKS
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
            REACH{" "}
            <span style={{ color: "#00ff88", textShadow: "0 0 20px rgba(0,255,136,0.5)" }}>SHARP BETTORS</span>
          </h1>
          <p className="mt-3 text-base max-w-2xl mx-auto" style={{ color: "rgba(180,180,210,0.65)" }}>
            Advertise to a highly engaged audience of sports bettors, DFS players, and analytics enthusiasts. Our users are active, data-driven, and ready to act.
          </p>
          <a
            href="mailto:sponsors@chalkpicks.live"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 text-sm font-bold tracking-wider rounded transition-all"
            style={{
              background: "#00ff88",
              color: "#080814",
              fontFamily: "'Exo 2', sans-serif",
              boxShadow: "0 0 20px rgba(0,255,136,0.4)",
              textDecoration: "none",
            }}
          >
            <Mail className="w-4 h-4" />
            CONTACT US TO ADVERTISE
          </a>
        </div>

        {/* Audience stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-5 rounded-lg"
              style={{ background: "rgba(12,12,28,0.9)", border: `1px solid ${stat.color}20` }}
            >
              <stat.icon className="w-6 h-6 mx-auto mb-2" style={{ color: stat.color }} />
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.5rem", color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-xs mt-1" style={{ color: "rgba(140,140,170,0.6)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Sponsorship tiers */}
        <div className="mb-16">
          <h2
            className="text-center mb-8"
            style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.8rem", textTransform: "uppercase", color: "white" }}
          >
            SPONSORSHIP PACKAGES
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {SPONSOR_TIERS.map((tier) => (
              <div
                key={tier.name}
                className="relative rounded-lg p-7 flex flex-col"
                style={{
                  background: "rgba(12,12,28,0.9)",
                  border: `1px solid ${tier.color}${tier.popular ? "50" : "20"}`,
                  boxShadow: tier.popular ? `0 0 30px ${tier.glow}` : "none",
                  transform: tier.popular ? "scale(1.03)" : "scale(1)",
                }}
              >
                {tier.popular && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 text-[11px] font-bold tracking-widest whitespace-nowrap"
                    style={{ background: tier.color, color: "#080814", borderRadius: "20px", fontFamily: "'Exo 2', sans-serif" }}
                  >
                    ★ MOST POPULAR
                  </div>
                )}
                <div className="mb-4">
                  <div className="text-xs font-bold tracking-widest mb-1" style={{ color: tier.color, fontFamily: "'Exo 2', sans-serif" }}>
                    {tier.name.toUpperCase()}
                  </div>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "2rem", color: tier.color }}>
                    {tier.price}
                  </div>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: tier.color }} />
                      <span style={{ color: "rgba(200,200,220,0.85)" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="mailto:sponsors@chalkpicks.live"
                  className="w-full py-3 text-sm font-bold tracking-wider flex items-center justify-center gap-2 rounded transition-all"
                  style={{
                    background: tier.popular ? tier.color : `${tier.color}18`,
                    color: tier.popular ? "#080814" : tier.color,
                    border: `1px solid ${tier.color}50`,
                    fontFamily: "'Exo 2', sans-serif",
                    textDecoration: "none",
                  }}
                >
                  <Mail className="w-4 h-4" />
                  {tier.cta.toUpperCase()}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Ad placements */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2
            className="text-center mb-8"
            style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.8rem", textTransform: "uppercase", color: "white" }}
          >
            À LA CARTE AD PLACEMENTS
          </h2>
          <div className="space-y-3">
            {AD_PLACEMENTS.map((ad) => (
              <div
                key={ad.name}
                className="flex flex-col md:flex-row md:items-center gap-4 p-5 rounded-lg"
                style={{ background: "rgba(12,12,28,0.9)", border: "1px solid rgba(0,255,136,0.1)" }}
              >
                <div className="flex-1">
                  <div className="font-bold" style={{ color: "white", fontFamily: "'Rajdhani', sans-serif", fontSize: "1.05rem" }}>
                    {ad.name}
                  </div>
                  <div className="text-xs mt-1 flex flex-wrap gap-3" style={{ color: "rgba(140,140,170,0.65)" }}>
                    <span>📐 {ad.dimensions}</span>
                    <span>📍 {ad.location}</span>
                    <span>👁 {ad.impressions}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.3rem", color: "#00ff88" }}>
                    {ad.price}
                  </div>
                  <a
                    href="mailto:sponsors@chalkpicks.live"
                    className="px-4 py-2 text-xs font-bold tracking-wider rounded"
                    style={{
                      background: "rgba(0,255,136,0.1)",
                      border: "1px solid rgba(0,255,136,0.3)",
                      color: "#00ff88",
                      fontFamily: "'Exo 2', sans-serif",
                      textDecoration: "none",
                    }}
                  >
                    INQUIRE
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div
          className="max-w-2xl mx-auto text-center p-10 rounded-lg"
          style={{ background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.15)" }}
        >
          <Zap className="w-10 h-10 mx-auto mb-4" style={{ color: "#00ff88" }} />
          <h3
            style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.5rem", textTransform: "uppercase", color: "white", marginBottom: "0.75rem" }}
          >
            READY TO PARTNER?
          </h3>
          <p className="text-sm mb-6" style={{ color: "rgba(180,180,210,0.65)" }}>
            Reach out to our partnerships team. We'll respond within 24 hours with a custom proposal tailored to your goals and budget.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:sponsors@chalkpicks.live"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold tracking-wider rounded"
              style={{
                background: "#00ff88",
                color: "#080814",
                fontFamily: "'Exo 2', sans-serif",
                boxShadow: "0 0 20px rgba(0,255,136,0.4)",
                textDecoration: "none",
              }}
            >
              <Mail className="w-4 h-4" />
              sponsors@chalkpicks.live
            </a>
            <div
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm"
              style={{ color: "rgba(140,140,170,0.6)" }}
            >
              <Shield className="w-4 h-4" style={{ color: "rgba(0,255,136,0.4)" }} />
              All packages include performance reporting
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
