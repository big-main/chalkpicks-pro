import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Clock, Tag } from "lucide-react";

const BLACK_FRIDAY_DEADLINE = "2026-12-01T23:59:59-08:00";

function useBlackFridayCountdown() {
  const deadline = useMemo(() => new Date(BLACK_FRIDAY_DEADLINE).getTime(), []);
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, deadline - Date.now())
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemaining(Math.max(0, deadline - Date.now()));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [deadline]);

  const totalSeconds = Math.floor(remaining / 1000);
  return {
    expired: remaining <= 0,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export default function BlackFridayCampaign() {
  const countdown = useBlackFridayCountdown();

  return (
    <section className="relative z-20 border-b border-white/10 bg-[#080814]">
      <Link
        href="/pricing?promo=BF50"
        className="group block border-b border-[#39ff14]/20 bg-[radial-gradient(60%_180%_at_0%_0%,rgba(57,255,20,0.12),transparent_48%),radial-gradient(60%_180%_at_100%_0%,rgba(6,182,212,0.12),transparent_48%)]"
        aria-label="Black Friday: 50% off everything with code BF50"
      >
        <div className="container flex min-h-12 flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-xs sm:min-h-14 sm:gap-x-4 sm:text-sm">
          <span className="font-bold tracking-wide text-[#39ff14]">
            BLACK FRIDAY
          </span>
          <span className="text-white/80">50% off everything</span>
          <span className="inline-flex items-center gap-1 rounded-md border border-[#06b6d4]/40 bg-[#06b6d4]/10 px-2 py-1 font-mono text-[11px] font-bold tracking-wider text-[#22d3ee]">
            <Tag className="h-3 w-3" /> BF50
          </span>
          <span className="hidden text-white/40 sm:inline">·</span>
          <span className="font-mono text-[11px] text-[#22d3ee] sm:text-xs">
            {countdown.expired
              ? "Offer ended Dec 1 at 11:59 PM PT"
              : `Ends Dec 1 · ${pad(countdown.hours)}:${pad(countdown.minutes)}:${pad(countdown.seconds)} PT`}
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-[#39ff14] transition-transform group-hover:translate-x-1" />
        </div>
      </Link>

      <div className="container py-4 sm:py-6">
        <Link
          href="/pricing?promo=BF50"
          className="block overflow-hidden rounded-2xl border border-[#39ff14]/20 bg-black/20 shadow-[0_0_50px_rgba(57,255,20,0.06)] transition-colors hover:border-[#39ff14]/40"
          aria-label="Claim 50% off everything with code BF50"
        >
          <picture>
            <source
              media="(max-width: 768px)"
              srcSet="/assets/black-friday/chalkpicks-black-friday-mobile-1080x1350.png"
            />
            <img
              src="/assets/black-friday/chalkpicks-black-friday-hero-1920x600.png"
              alt="Black Friday: 50% off everything at ChalkPicks with code BF50"
              width={1920}
              height={600}
              className="block h-auto w-full"
              loading="eager"
              fetchPriority="high"
            />
          </picture>
        </Link>

        {!countdown.expired && (
          <div className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-white/45 sm:mt-4 sm:text-sm">
            <Clock className="h-3.5 w-3.5 text-[#39ff14]" />
            <span>
              Black Friday pricing ends December 1 at 11:59 PM Pacific Time.
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
