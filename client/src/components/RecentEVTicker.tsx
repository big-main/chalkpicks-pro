import { useState, useEffect, useRef } from "react";
import { TrendingUp, Zap, DollarSign, ExternalLink } from "lucide-react";
import { Link } from "wouter";

// Simulated recent +EV bets (in production, pull from trpc.odds.getEVBets)
const SAMPLE_EV_BETS = [
  { sport: "NBA", matchup: "Celtics vs Knicks", bet: "Celtics ML", odds: "-145", ev: "+4.2%", book: "DraftKings", time: "2m ago" },
  { sport: "NFL", matchup: "Chiefs vs Bills", bet: "Over 48.5", odds: "-110", ev: "+6.8%", book: "FanDuel", time: "5m ago" },
  { sport: "MLB", matchup: "Dodgers vs Padres", bet: "Dodgers -1.5", odds: "+130", ev: "+3.1%", book: "BetMGM", time: "8m ago" },
  { sport: "NHL", matchup: "Oilers vs Panthers", bet: "Under 5.5", odds: "+105", ev: "+5.4%", book: "Caesars", time: "12m ago" },
  { sport: "NBA", matchup: "Lakers vs Warriors", bet: "Warriors +3.5", odds: "-105", ev: "+7.1%", book: "PointsBet", time: "15m ago" },
  { sport: "NFL", matchup: "Eagles vs Cowboys", bet: "Eagles ML", odds: "-160", ev: "+3.9%", book: "BetRivers", time: "18m ago" },
  { sport: "MLB", matchup: "Yankees vs Red Sox", bet: "Over 8.5", odds: "-115", ev: "+4.7%", book: "DraftKings", time: "22m ago" },
  { sport: "NBA", matchup: "Bucks vs Heat", bet: "Bucks -4.5", odds: "-110", ev: "+5.3%", book: "FanDuel", time: "25m ago" },
  { sport: "NHL", matchup: "Rangers vs Bruins", bet: "Rangers ML", odds: "+125", ev: "+6.2%", book: "BetMGM", time: "30m ago" },
  { sport: "NFL", matchup: "49ers vs Ravens", bet: "Under 44.5", odds: "-105", ev: "+4.0%", book: "Caesars", time: "35m ago" },
];

function getSportColor(sport: string): string {
  switch (sport) {
    case "NBA": return "#ff6b35";
    case "NFL": return "#00d4ff";
    case "MLB": return "#00ff88";
    case "NHL": return "#a855f7";
    default: return "#00ff88";
  }
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
        if (scrollPos >= el.scrollWidth / 2) {
          scrollPos = 0;
        }
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

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-hidden cursor-pointer"
        style={{ scrollBehavior: "auto" }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Duplicate bets for infinite scroll effect */}
        {[...bets, ...bets].map((bet, i) => (
          <Link
            key={i}
            href={`/ev-finder?sport=${bet.sport.toLowerCase()}&matchup=${encodeURIComponent(bet.matchup)}`}
            className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 no-underline transition-all duration-200 hover:scale-[1.02] group"
            style={{
              background: "rgba(20,20,40,0.8)",
              border: "1px solid rgba(0,255,136,0.12)",
              borderRadius: "8px",
              minWidth: "320px",
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Sport badge */}
            <div
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
            </div>

            {/* Bet info */}
            <div className="flex flex-col">
              <span className="text-xs font-medium" style={{ color: "rgba(200,200,220,0.9)" }}>
                {bet.matchup}
              </span>
              <span className="text-xs" style={{ color: "rgba(140,140,170,0.7)" }}>
                {bet.bet} ({bet.odds}) · {bet.book}
              </span>
            </div>

            {/* EV badge */}
            <div className="ml-auto flex items-center gap-1">
              <TrendingUp className="w-3 h-3" style={{ color: "#00ff88" }} />
              <span
                className="text-sm font-bold"
                style={{ color: "#00ff88", fontFamily: "'Rajdhani', sans-serif" }}
              >
                {bet.ev}
              </span>
            </div>

            {/* Time + link indicator */}
            <span className="text-xs" style={{ color: "rgba(100,100,130,0.6)" }}>
              {bet.time}
            </span>
            <ExternalLink
              className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: "rgba(0,255,136,0.6)" }}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
