import { useEffect } from "react";

interface SportsEventProps {
  name: string;
  homeTeam: string;
  awayTeam: string;
  startDate: string;
  sport: string;
  venue?: string;
  description?: string;
  odds?: { home: number; away: number; book: string };
}

/**
 * Injects SportsEvent JSON-LD structured data into the page head.
 * Used on programmatic sport/matchup/odds pages for rich search results.
 */
export function SportsEventJsonLd({ name, homeTeam, awayTeam, startDate, sport, venue, description, odds }: SportsEventProps) {
  useEffect(() => {
    const id = `sports-event-jsonld-${name.replace(/\s/g, "-")}`;
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }

    const data: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      "name": name,
      "startDate": startDate,
      "description": description || `${awayTeam} at ${homeTeam} — ${sport} odds, picks, and predictions from ChalkPicks Pro.`,
      "sport": sport,
      "homeTeam": {
        "@type": "SportsTeam",
        "name": homeTeam,
      },
      "awayTeam": {
        "@type": "SportsTeam",
        "name": awayTeam,
      },
      "location": venue ? {
        "@type": "Place",
        "name": venue,
      } : undefined,
      "organizer": {
        "@type": "Organization",
        "name": sport,
      },
      "offers": odds ? {
        "@type": "AggregateOffer",
        "description": `Moneyline: ${homeTeam} ${odds.home > 0 ? "+" : ""}${odds.home} / ${awayTeam} ${odds.away > 0 ? "+" : ""}${odds.away} (${odds.book})`,
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
      } : undefined,
    };

    // Remove undefined values
    Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);

    script.textContent = JSON.stringify(data);

    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, [name, homeTeam, awayTeam, startDate, sport, venue, description, odds]);

  return null;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQPageJsonLdProps {
  faqs: FAQItem[];
  pageId?: string;
}

/**
 * Injects FAQPage JSON-LD for rich FAQ snippets in Google Search.
 */
export function FAQPageJsonLd({ faqs, pageId = "default" }: FAQPageJsonLdProps) {
  useEffect(() => {
    const id = `faq-jsonld-${pageId}`;
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }

    const data = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map((faq) => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer,
        },
      })),
    };

    script.textContent = JSON.stringify(data);

    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, [faqs, pageId]);

  return null;
}
