import { useEffect, useState } from "react";
import { AlertCircle, TrendingUp } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  timestamp: string;
  category: string;
  source: string;
}

export default function ESPNNewsTicker() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch ESPN news from backend
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch("/api/news/espn");
        if (response.ok) {
          const data = await response.json();
          setNews(data.items || []);
        }
      } catch (error) {
        console.error("Failed to fetch ESPN news:", error);
        // Fallback to mock data
        setNews([
          { id: "1", title: "NFL: Patrick Mahomes leads Chiefs to victory", timestamp: "2 min ago", category: "NFL", source: "ESPN" },
          { id: "2", title: "NBA: Lakers secure playoff spot with win", timestamp: "5 min ago", category: "NBA", source: "ESPN" },
          { id: "3", title: "MLB: Dodgers extend winning streak to 7 games", timestamp: "8 min ago", category: "MLB", source: "ESPN" },
          { id: "4", title: "NHL: Avalanche clinch division title", timestamp: "12 min ago", category: "NHL", source: "ESPN" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate news
  useEffect(() => {
    if (news.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length);
    }, 5000); // Change news every 5 seconds
    return () => clearInterval(interval);
  }, [news.length]);

  if (loading || news.length === 0) {
    return null;
  }

  const currentNews = news[currentIndex];
  const categoryColors: Record<string, string> = {
    NFL: "#00ff88",
    NBA: "#00d4ff",
    MLB: "#a855f7",
    NHL: "#ff6b6b",
  };

  return (
    <div
      className="w-full py-2 px-4 overflow-hidden"
      style={{
        background: "linear-gradient(90deg, rgba(0,255,136,0.05) 0%, rgba(0,212,255,0.05) 100%)",
        borderBottom: "1px solid rgba(0, 255, 136, 0.1)",
      }}
    >
      <div className="flex items-center gap-3 animate-pulse">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: "#ff6b6b" }}
          />
          <span className="text-[11px] font-bold tracking-widest text-white">LIVE</span>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <TrendingUp
              className="w-4 h-4 flex-shrink-0"
              style={{ color: categoryColors[currentNews.category] || "#00ff88" }}
            />
            <span
              className="text-[12px] font-bold tracking-wide flex-shrink-0"
              style={{ color: categoryColors[currentNews.category] || "#00ff88" }}
            >
              {currentNews.category}
            </span>
            <span className="text-[13px] text-gray-300 truncate">
              {currentNews.title}
            </span>
            <span className="text-[11px] text-gray-500 flex-shrink-0 ml-auto">
              {currentNews.timestamp}
            </span>
          </div>
        </div>

        {/* Indicator dots */}
        <div className="flex gap-1 flex-shrink-0 ml-2">
          {news.slice(0, Math.min(5, news.length)).map((_, idx) => (
            <div
              key={idx}
              className="w-1.5 h-1.5 rounded-full transition-all"
              style={{
                background: idx === currentIndex ? "#00ff88" : "rgba(0,255,136,0.2)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
