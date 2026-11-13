/**
 * Shared schema.org JSON-LD builders for BreadcrumbList and FAQPage — the
 * two shapes independently reimplemented in server/prerender.ts,
 * client/src/components/seo/schema-jsonld.tsx, and
 * client/src/components/BreadcrumbJsonLd.tsx. One source of truth instead
 * of three near-identical copies of the same object-literal shape.
 */

export interface BreadcrumbLdItem {
  name: string;
  /** Full absolute URL. Takes precedence over `path` if both are given. */
  url?: string;
  /** Relative path, prefixed with `baseUrl` when `url` isn't given. */
  path?: string;
}

export function buildBreadcrumbListJsonLd(
  items: BreadcrumbLdItem[],
  baseUrl = "https://chalkpicks.live"
): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url ?? `${baseUrl}${item.path ?? ""}`,
    })),
  };
}

export interface FaqLdEntry {
  question: string;
  answer: string;
}

export function buildFaqPageJsonLd(faqs: FaqLdEntry[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}
