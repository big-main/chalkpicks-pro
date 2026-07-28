import { useRef, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  CheckCircle2, XCircle, Minus, Activity, TrendingUp, ChevronLeft, ChevronRight,
  Newspaper, Zap,
} from "lucide-react";

const SPORT_COLORS: Record<string, string> = {
  nfl: "#39ff14",
  nba: "#f0b800",
  mlb: "#d4a017",
  nhl: "#60a5fa",
  soccer: "#fbbf24",
  default: "#a78bfa",
};

function NewsCard({ item }: { item: { sport: string; headline: string; source?: string } }) {
  const color = SPORT_COLORS[item.sport?.toLowerCase()] ?? SPORT_COLORS.default;
  return (
    <div
      className="flex-shrink-0 flex flex-col gap-1.5 px-3 py-2 rounded-xl border select-none"
      style={{
        minWidth: 220,
        maxWidth: 260,
        background: "rgba(255,255,255,0.03)",
        borderColor: `${color}20`,
      }}
    >
      <div className="flex items-center gap-1.5">
        <Newspaper className="w-3 h-3 flex-shrink-0" style={{ color }} />
        <span
          className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
          style={{ color, background: `${color}15`, border: `1px solid ${color}25` }}
        >
          {item.sport?.toUpperCase() ?? "NEWS"}
        </span>
      </div>
      <p className="text-xs leading-snug line-clamp-2" style={{ color: "rgba(220,220,240,0.85)" }}>
        {item.headline}
      </p>
      {item.source && (
        <span className="text-[9px]" style={{ color: "rgba(180,180,200,0.45)" }}>{item.source}</span>
      )}
    </div>
  );
}

function PickCard({ pick }: { pick: any }) {
  const isWin = pick.result === "win";
  const isPush = pick.result === "push";
  const isLoss = pick.result === "loss";
  const color = isWin ? "#39ff14" : isPush ? "#f0b800" : isLoss ? "#f87171" : "#a78bfa";
  return (
    <Link href={`/picks/${pick.id}`}>
      <div
        className="flex-shrink-0 flex flex-col gap-1.5 px-3 py-2 rounded-xl border cursor-pointer select-none hover:scale-[1.02] transition-transform"
        style={{
          minWidth: 200,
          maxWidth: 240,
          background: "rgba(255,255,255,0.03)",
          borderColor: `${color}25`,
        }}
      >
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 flex-shrink-0" style={{ color }} />
          <span
            className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
            style={{ color, background: `${color}15`, border: `1px solid ${color}25` }}
          >
            {pick.sport?.toUpperCase() ?? "PICK"}
          </span>
          {pick.result && (
            <span className="ml-auto">
              {isWin ? <CheckCircle2 className="w-3.5 h-3.5 text-[#39ff14]" /> :
               isPush ? <Minus className="w-3.5 h-3.5 text-yellow-400" /> :
               <XCircle className="w-3.5 h-3.5 text-red-400" />}
            </span>
          )}
        </div>
        <p className="text-xs font-medium leading-snug line-clamp-2" style={{ color: "rgba(220,220,240,0.9)" }}>
          {pick.homeTeam} vs {pick.awayTeam}
        </p>
        {pick.odds != null && (
          <span className="text-[10px] font-mono" style={{ color: "rgba(180,180,200,0.55)" }}>
            {pick.odds > 0 ? "+" : ""}{pick.odds}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function HorizontalScrollTicker() {
  const { data: news } = trpc.stats.allNews.useQuery(undefined, {
    staleTime: 300_000,
    refetchInterval: 300_000,
  });
  const { data: picksData } = trpc.picks.recentSettled.useQuery({ limit: 12 }, {
    refetchInterval: 60_000,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [news, picksData]);

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft ?? 0));
    setScrollLeft(scrollRef.current?.scrollLeft ?? 0);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current.offsetLeft ?? 0);
    scrollRef.current.scrollLeft = scrollLeft - (x - startX);
  };
  const onMouseUp = () => setIsDragging(false);

  const onTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].pageX - (scrollRef.current?.offsetLeft ?? 0));
    setScrollLeft(scrollRef.current?.scrollLeft ?? 0);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    const x = e.touches[0].pageX - (scrollRef.current.offsetLeft ?? 0);
    scrollRef.current.scrollLeft = scrollLeft - (x - startX);
  };

  const scrollBy = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "right" ? 280 : -280, behavior: "smooth" });
  };

  const picks = picksData?.picks ?? [];
  const newsItems = news ?? [];

  // Interleave: 2 news, 1 pick, 2 news, 1 pick...
  const combined: Array<{ type: "news"; data: any } | { type: "pick"; data: any }> = [];
  let ni = 0, pi = 0;
  while (ni < newsItems.length || pi < picks.length) {
    if (ni < newsItems.length) combined.push({ type: "news", data: newsItems[ni++] });
    if (ni < newsItems.length) combined.push({ type: "news", data: newsItems[ni++] });
    if (pi < picks.length) combined.push({ type: "pick", data: picks[pi++] });
  }

  const wins = picks.filter((p) => p.result === "win").length;
  const losses = picks.filter((p) => p.result === "loss").length;

  return (
    <section
      className="w-full border-b"
      style={{
        background: "rgba(57,255,20,0.02)",
        borderColor: "rgba(57,255,20,0.08)",
      }}
    >
      <div className="relative">
        {/* Header row */}
        <div className="flex items-center gap-3 px-4 pt-2 pb-1">
          <div className="flex items-center gap-1.5">
            <span className="live-dot" />
            <Activity className="w-3 h-3" style={{ color: "#39ff14" }} />
            <span className="text-[10px] font-bold tracking-widest" style={{ color: "#39ff14" }}>
              LIVE FEED
            </span>
          </div>
          {picks.length > 0 && (
            <span className="text-[10px] font-mono text-white/50">
              Recent: <span className="text-[#39ff14] font-bold">{wins}W</span>-<span className="text-red-400 font-bold">{losses}L</span>
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => scrollBy("left")}
              disabled={!canScrollLeft}
              className="p-1 rounded-full transition-all"
              style={{
                background: canScrollLeft ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                color: canScrollLeft ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)",
              }}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => scrollBy("right")}
              disabled={!canScrollRight}
              className="p-1 rounded-full transition-all"
              style={{
                background: canScrollRight ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                color: canScrollRight ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)",
              }}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className="flex gap-3 px-4 pb-3 overflow-x-auto"
          style={{
            cursor: isDragging ? "grabbing" : "grab",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
        >
          {combined.length === 0 ? (
            // Skeleton placeholders while loading
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 rounded-xl border"
                style={{
                  minWidth: 220,
                  height: 72,
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.06)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))
          ) : (
            combined.map((item, i) =>
              item.type === "news" ? (
                <NewsCard key={`news-${i}`} item={item.data} />
              ) : (
                <PickCard key={`pick-${i}`} pick={item.data} />
              )
            )
          )}
          {/* Spacer at end */}
          <div className="flex-shrink-0 w-2" />
        </div>

        {/* Left fade gradient */}
        {canScrollLeft && (
          <div
            className="absolute left-0 top-0 bottom-0 w-12 pointer-events-none"
            style={{ background: "linear-gradient(to right, rgba(8,8,20,0.9), transparent)" }}
          />
        )}
        {/* Right fade gradient */}
        {canScrollRight && (
          <div
            className="absolute right-0 top-0 bottom-0 w-12 pointer-events-none"
            style={{ background: "linear-gradient(to left, rgba(8,8,20,0.9), transparent)" }}
          />
        )}
      </div>
    </section>
  );
}
