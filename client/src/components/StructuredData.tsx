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
      "description": "AI-powered sports betting analytics platform with 92% win rate. Daily picks, odds comparison, and ROI tracking.",
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
      "description": "AI-powered sports betting picks with 92% win rate. Real-time odds comparison, confidence scores, and ROI tracking for NFL, NBA, MLB, NHL.",
      "offers": {
        "@type": "AggregateOffer",
        "lowPrice": "0",
        "highPrice": "49.99",
        "priceCurrency": "USD",
        "offerCount": "3",
        "offers": [
          {
            "@type": "Offer",
            "name": "Free",
            "price": "0",
            "priceCurrency": "USD",
            "description": "Basic picks access"
          },
          {
            "@type": "Offer",
            "name": "Pro Monthly",
            "price": "29.99",
            "priceCurrency": "USD",
            "description": "Full AI picks, odds comparison, performance tracking"
          },
          {
            "@type": "Offer",
            "name": "Pro Annual",
            "price": "49.99",
            "priceCurrency": "USD",
            "description": "All Pro features, priority support, annual billing"
          }
        ]
      },
      "featureList": [
        "AI-powered daily picks",
        "92% historical win rate",
        "Real-time odds comparison across 18+ sportsbooks",
        "Confidence scoring (70-95%)",
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
