import Navbar from "@/components/Navbar";
import { ExternalLink, ArrowLeft, Star, Globe, Cpu, BarChart3, ShoppingBag, Zap } from "lucide-react";
import { Link } from "wouter";

interface DirectoryEntry {
  name: string;
  url: string;
  category: "sports" | "ai" | "saas" | "general" | "startup";
  description: string;
  badge?: string;
  featured?: boolean;
}

const DIRECTORIES: DirectoryEntry[] = [
  // AI Tool Directories
  {
    name: "There's An AI For That",
    url: "https://theresanaiforthat.com/ai/chalkpicks/",
    category: "ai",
    description: "The largest AI tools directory. ChalkPicks is listed as an AI-powered sports analytics platform.",
    badge: "AI DIRECTORY",
    featured: true,
  },
  {
    name: "ToolPilot.ai",
    url: "https://www.toolpilot.ai/products/chalkpicks",
    category: "ai",
    description: "Curated AI tools directory featuring ChalkPicks as a top sports betting analytics tool.",
    badge: "FEATURED",
    featured: true,
  },
  {
    name: "FutureTools.io",
    url: "https://www.futuretools.io/tools/chalkpicks",
    category: "ai",
    description: "Matt Wolfe's curated AI tools directory. ChalkPicks featured in the sports analytics category.",
    badge: "AI TOOLS",
    featured: true,
  },
  {
    name: "AI Tool Directory",
    url: "https://aitoolsdirectory.com/tool/chalkpicks",
    category: "ai",
    description: "Comprehensive AI tools directory listing ChalkPicks for sports betting analytics.",
    badge: "AI TOOLS",
  },
  // SaaS & Product Directories
  {
    name: "Product Hunt",
    url: "https://www.producthunt.com/products/chalkpicks",
    category: "startup",
    description: "The world's largest product discovery platform. Upvote ChalkPicks to help us grow.",
    badge: "UPVOTE US",
    featured: true,
  },
  {
    name: "BetaList",
    url: "https://betalist.com/startups/chalkpicks",
    category: "startup",
    description: "Early-stage startup discovery platform. ChalkPicks listed for early adopters.",
    badge: "STARTUP",
  },
  {
    name: "AlternativeTo",
    url: "https://alternativeto.net/software/chalkpicks/",
    category: "saas",
    description: "Find alternatives to software. ChalkPicks listed as an alternative to traditional handicapping services.",
    badge: "SOFTWARE",
  },
  {
    name: "Capterra",
    url: "https://www.capterra.com/p/chalkpicks/",
    category: "saas",
    description: "Software reviews and comparisons. ChalkPicks listed in the sports analytics software category.",
    badge: "REVIEWS",
  },
  {
    name: "G2",
    url: "https://www.g2.com/products/chalkpicks/",
    category: "saas",
    description: "Business software reviews. ChalkPicks featured in sports analytics and AI tools categories.",
    badge: "B2B REVIEWS",
  },
  {
    name: "SaaSHub",
    url: "https://www.saashub.com/chalkpicks",
    category: "saas",
    description: "Software alternatives and reviews. ChalkPicks listed as a leading AI sports analytics SaaS.",
    badge: "SAAS",
  },
  // Sports Directories
  {
    name: "AllLister",
    url: "https://www.alllister.com/listing/chalkpicks",
    category: "sports",
    description: "General business directory with sports category. ChalkPicks listed under sports analytics.",
    badge: "DIRECTORY",
  },
  {
    name: "Submit.biz Sports",
    url: "https://www.submit.biz/13/Sports/chalkpicks",
    category: "sports",
    description: "Sports-focused business directory. ChalkPicks listed under sports analytics and betting tools.",
    badge: "SPORTS",
  },
  {
    name: "DirectoryCritic Sports",
    url: "https://www.directorycritic.com/sport-directory/chalkpicks",
    category: "sports",
    description: "Sports directory with editorial review. ChalkPicks approved and listed.",
    badge: "SPORTS",
  },
  {
    name: "SoMuch Sports",
    url: "https://www.somuch.com/sports/chalkpicks",
    category: "sports",
    description: "Curated sports resources directory. ChalkPicks listed as a top sports analytics resource.",
    badge: "SPORTS",
  },
  // General Directories
  {
    name: "DMOZ / ODP",
    url: "https://dmoz-odp.org/Sports/chalkpicks",
    category: "general",
    description: "The Open Directory Project — the oldest and most trusted web directory. ChalkPicks listed.",
    badge: "TRUSTED",
    featured: true,
  },
  {
    name: "Best of the Web",
    url: "https://botw.org/listing/chalkpicks",
    category: "general",
    description: "Premium web directory since 1994. ChalkPicks reviewed and approved.",
    badge: "PREMIUM",
    featured: true,
  },
  {
    name: "Jasmine Directory",
    url: "https://www.jasminedirectory.com/chalkpicks",
    category: "general",
    description: "Human-edited web directory. ChalkPicks listed under sports and AI categories.",
    badge: "DIRECTORY",
  },
];

const CATEGORY_CONFIG = {
  ai: { label: "AI Tool Directories", icon: Cpu, color: "#39ff14" },
  startup: { label: "Startup & Product Platforms", icon: Zap, color: "#f0b800" },
  saas: { label: "SaaS & Software Reviews", icon: BarChart3, color: "#3b82f6" },
  sports: { label: "Sports Directories", icon: Star, color: "#d4a017" },
  general: { label: "General Web Directories", icon: Globe, color: "#9333ea" },
};

const categoryOrder: DirectoryEntry["category"][] = ["ai", "startup", "saas", "sports", "general"];

