import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, X, RotateCcw } from "lucide-react";

export interface ArbitrageFilterOptions {
  sports: string[];
  minProfitMargin: number;
  maxProfitMargin: number;
  sportsbooks: string[];
  minGuaranteedProfit: number;
  eventTimeRange: "today" | "this_week" | "this_month" | "all";
  sortBy: "profit_desc" | "profit_asc" | "margin_desc" | "margin_asc" | "time_asc";
  onlyActive: boolean;
}

const SPORTS = ["NFL", "NBA", "MLB", "NHL", "Soccer", "Tennis", "MMA", "Boxing"];
const SPORTSBOOKS = [
  "DraftKings",
  "FanDuel",
  "BetMGM",
  "Caesars",
  "Pointsbet",
  "Draftkings Sportsbook",
  "FanDuel Sportsbook",
  "BetRivers",
  "Wynn",
  "Barstool",
];

interface ArbitrageFiltersProps {
  filters: ArbitrageFilterOptions;
  onFiltersChange: (filters: ArbitrageFilterOptions) => void;
  isLoading?: boolean;
}

export function ArbitrageFilters({
  filters,
  onFiltersChange,
  isLoading = false,
}: ArbitrageFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSportToggle = (sport: string) => {
    const updatedSports = filters.sports.includes(sport)
      ? filters.sports.filter((s) => s !== sport)
      : [...filters.sports, sport];
    onFiltersChange({ ...filters, sports: updatedSports });
  };

  const handleBookToggle = (book: string) => {
    const updatedBooks = filters.sportsbooks.includes(book)
      ? filters.sportsbooks.filter((b) => b !== book)
      : [...filters.sportsbooks, book];
    onFiltersChange({ ...filters, sportsbooks: updatedBooks });
  };

  const handleProfitMarginChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      minProfitMargin: value[0],
      maxProfitMargin: value[1],
    });
  };

  const handleResetFilters = () => {
    onFiltersChange({
      sports: [],
      minProfitMargin: 0.5,
      maxProfitMargin: 5,
      sportsbooks: [],
      minGuaranteedProfit: 10,
      eventTimeRange: "all",
      sortBy: "profit_desc",
      onlyActive: true,
    });
  };

  const activeFilterCount =
    filters.sports.length +
    filters.sportsbooks.length +
    (filters.minProfitMargin > 0.5 ? 1 : 0) +
    (filters.minGuaranteedProfit > 10 ? 1 : 0) +
    (filters.eventTimeRange !== "all" ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
        >
          <ChevronDown
            size={18}
            className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
          Filters & Sorting
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </button>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-8 px-2 text-xs"
          >
            <RotateCcw size={14} className="mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <Card className="p-4 space-y-6 bg-card/50 border-border/50">
          {/* Sort By */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Sort By</label>
            <Select
              value={filters.sortBy}
              onValueChange={(value: any) =>
                onFiltersChange({ ...filters, sortBy: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profit_desc">Highest Profit First</SelectItem>
                <SelectItem value="profit_asc">Lowest Profit First</SelectItem>
                <SelectItem value="margin_desc">Highest Margin First</SelectItem>
                <SelectItem value="margin_asc">Lowest Margin First</SelectItem>
                <SelectItem value="time_asc">Earliest Event First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Profit Margin Range */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Profit Margin Range: {filters.minProfitMargin.toFixed(2)}% -{" "}
              {filters.maxProfitMargin.toFixed(2)}%
            </label>
            <Slider
              value={[filters.minProfitMargin, filters.maxProfitMargin]}
              onValueChange={handleProfitMarginChange}
              min={0.5}
              max={10}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.5%</span>
              <span>10%</span>
            </div>
          </div>

          {/* Minimum Guaranteed Profit */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Minimum Guaranteed Profit: ${filters.minGuaranteedProfit}
            </label>
            <Select
              value={filters.minGuaranteedProfit.toString()}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  minGuaranteedProfit: parseInt(value),
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">$10+</SelectItem>
                <SelectItem value="25">$25+</SelectItem>
                <SelectItem value="50">$50+</SelectItem>
                <SelectItem value="100">$100+</SelectItem>
                <SelectItem value="250">$250+</SelectItem>
                <SelectItem value="500">$500+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Event Time Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Event Time Range
            </label>
            <Select
              value={filters.eventTimeRange}
              onValueChange={(value: any) =>
                onFiltersChange({ ...filters, eventTimeRange: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="all">All Events</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sports Filter */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Sports</label>
            <div className="grid grid-cols-2 gap-2">
              {SPORTS.map((sport) => (
                <Button
                  key={sport}
                  variant={filters.sports.includes(sport) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSportToggle(sport)}
                  disabled={isLoading}
                  className="justify-start"
                >
                  {sport}
                </Button>
              ))}
            </div>
          </div>

          {/* Sportsbooks Filter */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Sportsbooks
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {SPORTSBOOKS.map((book) => (
                <Button
                  key={book}
                  variant={filters.sportsbooks.includes(book) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleBookToggle(book)}
                  disabled={isLoading}
                  className="justify-start text-xs"
                >
                  {book}
                </Button>
              ))}
            </div>
          </div>

          {/* Active Only Toggle */}
          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/30">
            <label className="text-sm font-medium text-foreground">
              Active Opportunities Only
            </label>
            <button
              onClick={() =>
                onFiltersChange({ ...filters, onlyActive: !filters.onlyActive })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                filters.onlyActive ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  filters.onlyActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
