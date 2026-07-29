import { useEffect } from "react";

export interface PickListItem {
  id: number | string;
  name: string;
  url: string;
  sport?: string;
  date?: string;
  recommendation?: string;
}

interface Props {
  picks: PickListItem[];
  listName?: string;
  pageId?: string;
}

/**
 * ItemList JSON-LD for public pick listings (/free-picks, /picks).
 * Helps search engines understand the collection of picks on the page.
 */
export function PicksItemListJsonLd({
  picks,
  listName = "ChalkPicks AI Sports Betting Picks",
  pageId = "picks-list",
}: Props) {
  useEffect(() => {
    if (!picks.length) return;

    const id = `picks-itemlist-jsonld-${pageId}`;
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }

    const origin = "https://chalkpicks.live";
    const data = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: listName,
      numberOfItems: picks.length,
      itemListElement: picks.slice(0, 20).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.name,
        url: p.url.startsWith("http")
          ? p.url
          : `${origin}${p.url.startsWith("/") ? "" : "/"}${p.url}`,
        ...(p.date || p.sport
          ? {
              item: {
                "@type": "SportsEvent",
                name: p.name,
                ...(p.date ? { startDate: p.date } : {}),
                ...(p.sport ? { sport: p.sport } : {}),
              },
            }
          : {}),
      })),
    };

    script.textContent = JSON.stringify(data);

    return () => {
      document.getElementById(id)?.remove();
    };
  }, [picks, listName, pageId]);

  return null;
}
