import type { Request, Response } from "express";

// Mock ESPN news data - in production, integrate with ESPN API
const mockESPNNews = [
  {
    id: "1",
    title: "Patrick Mahomes leads Chiefs to dominant victory",
    timestamp: "2 min ago",
    category: "NFL",
    source: "ESPN",
    link: "https://espn.com",
  },
  {
    id: "2",
    title: "Lakers secure playoff spot with crucial win",
    timestamp: "5 min ago",
    category: "NBA",
    source: "ESPN",
    link: "https://espn.com",
  },
  {
    id: "3",
    title: "Dodgers extend winning streak to 7 games",
    timestamp: "8 min ago",
    category: "MLB",
    source: "ESPN",
    link: "https://espn.com",
  },
  {
    id: "4",
    title: "Avalanche clinch division title with shutout",
    timestamp: "12 min ago",
    category: "NHL",
    source: "ESPN",
    link: "https://espn.com",
  },
  {
    id: "5",
    title: "Injury report: Star player ruled out for season",
    timestamp: "15 min ago",
    category: "NFL",
    source: "ESPN",
    link: "https://espn.com",
  },
];

const mockLiveScores = [
  {
    id: "game_1",
    sport: "NFL",
    homeTeam: "Kansas City Chiefs",
    awayTeam: "Buffalo Bills",
    homeScore: 24,
    awayScore: 20,
    quarter: "4th",
    time: "2:15",
    status: "Live",
  },
  {
    id: "game_2",
    sport: "NBA",
    homeTeam: "Los Angeles Lakers",
    awayTeam: "Denver Nuggets",
    homeScore: 98,
    awayScore: 102,
    quarter: "3rd",
    time: "5:30",
    status: "Live",
  },
  {
    id: "game_3",
    sport: "MLB",
    homeTeam: "Los Angeles Dodgers",
    awayTeam: "San Francisco Giants",
    homeScore: 5,
    awayScore: 2,
    inning: "7th",
    outs: "2",
    status: "Live",
  },
];

export async function handleESPNNews(req: Request, res: Response) {
  try {
    // In production, fetch from ESPN API or sports data provider
    // For now, return mock data with slight randomization
    const shuffled = [...mockESPNNews].sort(() => Math.random() - 0.5);
    res.json({
      items: shuffled.slice(0, 5),
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching ESPN news:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
}

export async function handleLiveScores(req: Request, res: Response) {
  try {
    const sport = req.query.sport as string | undefined;
    let scores = mockLiveScores;

    if (sport) {
      scores = scores.filter((s) => s.sport === sport);
    }

    res.json({
      games: scores,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching live scores:", error);
    res.status(500).json({ error: "Failed to fetch scores" });
  }
}

export async function handlePlatformStats(req: Request, res: Response) {
  try {
    // In production, fetch real stats from database
    res.json({
      winRate: "92%",
      avgROI: "+18.4%",
      activeUsers: 12847,
      picksToday: 847,
      totalPicks: 847000,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching platform stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
}
