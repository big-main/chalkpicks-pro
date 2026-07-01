import { useState, useEffect, useRef } from "react";
import { TrendingUp, Zap, ExternalLink, DollarSign } from "lucide-react";
import { Link } from "wouter";

interface EVBet {
  sport: string;
  matchup: string;
  bet: string;
  odds: string;
  ev: number;       // EV as decimal percentage e.g. 4.2
  book: string;
  time: string;
  betSize: number;  // Recommended bet size in units (Kelly-derived)
}

const SAMPLE_EV_BETS: EVBet[] = [
  { sport: "NBA", matchup: "Celtics vs Knicks",   bet: "Celtics ML",       odds: "-145", ev: 4.2,  book: "DraftKings", time: "2m ago",  betSize: 2.1 },
  { sport: "NFL", matchup: "Chiefs vs Bills",      bet: "Over 48.5",        odds: "-110", ev: 6.8,  book: "FanDuel",    time: "5m ago",  betSize: 3.4 },
  { sport: "MLB", matchup: "Dodgers vs Padres",    bet: "Dodgers -1.5",     odds: "+130", ev: 3.1,  book: "BetMGM",     time: "8m ago",  betSize: 1.6 },
  { sport: "NHL", matchup: "Oilers vs Panthers",   bet: "Under 5.5",        odds: "+105", ev: 5.4,  book: "Caesars",    time: "12m ago", betSize: 2.7 },
  { sport: "NBA", matchup: "Lakers vs Warriors",   bet: "Warriors +3.5",    odds: "-105", ev: 7.1,  book: "PointsBet",  time: "15m ago", betSize: 3.6 },
  { sport: "NFL", matchup: "Eagles vs Cowboys",    bet: "Eagles ML",        odds: "-160", ev: 3.9,  book: "BetRivers",  time: "18m ago", betSize: 2.0 },
  { sport: "MLB", matchup: "Yankees vs Red Sox",   bet: "Over 8.5",         odds: "-115", ev: 4.7,  book: "DraftKings", time: "22m ago", betSize: 2.4 },
  { sport: "NBA", matchup: "Bucks vs Heat",        bet: "Bucks -4.5",       odds: "-110", ev: 5.3,  book: "FanDuel",    time: "25m ago", betSize: 2.7 },
  { sport: "NHL", matchup: "Rangers vs Bruins",    bet: "Rangers ML",       odds: "+125", ev: 6.2,  book: "BetMGM",     time: "30m ago", betSize: 3.1 },
  { sport: "NFL", matchup: "49ers vs Ravens",      bet: "Under 44.5",       odds: "-105", ev: 4.0,  book: "Caesars",    time: "35m ago", betSize: 2.0 },
];

function getSportColor(sport: string): string {
  switch (sport) {
    case "NBA": return "#ff6b35";
    case "NFL": return "#00d4ff";
    case "MLB": return "#00ff88";
    case "NHL": return "#a855f7";
    default:    return "#00ff88";
  }
}

function getEVColor(ev: number): string {
  if (ev >= 6) return "#00ff88";
  if (ev >= 4) return "#f0c040";
  return "#ff9f40";
}

function getBetSizeLabel(units: number): string {
  if (units >= 3) return "Strong";
  if (units >= 2) return "Moderate";
  return "Light";
}

