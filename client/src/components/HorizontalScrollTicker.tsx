import { useRef, useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  Activity,
  Newspaper,
  Zap,
  BookOpen,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const SPORT_COLORS: Record<string, string> = {
  nfl: "#39ff14",
  nba: "#f0b800",
  mlb: "#d4a017",
  nhl: "#60a5fa",
  soccer: "#fbbf24",
  default: "#a78bfa",
};

// Unified card height + structure for all item types
const CARD_BASE =
  "flex-shrink-0 w-[220px] h-[88px] flex flex-col justify-between px-3.5 py-2.5 rounded-lg border select-none transition-all duration-200 hover:scale-[1.015] hover:shadow-md cursor-pointer";

function NewsCard({
  item,
}: {
  item: { sport: string; headline: string; source?: string; url?: string };
}) {
  const color = SPORT_COLORS[item.sport?.toLowerCase()] ?? SPORT_COLORS.default;
  const inner = (
    <div
      className={CARD_BASE}
      style={{
        background: "rgba(255,255,255,0.035)",
        borderColor: `${color}22`,
      }}
    >
      <div className="flex items-center gap-1.5">
        <Newspaper className="w-3 h-3 flex-shrink-0" style={{ color }} />
        <span
          className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
          style={{
            color,
            background: `${color}12`,
            border: `1px solid ${color}20`,
          }}
        >
          {item.sport?.toUpperCase() ?? "NEWS"}
        </span>
        {item.url && (
          <ExternalLink
            className="w-2.5 h-2.5 ml-auto opacity-25"
            style={{ color }}
          />
        )}
      </div>
      <p className="text-[11px] leading-snug line-clamp-2 font-medium text-white/85">
        {item.headline}
      </p>
      {item.source && (
        <span className="text-[9px] text-white/30 truncate">{item.source}</span>
      )}
    </div>
  );
  return item.url ? (
    <a href={item.url} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  ) : (
    inner
  );
}

function PickCard({ pick }: { pick: any }) {
  const isWin = pick.result === "win";
  const isLoss = pick.result === "loss";
  const color = isWin ? "#39ff14" : isLoss ? "#f87171" : "#a78bfa";
  const resultLabel = isWin
    ? "WIN"
    : isLoss
      ? "LOSS"
      : pick.result === "push"
        ? "PUSH"
        : "LIVE";

  return (
    <Link href={`/picks/${pick.id}`}>
      <div
        className={CARD_BASE}
        style={{
          background: "rgba(255,255,255,0.035)",
          borderColor: `${color}22`,
        }}
      >
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 flex-shrink-0" style={{ color }} />
          <span
            className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
            style={{
              color,
              background: `${color}12`,
              border: `1px solid ${color}20`,
            }}
          >
            {pick.sportKey?.toUpperCase() ?? "PICK"}
          </span>
          <span
            className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{ color, background: `${color}18` }}
          >
            {resultLabel}
          </span>
        </div>
        <p className="text-[11px] font-semibold leading-snug line-clamp-1 text-white/90">
          {pick.recommendation ?? `${pick.homeTeam} vs ${pick.awayTeam}`}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-white/35 truncate max-w-[130px]">
            {pick.homeTeam} vs {pick.awayTeam}
          </span>
          {pick.odds !== null && pick.odds !== undefined && (
            <span className="text-[10px] font-mono font-bold" style={{ color }}>
              {pick.odds > 0 ? "+" : ""}
              {pick.odds}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function ArticleCard({
  article,
}: {
  article: {
    title: string;
    slug: string;
    excerpt?: string;
    seedKeyword?: string;
  };
}) {
  return (
    <Link href={`/blog/${article.slug}`}>
      <div
        className={CARD_BASE}
        style={{
          background: "rgba(255,255,255,0.035)",
          borderColor: "rgba(139,92,246,0.22)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3 h-3 flex-shrink-0 text-violet-400" />
          <span className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded text-violet-400 bg-violet-400/10 border border-violet-400/20">
            ARTICLE
          </span>
          {article.seedKeyword && (
            <span className="ml-auto text-[9px] text-violet-300/40 truncate max-w-[70px]">
              {article.seedKeyword}
            </span>
          )}
        </div>
        <p className="text-[11px] font-semibold leading-snug line-clamp-2 text-white/90">
          {article.title}
        </p>
        {article.excerpt && (
          <p className="text-[9px] text-white/35 line-clamp-1">
            {article.excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div
      className="flex-shrink-0 w-[220px] h-[88px] rounded-lg border"
      style={{
        background: "rgba(255,255,255,0.025)",
        borderColor: "rgba(255,255,255,0.06)",
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    />
  );
}

export default function HorizontalScrollTicker() {
  const { data: news } = trpc.stats.allNews.useQuery(undefined, {
    staleTime: 300_000,
    refetchInterval: 300_000,
  });
  const { data: picksData } = trpc.picks.recentSettled.useQuery(
    { limit: 10 },
    { refetchInterval: 60_000 }
  );
  const { data: blogData } = trpc.blog.list.useQuery(
    { limit: 4, offset: 0 },
    { staleTime: 600_000 }
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    if (isPaused || isDragging) return;
    autoScrollRef.current = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 8) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 1, behavior: "instant" as ScrollBehavior });
      }
    }, 30);
    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, [isPaused, isDragging]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [news, picksData, blogData, updateScrollState]);

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsPaused(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft ?? 0));
    setScrollLeft(scrollRef.current?.scrollLeft ?? 0);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current.offsetLeft ?? 0);
    scrollRef.current.scrollLeft = scrollLeft - (x - startX);
  };
  const onMouseUp = () => {
    setIsDragging(false);
    setTimeout(() => setIsPaused(false), 2000);
  };
  const onTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    setStartX(e.touches[0].pageX - (scrollRef.current?.offsetLeft ?? 0));
    setScrollLeft(scrollRef.current?.scrollLeft ?? 0);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    const x = e.touches[0].pageX - (scrollRef.current.offsetLeft ?? 0);
    scrollRef.current.scrollLeft = scrollLeft - (x - startX);
  };
  const onTouchEnd = () => setTimeout(() => setIsPaused(false), 3000);
  const scrollBy = (dir: "left" | "right") => {
    setIsPaused(true);
    scrollRef.current?.scrollBy({
      left: dir === "right" ? 280 : -280,
      behavior: "smooth",
    });
    setTimeout(() => setIsPaused(false), 2000);
  };

  const picks = picksData?.picks ?? [];
  const newsItems = news ?? [];
  const articles = (blogData?.posts ?? []).slice(0, 4);

  // Interleave: news, news, pick, article — cap at 16 items
  const MAX_ITEMS = 16;
  const combined: Array<{ type: "news" | "pick" | "article"; data: any }> = [];
  let ni = 0,
    pi = 0,
    ai = 0;
  while (
    (ni < newsItems.length || pi < picks.length || ai < articles.length) &&
    combined.length < MAX_ITEMS
  ) {
    if (ni < newsItems.length && combined.length < MAX_ITEMS)
      combined.push({ type: "news", data: newsItems[ni++] });
    if (ni < newsItems.length && combined.length < MAX_ITEMS)
      combined.push({ type: "news", data: newsItems[ni++] });
    if (pi < picks.length && combined.length < MAX_ITEMS)
      combined.push({ type: "pick", data: picks[pi++] });
    if (ai < articles.length && combined.length < MAX_ITEMS)
      combined.push({ type: "article", data: articles[ai++] });
  }

  const wins = picks.filter(p => p.result === "win").length;
  const losses = picks.filter(p => p.result === "loss").length;
  const total = wins + losses;
  const winPct = total > 0 ? Math.round((wins / total) * 100) : null;
  const isLoading = combined.length === 0;

  return (
    <section
      className="w-full border-b"
      style={{
        background: "rgba(57,255,20,0.012)",
        borderColor: "rgba(57,255,20,0.07)",
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        if (!isDragging) setIsPaused(false);
      }}
    >
      {/* Header strip */}
      <div className="flex items-center gap-3 px-4 pt-2 pb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="live-dot" />
          <Activity className="w-3 h-3" style={{ color: "#39ff14" }} />
          <span
            className="text-[10px] font-bold tracking-widest"
            style={{ color: "#39ff14" }}
          >
            LIVE FEED
          </span>
        </div>
        {winPct !== null && (
          <span className="text-[9px] font-mono text-white/40">
            <span className="text-[#39ff14] font-bold">{wins}W</span>
            {"-"}
            <span className="text-red-400 font-bold">{losses}L</span>
            {" · "}
            <span className="text-[#39ff14] font-bold">{winPct}%</span>
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => scrollBy("left")}
            disabled={!canScrollLeft}
            className="p-1 rounded transition-all"
            style={{
              background: canScrollLeft
                ? "rgba(255,255,255,0.07)"
                : "transparent",
              color: canScrollLeft
                ? "rgba(255,255,255,0.6)"
                : "rgba(255,255,255,0.15)",
            }}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button
            onClick={() => scrollBy("right")}
            disabled={!canScrollRight}
            className="p-1 rounded transition-all"
            style={{
              background: canScrollRight
                ? "rgba(255,255,255,0.07)"
                : "transparent",
              color: canScrollRight
                ? "rgba(255,255,255,0.6)"
                : "rgba(255,255,255,0.15)",
            }}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Scrollable card row */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-2.5 px-4 pb-3 overflow-x-auto"
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
          onTouchEnd={onTouchEnd}
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : combined.map((item, i) =>
                item.type === "news" ? (
                  <NewsCard key={`news-${i}`} item={item.data} />
                ) : item.type === "article" ? (
                  <ArticleCard key={`article-${i}`} article={item.data} />
                ) : (
                  <PickCard key={`pick-${i}`} pick={item.data} />
                )
              )}
          <div className="flex-shrink-0 w-2" />
        </div>

        {/* Fade edges */}
        {canScrollLeft && (
          <div
            className="absolute left-0 top-0 bottom-0 w-12 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, rgba(8,8,20,0.9), transparent)",
            }}
          />
        )}
        {canScrollRight && (
          <div
            className="absolute right-0 top-0 bottom-0 w-12 pointer-events-none"
            style={{
              background:
                "linear-gradient(to left, rgba(8,8,20,0.9), transparent)",
            }}
          />
        )}
      </div>
    </section>
  );
}
