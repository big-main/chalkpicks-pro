import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Zap, TrendingUp, Filter, Flame, DollarSign } from "lucide-react";

export interface FilterState {
  showSteamOnly: boolean;
  showHighKelly: boolean;
  minKellyPct: number;
  showReverseLineMovement: boolean;
  minEV: number;
}

interface SteamKellyFilterProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  steamCount: number;
  highKellyCount: number;
  totalBets: number;
}

export const DEFAULT_FILTERS: FilterState = {
  showSteamOnly: false,
  showHighKelly: false,
  minKellyPct: 2,
  showReverseLineMovement: false,
  minEV: 0,
};

export function SteamKellyFilter({
  filters,
  onFilterChange,
  steamCount,
  highKellyCount,
  totalBets,
}: SteamKellyFilterProps) {
  const [expanded, setExpanded] = useState(false);
  const activeFilters = [
    filters.showSteamOnly,
    filters.showHighKelly,
    filters.showReverseLineMovement,
    filters.minEV > 0,
  ].filter(Boolean).length;

  return (
    <Card className="bg-card/50 border-border/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand-gold" />
          Smart Filters
        </h3>
        <div className="flex items-center gap-2">
          {activeFilters > 0 && (
            <Badge className="bg-brand-gold/20 text-brand-gold border-brand-gold/30 text-[10px]">
              {activeFilters} active
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Collapse" : "Expand"}
          </Button>
        </div>
      </div>

      {/* Quick Toggle Row */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Button
          variant={filters.showSteamOnly ? "default" : "outline"}
          size="sm"
          className={`text-xs gap-1.5 ${
            filters.showSteamOnly
              ? "bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"
              : ""
          }`}
          onClick={() =>
            onFilterChange({
              ...filters,
              showSteamOnly: !filters.showSteamOnly,
            })
          }
        >
          <Flame className="w-3 h-3" />
          Steam Moves
          {steamCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">
              {steamCount}
            </Badge>
          )}
        </Button>

        <Button
          variant={filters.showHighKelly ? "default" : "outline"}
          size="sm"
          className={`text-xs gap-1.5 ${
            filters.showHighKelly
              ? "bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30"
              : ""
          }`}
          onClick={() =>
            onFilterChange({
              ...filters,
              showHighKelly: !filters.showHighKelly,
            })
          }
        >
          <DollarSign className="w-3 h-3" />
          High Kelly
          {highKellyCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">
              {highKellyCount}
            </Badge>
          )}
        </Button>

        <Button
          variant={filters.showReverseLineMovement ? "default" : "outline"}
          size="sm"
          className={`text-xs gap-1.5 ${
            filters.showReverseLineMovement
              ? "bg-purple-500/20 border-purple-500/50 text-purple-400 hover:bg-purple-500/30"
              : ""
          }`}
          onClick={() =>
            onFilterChange({
              ...filters,
              showReverseLineMovement: !filters.showReverseLineMovement,
            })
          }
        >
          <TrendingUp className="w-3 h-3" />
          RLM
        </Button>
      </div>

      {/* Expanded Controls */}
      {expanded && (
        <div className="space-y-4 pt-3 border-t border-border/30">
          {/* Kelly Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">
                Min Kelly %
              </Label>
              <span className="text-xs font-mono text-brand-gold">
                {filters.minKellyPct.toFixed(1)}%
              </span>
            </div>
            <Slider
              value={[filters.minKellyPct]}
              onValueChange={([val]) =>
                onFilterChange({ ...filters, minKellyPct: val })
              }
              min={0.5}
              max={10}
              step={0.5}
              className="w-full"
            />
          </div>

          {/* Min EV */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Min +EV %</Label>
              <span className="text-xs font-mono text-brand-gold">
                {filters.minEV.toFixed(1)}%
              </span>
            </div>
            <Slider
              value={[filters.minEV]}
              onValueChange={([val]) =>
                onFilterChange({ ...filters, minEV: val })
              }
              min={0}
              max={15}
              step={0.5}
              className="w-full"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="text-center p-2 bg-background/30 rounded">
              <div className="text-lg font-bold text-white">{totalBets}</div>
              <div className="text-[10px] text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-2 bg-red-500/10 rounded border border-red-500/20">
              <div className="text-lg font-bold text-red-400">{steamCount}</div>
              <div className="text-[10px] text-muted-foreground">Steam</div>
            </div>
            <div className="text-center p-2 bg-green-500/10 rounded border border-green-500/20">
              <div className="text-lg font-bold text-green-400">
                {highKellyCount}
              </div>
              <div className="text-[10px] text-muted-foreground">Kelly</div>
            </div>
          </div>

          {/* Reset */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={() => onFilterChange(DEFAULT_FILTERS)}
          >
            Reset All Filters
          </Button>
        </div>
      )}
    </Card>
  );
}

/**
 * Highlight wrapper for individual bet cards that match steam/kelly criteria
 */
export function BetHighlight({
  isSteam,
  isHighKelly,
  kellyPct,
  isRLM,
  children,
}: {
  isSteam: boolean;
  isHighKelly: boolean;
  kellyPct?: number;
  isRLM: boolean;
  children: React.ReactNode;
}) {
  const borderClass = isSteam
    ? "border-red-500/50 bg-red-500/5"
    : isHighKelly
      ? "border-green-500/50 bg-green-500/5"
      : isRLM
        ? "border-purple-500/50 bg-purple-500/5"
        : "border-border/30";

  return (
    <div
      className={`relative border rounded-lg p-4 transition-all ${borderClass}`}
    >
      {/* Indicator badges */}
      <div className="absolute top-2 right-2 flex gap-1">
        {isSteam && (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-[9px] px-1.5 py-0">
            <Flame className="w-2.5 h-2.5 mr-0.5" />
            STEAM
          </Badge>
        )}
        {isHighKelly && kellyPct !== undefined && (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/40 text-[9px] px-1.5 py-0">
            <DollarSign className="w-2.5 h-2.5 mr-0.5" />
            {kellyPct.toFixed(1)}% Kelly
          </Badge>
        )}
        {isRLM && (
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/40 text-[9px] px-1.5 py-0">
            <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
            RLM
          </Badge>
        )}
      </div>
      {children}
    </div>
  );
}
