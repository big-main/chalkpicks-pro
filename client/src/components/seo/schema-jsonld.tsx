/**
 * schema-jsonld.tsx — Structured data components for ChalkPicks
 *
 * Usage:
 *   - <OrganizationJsonLd /> + <WebSiteJsonLd /> once in root layout (App.tsx)
 *   - <BreadcrumbJsonLd items={[...]} /> on every programmatic page
 *   - <SportsEventJsonLd event={...} /> on every game/matchup/preview page
 *   - <FaqJsonLd faqs={[...]} /> on landing/tool pages
 *
 * Validate with: https://search.google.com/test/rich-results
 */

import React from "react";

/**
 * Renders one <script type="application/ld+json"> tag for the given object.
 * JSON.stringify never escapes "<", so a "</script>" substring inside any
 * string value (a title, an FAQ answer, ...) would otherwise close the tag
 * early and let the rest of the payload be parsed as HTML — escape "<" as
 * "<" (the standard technique for safely embedding JSON in HTML) so
 * that can't happen, matching what server/_core/seo.ts already does for the
 * server-rendered equivalent of these same blocks.
 */
function JsonLdScript({ data }: { data: object }) {
  const safeJson = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson }} />
  );
}

// ─── Organization ─────────────────────────────────────────────────────────────

export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://chalkpicks.live/#organization",
    name: "ChalkPicks",
    url: "https://chalkpicks.live",
    logo: {
      "@type": "ImageObject",
      url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663518369468/XUi7Hd5RzDcuAESzHPA75p/chalkpicks-logo-white-bg-4Yx5nJvWkP8qR2mZ.png",
      width: 512,
      height: 512,
    },
    description:
      "AI-powered sports betting picks and analytics platform with +EV finder, CLV tracker, arbitrage detector, and line movement alerts.",
    sameAs: [
      "https://twitter.com/chalkpicksai",
      "https://instagram.com/chalkpicks",
      "https://reddit.com/r/chalkpicks",
      "https://www.youtube.com/@chalkpicks",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      email: "support@chalkpicks.live",
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "US",
    },
  };

  return <JsonLdScript data={data} />;
}

// ─── WebSite ──────────────────────────────────────────────────────────────────

export function WebSiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://chalkpicks.live/#website",
    name: "ChalkPicks",
    url: "https://chalkpicks.live",
    description:
      "AI-powered sports betting analytics: daily picks, +EV finder, arbitrage, CLV tracking, and steam move alerts.",
    publisher: { "@id": "https://chalkpicks.live/#organization" },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://chalkpicks.live/picks?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return <JsonLdScript data={data} />;
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JsonLdScript data={data} />;
}

// ─── SportsEvent ──────────────────────────────────────────────────────────────

interface SportsEventJsonLdProps {
  name: string;
  startDate: string; // ISO 8601
  homeTeam: string;
  awayTeam: string;
  sport: string;
  url?: string;
  location?: string;
  description?: string;
}

export function SportsEventJsonLd({
  name,
  startDate,
  homeTeam,
  awayTeam,
  sport,
  url,
  location,
  description,
}: SportsEventJsonLdProps) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name,
    startDate,
    description:
      description ??
      `${awayTeam} at ${homeTeam} — AI-powered picks and odds analysis on ChalkPicks.`,
    sport,
    homeTeam: {
      "@type": "SportsTeam",
      name: homeTeam,
    },
    awayTeam: {
      "@type": "SportsTeam",
      name: awayTeam,
    },
    organizer: { "@id": "https://chalkpicks.live/#organization" },
  };

  if (url) data.url = url;
  if (location) {
    data.location = {
      "@type": "Place",
      name: location,
    };
  }

  return <JsonLdScript data={data} />;
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqJsonLdProps {
  faqs: FaqItem[];
}

export function FaqJsonLd({ faqs }: FaqJsonLdProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return <JsonLdScript data={data} />;
}

// ─── SoftwareApplication ──────────────────────────────────────────────────────

export function SoftwareApplicationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ChalkPicks",
    applicationCategory: "SportsApplication",
    operatingSystem: "Web",
    description:
      "AI-powered sports betting picks analyzer with real-time stats, +EV finder, steam move detector, CLV tracker, parlay builder, and community leaderboard.",
    url: "https://chalkpicks.live",
    offers: {
      "@type": "Offer",
      price: "19.99",
      priceCurrency: "USD",
      priceValidUntil: "2027-12-31",
    },
    publisher: { "@id": "https://chalkpicks.live/#organization" },
  };

  return <JsonLdScript data={data} />;
}
