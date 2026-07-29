import { useRef, useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  CheckCircle2,
  XCircle,
  Minus,
  Activity,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  Zap,
  BookOpen,
  ExternalLink,
} from "lucide-react";

const SPORT_COLORS: Record<string, string> = {
  nfl: "#39ff14",
  nba: "#f0b800",
  mlb: "#d4a017",
  nhl: "#60a5fa",
  soccer: "#fbbf24",
  default: "#a78bfa",
};

function NewsCard({
  item,
}: {
  item: { sport: string; headline: string; source?: string; url?: string };
}) {
  const color = SPORT_COLORS[item.sport?.toLowerCase()] ?? SPORT_COLORS.default;
  const inner = (
    <div
      className="flex-shrink-0 flex flex-col gap-2 px-4 py-3 rounded-xl border select-none transition-all hover:scale-[1.02] hover:border-opacity-50"
      style={{
        minWidth: 240,
        maxWidth: 280,
        background: "rgba(255,255,255,0.04)",
        borderColor: `${color}25`,
      }}
    >
      <div className="flex items-center gap-2">
        <Newspaper className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
        <span
          className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
          style={{
            color,
            background: `${color}15`,
            border: `1px solid ${color}25`,
          }}
        >
          {item.sport?.toUpperCase() ?? "NEWS"}
        </span>
        {item.url && (
          <ExternalLink
            className="w-3 h-3 ml-auto opacity-30"
            style={{ color }}
          />
        )}
      </div>
      <p
        className="text-xs leading-snug line-clamp-2 font-medium"
        style={{ color: "rgba(225,225,245,0.9)" }}
      >
        {item.headline}
      </p>
      {item.source && (
        <span
          className="text-[9px]"
          style={{ color: "rgba(180,180,200,0.45)" }}
        >
          {item.source}
        </span>
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
  const isPush = pick.result === "push";
  const isLoss = pick.result === "loss";
  const isPending = !pick.result || pick.result === "pending";
  const color = isWin
    ? "#39ff14"
    : isPush
      ? "#f0b800"
      : isLoss
        ? "#f87171"
        : "#a78bfa";
  const resultLabel = isWin
    ? "WIN"
    : isPush
      ? "PUSH"
      : isLoss
        ? "LOSS"
        : "LIVE";
  return (
    <Link href={`/picks/${pick.id}`}>
      <div
        className="flex-shrink-0 flex flex-col gap-2 px-4 py-3 rounded-xl border cursor-pointer select-none hover:scale-[1.02] transition-all"
        style={{
          minWidth: 220,
          maxWidth: 260,
          background: "rgba(255,255,255,0.04)",
          borderColor: `${color}30`,
        }}
      >
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
          <span
            className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
            style={{
              color,
              background: `${color}15`,
              border: `1px solid ${color}25`,
            }}
          >
            {pick.sportKey?.toUpperCase() ?? "PICK"}
          </span>
          <span
            className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{ color, background: `${color}20` }}
          >
            {resultLabel}
          </span>
        </div>
        <p
          className="text-xs font-semibold leading-snug line-clamp-1"
          style={{ color: "rgba(225,225,245,0.95)" }}
        >
          {pick.recommendation ?? `${pick.homeTeam} vs ${pick.awayTeam}`}
        </p>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-mono"
            style={{ color: "rgba(180,180,200,0.6)" }}
          >
            {pick.homeTeam} vs {pick.awayTeam}
          </span>
          {pick.odds !== null && (
            <span
              className="ml-auto text-[10px] font-mono font-bold"
              style={{ color }}
            >
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
    heroImage?: string;
    seedKeyword?: string;
  };
}) {
  return (
    <Link href={`/blog/${article.slug}`}>
      <div
        className="flex-shrink-0 flex flex-col gap-0 rounded-xl border cursor-pointer select-none hover:scale-[1.02] transition-all overflow-hidden"
        style={{
          minWidth: 260,
          maxWidth: 300,
          background: "rgba(255,255,255,0.04)",
          borderColor: "rgba(139,92,246,0.3)",
        }}
      >
        {article.heroImage && (
          <div className="w-full h-24 overflow-hidden">
            <img
              src={article.heroImage}
              alt={article.title}
              className="w-full h-full object-cover opacity-80"
            />
          </div>
        )}
        <div className="flex flex-col gap-1.5 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3 h-3 flex-shrink-0 text-violet-400" />
            <span className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded text-violet-400 bg-violet-400/10 border border-violet-400/20">
              ARTICLE
            </span>
            {article.seedKeyword && (
              <span className="ml-auto text-[9px] text-violet-300/50 truncate max-w-[80px]">
                {article.seedKeyword}
              </span>
            )}
          </div>
          <p
            className="text-xs font-semibold leading-snug line-clamp-2"
            style={{ color: "rgba(225,225,245,0.95)" }}
          >
            {article.title}
          </p>
          {article.excerpt && (
            <p className="text-[10px] leading-snug line-clamp-1 text-muted-foreground">
              {article.excerpt}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function HorizontalScrollTicker() {
  const { data: news } = trpc.stats.allNews.useQuery(undefined, {
    staleTime: 300_000,
    refetchInterval: 300_000,
  });
  const { data: picksData } = trpc.picks.recentSettled.useQuery(
    { limit: 12 },
    {
      refetchInterval: 60_000,
    }
  );
  const { data: blogData } = trpc.blog.list.useQuery(
    { limit: 6, offset: 0 },
    {
      staleTime: 600_000,
    }
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

  // Auto-scroll animation
  useEffect(() => {
    if (isPaused || isDragging) return;
    autoScrollRef.current = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 8;
      if (atEnd) {
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
      left: dir === "right" ? 300 : -300,
      behavior: "smooth",
    });
    setTimeout(() => setIsPaused(false), 2000);
  };

  const picks = picksData?.picks ?? [];
  const newsItems = news ?? [];
  const articles = (blogData?.posts ?? []).slice(0, 4);

  // Interleave: 2 news, 1 pick, 1 article, 2 news, 1 pick...
  // Cap at 15 items to reduce DOM bloat (was 37+ causing PageSpeed penalty)
  const MAX_TICKER_ITEMS = 15;
  const combined: Array<
    | { type: "news"; data: any }
    | { type: "pick"; data: any }
    | { type: "article"; data: any }
  > = [];
  let ni = 0,
    pi = 0,
    ai = 0;
  while (
    (ni < newsItems.length || pi < picks.length || ai < articles.length) &&
    combined.length < MAX_TICKER_ITEMS
  ) {
    if (ni < newsItems.length && combined.length < MAX_TICKER_ITEMS)
      combined.push({ type: "news", data: newsItems[ni++] });
    if (ni < newsItems.length && combined.length < MAX_TICKER_ITEMS)
      combined.push({ type: "news", data: newsItems[ni++] });
    if (pi < picks.length && combined.length < MAX_TICKER_ITEMS)
      combined.push({ type: "pick", data: picks[pi++] });
    if (ai < articles.length && combined.length < MAX_TICKER_ITEMS)
      combined.push({ type: "article", data: articles[ai++] });
  }

  const wins = picks.filter(p => p.result === "win").length;
  const losses = picks.filter(p => p.result === "loss").length;
  const total = wins + losses;
  const winPct = total > 0 ? Math.round((wins / total) * 100) : null;

  return (
    <section
      className="w-full border-b"
      style={{
        background: "rgba(57,255,20,0.015)",
        borderColor: "rgba(57,255,20,0.08)",
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        if (!isDragging) setIsPaused(false);
      }}
    >
      <div className="relative">
        {/* Header row */}
        <div className="flex items-center gap-3 px-4 pt-2.5 pb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="live-dot" />
            <Activity className="w-3.5 h-3.5" style={{ color: "#39ff14" }} />
            <span
              className="text-[10px] font-bold tracking-widest"
              style={{ color: "#39ff14" }}
            >
              LIVE FEED
            </span>
          </div>
          {total > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-white/50">
                Recent:{" "}
                <span className="text-[#39ff14] font-bold">{wins}W</span>-
                <span className="text-red-400 font-bold">{losses}L</span>
              </span>
              {winPct !== null && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    color: "#39ff14",
                    background: "rgba(57,255,20,0.1)",
                    border: "1px solid rgba(57,255,20,0.2)",
                  }}
                >
                  {winPct}% WIN
                </span>
              )}
            </div>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => scrollBy("left")}
              disabled={!canScrollLeft}
              className="p-1 rounded-full transition-all"
              style={{
                background: canScrollLeft
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(255,255,255,0.02)",
                color: canScrollLeft
                  ? "rgba(255,255,255,0.7)"
                  : "rgba(255,255,255,0.2)",
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
                background: canScrollRight
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(255,255,255,0.02)",
                color: canScrollRight
                  ? "rgba(255,255,255,0.7)"
                  : "rgba(255,255,255,0.2)",
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
          onTouchEnd={onTouchEnd}
        >
          {combined.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 rounded-xl border"
                  style={{
                    minWidth: 240,
                    height: 80,
                    background: "rgba(255,255,255,0.03)",
                    borderColor: "rgba(255,255,255,0.06)",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
              ))
            : combined.map((item, i) =>
                item.type === "news" ? (
                  <NewsCard key={`news-${i}`} item={item.data} />
                ) : item.type === "article" ? (
                  <ArticleCard key={`article-${i}`} article={item.data} />
                ) : (
                  <PickCard key={`pick-${i}`} pick={item.data} />
                )
              )}
          {/* Spacer at end */}
          <div className="flex-shrink-0 w-2" />
        </div>

        {/* Left fade gradient */}
        {canScrollLeft && (
          <div
            className="absolute left-0 top-0 bottom-0 w-16 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, rgba(8,8,20,0.95), transparent)",
            }}
          />
        )}
        {/* Right fade gradient */}
        {canScrollRight && (
          <div
            className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none"
            style={{
              background:
                "linear-gradient(to left, rgba(8,8,20,0.95), transparent)",
            }}
          />
        )}
      </div>
    </section>
  );
}