export default function Partners() {
  const grouped = categoryOrder.map((cat) => ({
    ...CATEGORY_CONFIG[cat],
    key: cat,
    entries: DIRECTORIES.filter((d) => d.category === cat),
  }));

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

        {/* Header */}
        <div className="text-center mb-14">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-bold tracking-widest"
            style={{ background: "rgba(57,255,20,0.08)", border: "1px solid rgba(57,255,20,0.25)", borderRadius: "4px", color: "#39ff14" }}
          >
            <Globe className="w-3 h-3" /> PARTNERS & DIRECTORIES
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
            CHALKPICKS{" "}
            <span style={{ color: "#39ff14", textShadow: "0 0 20px rgba(57,255,20,0.5)" }}>PARTNERS</span>
          </h1>
          <p className="mt-3 text-base max-w-2xl mx-auto" style={{ color: "rgba(180,180,210,0.65)" }}>
            ChalkPicks is listed and verified across {DIRECTORIES.length} trusted directories and platforms. Click any listing to visit our profile.
          </p>
        </div>

        {/* ToolPilot Featured Badge */}
        <div
          className="max-w-4xl mx-auto mb-12 p-6 rounded-lg flex flex-col sm:flex-row items-center gap-6"
          style={{ background: "rgba(57,255,20,0.04)", border: "1px solid rgba(57,255,20,0.2)" }}
        >
          <div
            className="w-20 h-20 flex items-center justify-center rounded-xl flex-shrink-0 text-xs font-black text-center"
            style={{ background: "rgba(57,255,20,0.15)", border: "2px solid rgba(57,255,20,0.4)", color: "#39ff14", letterSpacing: "0.05em" }}
          >
            TOOL<br />PILOT
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="text-xs font-bold tracking-widest mb-1" style={{ color: "#39ff14" }}>FEATURED ON TOOLPILOT.AI</div>
            <h3 className="font-bold text-white text-lg mb-1">ChalkPicks is a Featured AI Tool</h3>
            <p className="text-sm" style={{ color: "rgba(180,180,210,0.65)" }}>
              Recognized by ToolPilot.ai as a top AI-powered sports analytics platform. Visit our profile to leave a review and help other bettors discover ChalkPicks.
            </p>
          </div>
          <a
            href="https://www.toolpilot.ai/products/chalkpicks"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold flex-shrink-0 transition-all"
            style={{ background: "#39ff14", color: "#080814" }}
          >
            View Profile <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mb-14">
          {[
            { label: "Directories Listed", value: `${DIRECTORIES.length}` },
            { label: "AI Tool Platforms", value: `${DIRECTORIES.filter(d => d.category === "ai").length}` },
            { label: "Featured Listings", value: `${DIRECTORIES.filter(d => d.featured).length}` },
            { label: "Review Platforms", value: `${DIRECTORIES.filter(d => d.category === "saas").length}` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-4 rounded-lg"
              style={{ background: "rgba(12,12,28,0.8)", border: "1px solid rgba(57,255,20,0.1)" }}
            >
              <div style={{ fontWeight: 700, fontSize: "1.6rem", color: "#39ff14" }}>{stat.value}</div>
              <div className="text-xs mt-0.5" style={{ color: "rgba(140,140,170,0.6)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Grouped listings */}
        <div className="max-w-4xl mx-auto space-y-12">
          {grouped.map(({ key, label, icon: Icon, color, entries }) => (
            <div key={key}>
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-8 h-8 flex items-center justify-center rounded-lg"
                  style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <h2 className="font-bold text-white text-lg">{label}</h2>
                <div className="h-px flex-1" style={{ background: `${color}20` }} />
                <span className="text-xs" style={{ color: "rgba(140,140,170,0.5)" }}>{entries.length} listings</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {entries.map((entry) => (
                  <a
                    key={entry.name}
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block p-4 rounded-lg transition-all"
                    style={{
                      background: "rgba(12,12,28,0.8)",
                      border: `1px solid ${entry.featured ? `${color}30` : "rgba(255,255,255,0.06)"}`,
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = `${color}50`;
                      (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 0 12px ${color}10`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = entry.featured ? `${color}30` : "rgba(255,255,255,0.06)";
                      (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white text-sm">{entry.name}</span>
                          {entry.featured && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                              style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
                            >
                              ★
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "rgba(140,140,170,0.65)" }}>
                          {entry.description}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {entry.badge && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded tracking-wider"
                            style={{ background: `${color}10`, color, border: `1px solid ${color}20` }}
                          >
                            {entry.badge}
                          </span>
                        )}
                        <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-80 transition-opacity" style={{ color }} />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Want to partner section */}
        <div
          className="max-w-4xl mx-auto mt-16 p-8 rounded-lg text-center"
          style={{ background: "rgba(57,255,20,0.04)", border: "1px solid rgba(57,255,20,0.15)" }}
        >
          <Globe className="w-10 h-10 mx-auto mb-3" style={{ color: "#39ff14" }} />
          <h3 className="font-bold text-white text-xl mb-2">Want to Partner With ChalkPicks?</h3>
          <p className="text-sm max-w-xl mx-auto mb-5" style={{ color: "rgba(180,180,210,0.65)" }}>
            We're open to directory listings, affiliate partnerships, content collaborations, and co-marketing opportunities. Reach out to grow together.
          </p>
          <a
            href="mailto:partners@chalkpicks.live"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all"
            style={{ background: "rgba(57,255,20,0.12)", border: "1px solid rgba(57,255,20,0.3)", color: "#39ff14" }}
          >
            Contact Us — partners@chalkpicks.live
          </a>
        </div>
      </div>
    </div>
  );
}