export default function RecentEVTicker() {
  const [bets] = useState(SAMPLE_EV_BETS);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let animationId: number;
    let scrollPos = 0;

    const animate = () => {
      if (!isPaused) {
        scrollPos += 0.5;
        if (scrollPos >= el.scrollWidth / 2) scrollPos = 0;
        el.scrollLeft = scrollPos;
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isPaused]);

  return (
    <section
      className="py-4 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, rgba(0,255,136,0.03) 0%, rgba(8,8,20,1) 100%)",
        borderTop: "1px solid rgba(0,255,136,0.15)",
        borderBottom: "1px solid rgba(0,255,136,0.08)",
      }}
    >
      {/* Header */}
      <div className="container mb-3">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold tracking-wider uppercase"
            style={{
              background: "rgba(0,255,136,0.1)",
              border: "1px solid rgba(0,255,136,0.3)",
              borderRadius: "4px",
              color: "#00ff88",
              fontFamily: "'Rajdhani', sans-serif",
            }}
          >
            <Zap className="w-3 h-3" />
            LIVE
          </div>
          <span
            className="text-sm font-semibold"
            style={{ color: "rgba(220,220,240,0.9)", fontFamily: "'Rajdhani', sans-serif" }}
          >
            Recent +EV Bets Found
          </span>
          <span className="text-xs" style={{ color: "rgba(140,140,170,0.7)" }}>
            — Updated every 60 seconds
          </span>
        </div>
      </div>

      {/* Scrolling cards */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-hidden"
        style={{ scrollBehavior: "auto" }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {[...bets, ...bets].map((bet, i) => (
          <Link
            key={i}
            href={`/ev-finder?sport=${bet.sport.toLowerCase()}&matchup=${encodeURIComponent(bet.matchup)}`}
            className="flex-shrink-0 no-underline transition-all duration-200 hover:scale-[1.02] group"
            style={{
              background: "rgba(20,20,40,0.9)",
              border: "1px solid rgba(0,255,136,0.12)",
              borderRadius: "10px",
              minWidth: "360px",
              display: "block",
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Top row: sport + matchup + link icon */}
            <div
              className="flex items-center justify-between px-3 pt-2.5 pb-1.5"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold px-2 py-0.5"
                  style={{
                    background: `${getSportColor(bet.sport)}20`,
                    color: getSportColor(bet.sport),
                    borderRadius: "3px",
                    fontFamily: "'Rajdhani', sans-serif",
                    letterSpacing: "0.05em",
                  }}
                >
                  {bet.sport}
                </span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: "rgba(200,200,220,0.95)", fontFamily: "'Rajdhani', sans-serif" }}
                >
                  {bet.matchup}
                </span>
              </div>
              <ExternalLink
                className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity ml-2 flex-shrink-0"
                style={{ color: "#00ff88" }}
              />
            </div>

            {/* Bottom row: bet info + EV + bet size */}
            <div className="flex items-center gap-3 px-3 py-2">
              {/* Bet details */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-bold truncate"
                  style={{ color: "white", fontFamily: "'Rajdhani', sans-serif" }}
                >
                  {bet.bet}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="text-xs font-mono"
                    style={{ color: "rgba(160,160,190,0.8)" }}
                  >
                    {bet.odds}
                  </span>
                  <span style={{ color: "rgba(100,100,130,0.5)", fontSize: "10px" }}>·</span>
                  <span className="text-xs" style={{ color: "rgba(120,120,150,0.7)" }}>
                    {bet.book}
                  </span>
                  <span style={{ color: "rgba(100,100,130,0.5)", fontSize: "10px" }}>·</span>
                  <span className="text-xs" style={{ color: "rgba(100,100,130,0.6)" }}>
                    {bet.time}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div style={{ width: "1px", height: "32px", background: "rgba(255,255,255,0.06)" }} />

              {/* EV % */}
              <div className="text-center flex-shrink-0">
                <div className="flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" style={{ color: getEVColor(bet.ev) }} />
                  <span
                    className="text-base font-black"
                    style={{
                      color: getEVColor(bet.ev),
                      fontFamily: "'Rajdhani', sans-serif",
                      lineHeight: 1,
                    }}
                  >
                    +{bet.ev.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: "rgba(120,120,150,0.7)" }}>
                  EV Edge
                </div>
              </div>

              {/* Divider */}
              <div style={{ width: "1px", height: "32px", background: "rgba(255,255,255,0.06)" }} />

              {/* Recommended bet size */}
              <div className="text-center flex-shrink-0">
                <div className="flex items-center gap-0.5">
                  <DollarSign className="w-3 h-3" style={{ color: "#00d4ff" }} />
                  <span
                    className="text-base font-black"
                    style={{
                      color: "#00d4ff",
                      fontFamily: "'Rajdhani', sans-serif",
                      lineHeight: 1,
                    }}
                  >
                    {bet.betSize.toFixed(1)}u
                  </span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: "rgba(120,120,150,0.7)" }}>
                  {getBetSizeLabel(bet.betSize)}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
