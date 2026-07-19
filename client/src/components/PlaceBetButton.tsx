import { useState, useRef, useEffect } from "react";
import { SPORTSBOOKS, getFeaturedBooks, buildDeepLink, SPORT_PATH_MAP, type Sportsbook } from "../../../shared/sportsbooks";
import { ExternalLink, ChevronDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { analytics } from "@/lib/analytics";

interface PlaceBetButtonProps {
  /** Sport key (nfl, nba, mlb, etc.) */
  sportKey?: string;
  /** External event ID if available */
  eventId?: string;
  /** Bookmaker name from odds data (to highlight best book) */
  bestBookmaker?: string;
  /** Compact mode for cards */
  compact?: boolean;
  /** Custom class */
  className?: string;
}

/**
 * PlaceBetButton — Seamless sportsbook deep-link button
 * 
 * Shows a primary "Place Bet" CTA that links to the best sportsbook for this pick.
 * Dropdown reveals all available books with their current bonuses.
 * Tracks affiliate clicks for analytics.
 */
export function PlaceBetButton({
  sportKey,
  eventId,
  bestBookmaker,
  compact = false,
  className = "",
}: PlaceBetButtonProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const trackClick = trpc.affiliateClicks.track.useMutation();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Determine primary book (best odds book or first featured)
  const featured = getFeaturedBooks();
  const primaryBook = bestBookmaker
    ? SPORTSBOOKS.find(b => b.oddsApiKey === bestBookmaker || b.shortName.toLowerCase() === bestBookmaker.toLowerCase()) || featured[0]
    : featured[0];

  const sportPath = sportKey ? SPORT_PATH_MAP[sportKey] || sportKey : undefined;

  function handleBookClick(book: Sportsbook, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    
    // Track the click in DB
    trackClick.mutate({
      sportsbookId: book.id,
      sportKey: sportKey || "unknown",
      source: "place_bet_button",
    });

    // Track in Mixpanel
    analytics.track("sportsbook_clicked", {
      bookId: book.id,
      bookName: book.shortName,
      sportKey: sportKey || "unknown",
      eventId: eventId || null,
      source: "place_bet_button",
    });

    // Build the URL
    const url = buildDeepLink(book, { sport: sportPath, eventId });
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  if (compact) {
    return (
      <div className={`relative inline-block ${className}`} ref={dropdownRef}>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleBookClick(primaryBook, e);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
          style={{
            background: `linear-gradient(135deg, ${primaryBook.color}dd, ${primaryBook.color}99)`,
            color: "#fff",
            boxShadow: `0 2px 8px ${primaryBook.color}40`,
          }}
          title={`Place bet on ${primaryBook.shortName}`}
        >
          <ExternalLink className="w-3 h-3" />
          <span>Bet Now</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Primary button */}
      <div className="flex items-stretch">
        <button
          onClick={(e) => handleBookClick(primaryBook, e)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-l-xl text-sm font-bold transition-all hover:brightness-110"
          style={{
            background: `linear-gradient(135deg, ${primaryBook.color}ee, ${primaryBook.color}bb)`,
            color: "#fff",
            boxShadow: `0 4px 12px ${primaryBook.color}30`,
          }}
        >
          <ExternalLink className="w-4 h-4" />
          <span>Place Bet</span>
          <span className="text-xs opacity-75">on {primaryBook.shortName}</span>
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(!open);
          }}
          className="flex items-center px-2.5 rounded-r-xl border-l border-white/20 transition-all hover:brightness-110"
          style={{
            background: `linear-gradient(135deg, ${primaryBook.color}ee, ${primaryBook.color}bb)`,
            color: "#fff",
          }}
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Dropdown with all books */}
      {open && (
        <div
          className="absolute top-full right-0 mt-2 w-80 rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden"
          style={{ background: "rgba(12, 12, 24, 0.98)", backdropFilter: "blur(20px)" }}
        >
          <div className="p-3 border-b border-white/5">
            <p className="text-xs text-white/50 font-medium uppercase tracking-wider">Choose Sportsbook</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {SPORTSBOOKS.map((book) => (
              <button
                key={book.id}
                onClick={(e) => handleBookClick(book, e)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${book.color}20`, border: `1px solid ${book.color}40` }}
                >
                  <span className="text-xs font-bold" style={{ color: book.color }}>
                    {book.shortName.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{book.shortName}</span>
                    {book.featured && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-bold">TOP</span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 truncate">{book.signupBonus}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-white/5 bg-white/[0.02]">
            <p className="text-[10px] text-white/30 text-center">
              21+ | Gambling Problem? Call 1-800-GAMBLER
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact inline sportsbook link for use inside tables/lists
 */
export function SportsbookLink({
  book,
  sportKey,
  eventId,
  children,
}: {
  book: Sportsbook;
  sportKey?: string;
  eventId?: string;
  children?: React.ReactNode;
}) {
  const trackClick = trpc.affiliateClicks.track.useMutation();
  const sportPath = sportKey ? SPORT_PATH_MAP[sportKey] || sportKey : undefined;

  return (
    <a
      href={buildDeepLink(book, { sport: sportPath, eventId })}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        trackClick.mutate({
          sportsbookId: book.id,
          sportKey: sportKey || "unknown",
          source: "inline_link",
        });
      }}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all hover:brightness-110"
      style={{
        background: `${book.color}15`,
        color: book.color,
        border: `1px solid ${book.color}30`,
      }}
    >
      {children || book.shortName}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

export default PlaceBetButton;
