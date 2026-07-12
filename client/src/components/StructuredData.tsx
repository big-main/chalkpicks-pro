import { useEffect } from "react";

const SCRIPT_ID = "structured-data-json-ld";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://chalkpicks.live/#organization",
      "name": "ChalkPicks Pro",
      "url": "https://chalkpicks.live",
      "logo": "https://chalkpicks.live/favicon.ico",
      "description": "AI-powered sports betting analytics platform with a data-driven edge. Daily picks, odds comparison, and ROI tracking.",
      "sameAs": [
        "https://twitter.com/chalkpicks",
        "https://instagram.com/chalkpicks"
      ],
      "foundingDate": "2025",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "url": "https://chalkpicks.live"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://chalkpicks.live/#website",
      "url": "https://chalkpicks.live",
      "name": "ChalkPicks Pro",
      "publisher": { "@id": "https://chalkpicks.live/#organization" },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://chalkpicks.live/picks?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://chalkpicks.live/#app",
      "name": "ChalkPicks Pro",
      "applicationCategory": "SportsApplication",
      "operatingSystem": "Web",
      "url": "https://chalkpicks.live",
      "description": "AI-powered sports betting picks with a data-driven edge. Real-time odds comparison, confidence scores, and ROI tracking for NFL, NBA, MLB, NHL.",
      "offers": {
        "@type": "AggregateOffer",
        "lowPrice": "9.99",
        "highPrice": "59.99",
        "priceCurrency": "USD",
        "offerCount": "3",
        "offers": [
          {
            "@type": "Offer",
            "name": "Basic Monthly",
            "price": "9.99",
            "priceCurrency": "USD",
            "description": "Premium daily picks, AI analysis, player props & live odds"
          },
          {
            "@type": "Offer",
            "name": "Pro Monthly",
            "price": "19.99",
            "priceCurrency": "USD",
            "description": "Full AI picks, odds comparison, performance tracking"
          },
          {
            "@type": "Offer",
            "name": "Elite Annual",
            "price": "59.99",
            "priceCurrency": "USD",
            "description": "All Pro features, priority support, annual billing"
          }
        ]
      },
      "featureList": [
        "AI-powered daily picks",
        "Transparent, tracked pick history",
        "Real-time odds comparison across 18+ sportsbooks",
        "Confidence scoring on every pick",
        "ROI tracking and performance analytics",
        "Line movement detection",
        "Kelly Criterion bankroll management",
        "Parlay builder",
        "EV finder",
        "Arbitrage detection"
      ]
    }
  ]
};

export function StructuredData() {
  useEffect(() => {
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);

    return () => {
      const el = document.getElementById(SCRIPT_ID);
      if (el) el.remove();
    };
  }, []);

  return null;
}
