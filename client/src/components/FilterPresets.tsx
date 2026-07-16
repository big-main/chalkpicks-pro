import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, Trash2, Zap } from "lucide-react";
import { ArbitrageFilterOptions } from "@/components/ArbitrageFilters";

interface FilterPreset {
  id: string;
  name: string;
  filters: ArbitrageFilterOptions;
  createdAt: Date;
}

interface FilterPresetsProps {
  currentFilters: ArbitrageFilterOptions;
  presets: FilterPreset[];
  onLoadPreset: (filters: ArbitrageFilterOptions) => void;
  onSavePreset: (name: string, filters: ArbitrageFilterOptions) => void;
  onDeletePreset: (id: string) => void;
}

export function FilterPresets({
  currentFilters,
  presets,
  onLoadPreset,
  onSavePreset,
  onDeletePreset,
}: FilterPresetsProps) {
  const handleSavePreset = () => {
    const name = prompt("Enter preset name (e.g., 'High Margin NBA'):");
    if (name) {
      onSavePreset(name, currentFilters);
    }
  };

  const QUICK_PRESETS: Array<{ name: string; filters: ArbitrageFilterOptions }> = [
    {
      name: "High Margin (>2%)",
      filters: {
        ...currentFilters,
        minProfitMargin: 2,
        maxProfitMargin: 10,
        eventTimeRange: "all" as const,
      },
    },
    {
      name: "Quick Profits ($50+)",
      filters: {
        ...currentFilters,
        minGuaranteedProfit: 50,
        eventTimeRange: "all" as const,
      },
    },
    {
      name: "NBA Only",
      filters: {
        ...currentFilters,
        sports: ["NBA"],
        eventTimeRange: "all" as const,
      },
    },
    {
      name: "Today's Events",
      filters: {
        ...currentFilters,
        eventTimeRange: "today",
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Save Current Preset */}
      <Button
        onClick={handleSavePreset}
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
      >
        <Save size={16} className="mr-2" />
        Save Current Filters as Preset
      </Button>

      {/* Quick Presets */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Quick Presets</h3>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_PRESETS.map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              size="sm"
              onClick={() => onLoadPreset(preset.filters)}
              className="justify-start text-xs"
            >
              <Zap size={12} className="mr-1" />
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Saved Presets */}
      {presets.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Saved Presets</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {presets.map((preset) => (
              <Card
                key={preset.id}
                className="p-3 bg-background/50 border-border/30 hover:border-border/60 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {preset.name}
                    </p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {preset.filters.sports.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {preset.filters.sports.length} sports
                        </Badge>
                      )}
                      {preset.filters.minProfitMargin > 0.5 && (
                        <Badge variant="secondary" className="text-xs">
                          {preset.filters.minProfitMargin}%+ margin
                        </Badge>
                      )}
                      {preset.filters.minGuaranteedProfit > 10 && (
                        <Badge variant="secondary" className="text-xs">
                          ${preset.filters.minGuaranteedProfit}+ profit
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onLoadPreset(preset.filters)}
                      className="h-7 px-2 text-xs"
                    >
                      Load
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeletePreset(preset.id)}
                      className="h-7 px-2 text-xs text-brand-red hover:text-brand-red"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
