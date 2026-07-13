import { useEffect } from "react";

export interface FaqItem {
  question: string;
  answer: string;
}

interface SportsEventSchemaProps {
  /** Home team display name, e.g. "Los Angeles Lakers". */
  homeTeam: string;
  /** Away team display name, e.g. "Boston Celtics". */
  awayTeam: string;
  /** League / sport label, e.g. "NBA". Used in the event name. */
  sport?: string;
  /** ISO 8601 start time of the game. */
  startDate?: string;
  /** Canonical URL of the page this event is shown on. */
  url?: string;
  /** Optional venue or city. */
  location?: string;
  /** Optional FAQ pairs rendered as FAQPage schema for AI-answer eligibility. */
  faq?: FaqItem[];
}

/**
 * Injects `SportsEvent` (and optional `FAQPage`) JSON-LD into the document head
 * for a single game/matchup page. This is what lets search engines show rich
 * snippets and lets AI assistants cite ChalkPicks game pages with structured,
 * machine-readable event data (teams, start time, venue).
 *
 * Drop it onto any pick/matchup page:
 *   <SportsEventSchema homeTeam={pick.home} awayTeam={pick.away}
 *     sport="NBA" startDate={pick.gameTime} url={location.href} />
 */
export function SportsEventSchema({
  homeTeam,
  awayTeam,
  sport,
  startDate,
  url,
  location,
  faq,
}: SportsEventSchemaProps) {
  useEffect(() => {
    if (!homeTeam || !awayTeam) return;

    const name = `${awayTeam} vs ${homeTeam}${sport ? ` — ${sport}` : ""}`;
    const graph: Record<string, unknown>[] = [
      {
        "@type": "SportsEvent",
        name,
        ...(startDate ? { startDate } : {}),
        ...(url ? { url } : {}),
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        ...(location
          ? { location: { "@type": "Place", name: location } }
          : {}),
        homeTeam: { "@type": "SportsTeam", name: homeTeam },
        awayTeam: { "@type": "SportsTeam", name: awayTeam },
        competitor: [
          { "@type": "SportsTeam", name: homeTeam },
          { "@type": "SportsTeam", name: awayTeam },
        ],
      },
    ];

    if (faq && faq.length > 0) {
      graph.push({
        "@type": "FAQPage",
        mainEntity: faq.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      });
    }

    const payload = { "@context": "https://schema.org", "@graph": graph };
    const scriptId = `sportsevent-jsonld-${slugify(name)}`;

    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(payload);

    return () => {
      document.getElementById(scriptId)?.remove();
    };
  }, [homeTeam, awayTeam, sport, startDate, url, location, faq]);

  return null;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}
