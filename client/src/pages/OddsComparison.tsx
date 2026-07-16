import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { MultiSourceOdds } from "@/components/MultiSourceOdds";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Zap, BarChart3 } from "lucide-react";

const SPORTS = [
  { key: "americanfootball_nfl", label: "NFL", emoji: "🏈" },
  { key: "basketball_nba", label: "NBA", emoji: "🏀" },
  { key: "baseball_mlb", label: "MLB", emoji: "⚾" },
  { key: "icehockey_nhl", label: "NHL", emoji: "🏒" },
  { key: "soccer_epl", label: "Premier League", emoji: "⚽" },
];

/**
 * OddsComparison Page
 * Displays real-time odds from multiple sportsbooks with comparison tools
 */
export default function OddsComparison() {
  const [selectedSport, setSelectedSport] = useState<string>(SPORTS[0].key);

  useEffect(() => {
    document.title = "Real-Time Odds Comparison | ChalkPicks";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Compare live odds across 10+ sportsbooks. Find the best lines, detect steam moves, and maximize your edge.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-16">
        {/* Header */}
        <div className="border-b border-border/50 bg-card/30">
          <div className="container py-8">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <Badge className="mb-2 bg-primary/15 text-primary border-primary/30 text-xs">
                  <Zap className="w-3 h-3 mr-1" /> Live Odds
                </Badge>
                <h1 className="font-display text-4xl tracking-wider">
                  ODDS <span className="text-gold-gradient">COMPARISON</span>
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Real-time odds from 10+ sportsbooks. Find the best lines and detect sharp money.
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                <TrendingUp className="w-3 h-3 mr-1" /> Live Data
              </Badge>
            </div>
          </div>
        </div>

        {/* Sport Selection */}
        <div className="border-b border-border/50 bg-card/20">
          <div className="container py-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {SPORTS.map((sport) => (
                <Button
                  key={sport.key}
                  variant={selectedSport === sport.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSport(sport.key)}
                  className="whitespace-nowrap"
                >
                  {sport.emoji} {sport.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Odds Comparison */}
            <div className="lg:col-span-2">
              <MultiSourceOdds sport={selectedSport} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Key Features */}
              <Card className="bg-card/50 border-border/50 p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-brand-gold" />
                  Features
                </h3>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <span className="text-brand-gold mt-1">✓</span>
                    <span>Real-time odds from 10+ sportsbooks</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-brand-gold mt-1">✓</span>
                    <span>Best line highlighting across books</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-brand-gold mt-1">✓</span>
                    <span>Steam move detection</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-brand-gold mt-1">✓</span>
                    <span>Implied probability calculations</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-brand-gold mt-1">✓</span>
                    <span>Moneyline, spread, and total odds</span>
                  </div>
                </div>
              </Card>

              {/* How It Works */}
              <Card className="bg-card/50 border-border/50 p-4">
                <h3 className="font-semibold text-sm mb-3">How It Works</h3>
                <div className="space-y-3 text-xs text-muted-foreground">
                  <div>
                    <p className="text-white font-semibold mb-1">1. Select Sport</p>
                    <p>Choose your sport above to see live odds</p>
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-1">2. Compare Lines</p>
                    <p>View odds across all available sportsbooks</p>
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-1">3. Find Edge</p>
                    <p>Identify the best lines and sharp money</p>
                  </div>
                </div>
              </Card>

              {/* Data Source */}
              <Card className="bg-card/50 border-border/50 p-4">
                <h3 className="font-semibold text-sm mb-2">Data Source</h3>
                <p className="text-xs text-muted-foreground">
                  Odds powered by The Odds API, aggregating real-time data from DraftKings, FanDuel, BetMGM, Caesars, PointsBet, and more.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
