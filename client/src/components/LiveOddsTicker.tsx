/**
 * LiveOddsTicker — Real-time scrolling odds ticker powered by SharpAPI SSE stream.
 * Features: interactive click → game detail, sport filter tabs, premium gate with blur.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useOddsStream, StreamOddsRow } from "@/hooks/useOddsStream";
import { formatSportLabel } from "@/lib/badges";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  Lock,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import {
  filterAndSortLiveOdds,
  type LiveOddsSort,
} from "@shared/liveOddsFilters";

interface LiveOddsTickerProps {
  className?: string;
  maxItems?: number;
}

const SPORT_TABS = [
  { key: "", label: "All" },
  { key: "nfl", label: "NFL" },
  { key: "nba", label: "NBA" },
  { key: "mlb", label: "MLB" },
  { key: "nhl", label: "NHL" },
  { key: "ncaaf", label: "NCAAF" },
  { key: "soccer", label: "Soccer" },
];
const ODDS_PRESETS_STORAGE_KEY = "chalkpicks:live-odds-presets:v1";
type OddsPreset = {
  id?: number;
  name: string;
  selectedSport: string;
  search: string;
  selectedBook: string;
  selectedMarket: string;
  movementOnly: boolean;
  sort: LiveOddsSort;
};

function readOddsPresets(): OddsPreset[] {
  try {
    const value = JSON.parse(
      localStorage.getItem(ODDS_PRESETS_STORAGE_KEY) ?? "[]"
    );
    return Array.isArray(value)
      ? value.filter(
          (preset): preset is OddsPreset =>
            preset &&
            typeof preset.name === "string" &&
            typeof preset.selectedSport === "string" &&
            typeof preset.search === "string" &&
            typeof preset.selectedBook === "string" &&
            typeof preset.selectedMarket === "string" &&
            typeof preset.movementOnly === "boolean" &&
            typeof preset.sort === "string"
        )
      : [];
  } catch {
    return [];
  }
}

function OddsChip({
  row,
  onClick,
}: {
  row: StreamOddsRow;
  onClick: () => void;
}) {
  const flashClass =
    row.direction === "up"
      ? "animate-pulse bg-green-500/20 border-green-500/50"
      : row.direction === "down"
        ? "animate-pulse bg-red-500/20 border-red-500/50"
        : "bg-card/80 border-border/50";

  const oddsColor =
    row.direction === "up"
      ? "text-green-400"
      : row.direction === "down"
        ? "text-red-400"
        : "text-foreground";

  const formatOdds = (odds: number) => (odds > 0 ? `+${odds}` : `${odds}`);

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs whitespace-nowrap transition-all duration-300 hover:scale-105 hover:border-primary/50 cursor-pointer ${flashClass}`}
    >
      <span className="text-muted-foreground font-medium truncate max-w-[80px]">
        {row.sportsbook}
      </span>
      <span className="text-foreground/80 truncate max-w-[120px]">
        {row.selection}
      </span>
      <span className={`font-mono font-bold ${oddsColor}`}>
        {formatOdds(row.oddsAmerican)}
      </span>
      {row.line !== null && (
        <span className="text-muted-foreground text-[10px]">
          ({row.line > 0 ? `+${row.line}` : row.line})
        </span>
      )}
      {row.direction !== "stable" && (
        <span
          className={row.direction === "up" ? "text-green-400" : "text-red-400"}
        >
          {row.direction === "up" ? "▲" : "▼"}
        </span>
      )}
    </button>
  );
}

function GameMatchupModal({
  row,
  onClose,
}: {
  row: StreamOddsRow;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase font-semibold text-primary">
            {formatSportLabel(row.league)} • Live
          </span>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-lg"
          >
            ✕
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="text-lg font-bold text-foreground mb-1">
            {row.awayTeam} @ {row.homeTeam}
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(row.timestamp).toLocaleString()}
          </div>
        </div>

        <div className="bg-background/50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Selection
              </div>
              <div className="font-semibold text-sm">{row.selection}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Odds</div>
              <div
                className={`font-mono font-bold text-lg ${
                  row.direction === "up"
                    ? "text-green-400"
                    : row.direction === "down"
                      ? "text-red-400"
                      : "text-foreground"
                }`}
              >
                {row.oddsAmerican > 0
                  ? `+${row.oddsAmerican}`
                  : row.oddsAmerican}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Book</div>
              <div className="font-semibold text-sm capitalize">
                {row.sportsbook}
              </div>
            </div>
          </div>
        </div>

        {row.line !== null && (
          <div className="flex items-center justify-between text-sm mb-4 px-2">
            <span className="text-muted-foreground">Line</span>
            <span className="font-mono font-bold">
              {row.line > 0 ? `+${row.line}` : row.line}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm mb-4 px-2">
          <span className="text-muted-foreground">Market</span>
          <span className="capitalize">
            {row.marketType.replace(/_/g, " ")}
          </span>
        </div>

        {row.prevOdds !== undefined && row.direction !== "stable" && (
          <div className="flex items-center justify-between text-sm px-2 mb-4">
            <span className="text-muted-foreground">Previous Odds</span>
            <span className="font-mono text-muted-foreground line-through">
              {row.prevOdds > 0 ? `+${row.prevOdds}` : row.prevOdds}
            </span>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <a
            href={`/tools/odds-calculator`}
            className="flex-1 text-center px-4 py-2 bg-primary/20 text-primary text-xs font-medium rounded-lg hover:bg-primary/30 transition-colors"
          >
            Calculate EV
          </a>
          <a
            href={`/tools/ev-finder`}
            className="flex-1 text-center px-4 py-2 bg-green-500/20 text-green-400 text-xs font-medium rounded-lg hover:bg-green-500/30 transition-colors"
          >
            Find +EV
          </a>
        </div>
      </div>
    </div>
  );
}

export function LiveOddsTicker({
  className = "",
  maxItems = 30,
}: LiveOddsTickerProps) {
  const [selectedSport, setSelectedSport] = useState("");
  const [selectedRow, setSelectedRow] = useState<StreamOddsRow | null>(null);
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState("all");
  const [selectedMarket, setSelectedMarket] = useState("all");
  const [movementOnly, setMovementOnly] = useState(false);
  const [sort, setSort] = useState<LiveOddsSort>("latest");
  const [presets, setPresets] = useState<OddsPreset[]>(() =>
    typeof window === "undefined" ? [] : readOddsPresets()
  );
  const [presetName, setPresetName] = useState("");
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(10);
  const alertedRowsRef = useRef<Set<string>>(new Set());
  const { user } = useAuth();
  const { data: subscription } = trpc.subscription.mySubscription.useQuery(
    undefined,
    {
      enabled: !!user,
    }
  );

  const isPremium =
    subscription?.isActive &&
    (subscription?.tier === "daily" ||
      subscription?.tier === "monthly" ||
      subscription?.tier === "yearly");
  const { data: remotePresets } = trpc.liveOddsPresets.list.useQuery(
    undefined,
    { enabled: Boolean(user && isPremium) }
  );
  const trpcUtils = trpc.useUtils();
  const saveRemotePreset = trpc.liveOddsPresets.save.useMutation({
    onSuccess: () => trpcUtils.liveOddsPresets.list.invalidate(),
  });
  const removeRemotePreset = trpc.liveOddsPresets.remove.useMutation({
    onSuccess: () => trpcUtils.liveOddsPresets.list.invalidate(),
  });

  const { rows, connected, error } = useOddsStream({
    enabled: true,
    league: selectedSport || undefined,
    maxRows: maxItems,
  });
  useEffect(() => {
    if (!alertsEnabled || typeof window === "undefined" || !rows.length) return;
    if (!("Notification" in window) || Notification.permission !== "granted")
      return;
    rows.forEach(row => {
      const movement =
        row.prevOdds === undefined
          ? 0
          : Math.abs(row.oddsAmerican - row.prevOdds);
      if (row.direction === "stable" || movement < alertThreshold) return;
      const key = `${row.eventId}:${row.sportsbook}:${row.marketType}:${row.selection}:${row.timestamp}`;
      if (alertedRowsRef.current.has(key)) return;
      alertedRowsRef.current.add(key);
      new Notification("ChalkPicks line movement", {
        body: `${row.awayTeam} @ ${row.homeTeam}: ${row.selection} moved ${movement} points at ${row.sportsbook}.`,
      });
    });
    if (alertedRowsRef.current.size > 200) {
      alertedRowsRef.current = new Set(
        Array.from(alertedRowsRef.current).slice(-100)
      );
    }
  }, [alertThreshold, alertsEnabled, rows]);

  const filteredRows = useMemo(() => {
    const sportRows = selectedSport
      ? rows.filter(r =>
          r.league.toLowerCase().includes(selectedSport.toLowerCase())
        )
      : rows;
    return filterAndSortLiveOdds(sportRows, {
      search,
      sportsbook: selectedBook,
      market: selectedMarket,
      movementOnly,
      sort,
    });
  }, [
    movementOnly,
    rows,
    search,
    selectedBook,
    selectedMarket,
    selectedSport,
    sort,
  ]);

  const displayRows = filteredRows.slice(0, maxItems);
  const sportsbooks = useMemo(
    () =>
      Array.from(
        new Set(rows.map(row => row.sportsbook).filter(Boolean))
      ).sort(),
    [rows]
  );
  const markets = useMemo(
    () =>
      Array.from(
        new Set(rows.map(row => row.marketType).filter(Boolean))
      ).sort(),
    [rows]
  );
  const currentPreset: Omit<OddsPreset, "name"> = {
    selectedSport,
    search,
    selectedBook,
    selectedMarket,
    movementOnly,
    sort,
  };
  const availablePresets: OddsPreset[] = remotePresets
    ? remotePresets.map(record => ({
        id: record.id,
        name: record.name,
        ...(record.config as Omit<OddsPreset, "id" | "name">),
      }))
    : presets;
  const savePreset = () => {
    const name = presetName.trim().slice(0, 40);
    if (!name) return;
    const next = [
      ...presets.filter(
        preset => preset.name.toLowerCase() !== name.toLowerCase()
      ),
      { name, ...currentPreset },
    ].slice(-10);
    setPresets(next);
    setPresetName("");
    localStorage.setItem(ODDS_PRESETS_STORAGE_KEY, JSON.stringify(next));
    if (remotePresets) {
      const existing = availablePresets.find(
        preset => preset.name.toLowerCase() === name.toLowerCase()
      );
      saveRemotePreset.mutate({
        id: existing?.id,
        name,
        config: currentPreset,
      });
    }
  };
  const deletePreset = (name: string) => {
    const next = availablePresets.filter(preset => preset.name !== name);
    setPresets(next);
    localStorage.setItem(ODDS_PRESETS_STORAGE_KEY, JSON.stringify(next));
    const remote = availablePresets.find(preset => preset.name === name);
    if (remote?.id) removeRemotePreset.mutate({ id: remote.id });
  };
  const applyPreset = (name: string) => {
    const preset = availablePresets.find(item => item.name === name);
    if (!preset) return;
    setSelectedSport(preset.selectedSport);
    setSearch(preset.search);
    setSelectedBook(preset.selectedBook);
    setSelectedMarket(preset.selectedMarket);
    setMovementOnly(preset.movementOnly);
    setSort(preset.sort);
  };
  const enableAlerts = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === "granted") setAlertsEnabled(true);
  };

  // Premium gate: show blurred preview for free users
  if (!isPremium) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground">
            LIVE ODDS
          </span>
          <span className="text-[10px] text-yellow-500 font-medium ml-auto">
            PREMIUM
          </span>
        </div>

        {/* Sport tabs (visible but non-functional for free users) */}
        <div className="flex gap-1 mb-2 overflow-x-auto scrollbar-hide">
          {SPORT_TABS.map(tab => (
            <span
              key={tab.key}
              className="px-2 py-0.5 text-[10px] rounded-full bg-muted/50 text-muted-foreground whitespace-nowrap"
            >
              {tab.label}
            </span>
          ))}
        </div>

        {/* Blurred preview */}
        <div className="relative">
          <div className="flex gap-2 overflow-hidden pb-2 blur-[6px] select-none pointer-events-none">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className="inline-flex items-center gap-2 rounded-md border border-border/50 bg-card/80 px-3 py-1.5 text-xs whitespace-nowrap"
              >
                <span className="text-muted-foreground">FanDuel</span>
                <span className="text-foreground/80">Team +3.5</span>
                <span className="font-mono font-bold text-green-400">-110</span>
                <span className="text-green-400">▲</span>
              </div>
            ))}
          </div>

          {/* Overlay CTA */}
          <div className="absolute inset-0 flex items-center justify-center">
            <a
              href="/pricing"
              className="flex items-center gap-2 px-4 py-2 bg-primary/90 text-primary-foreground text-xs font-medium rounded-lg shadow-lg hover:bg-primary transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              Upgrade for Live Odds Stream
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (!connected && !error) {
    return (
      <div
        className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}
      >
        <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
        Connecting to live odds stream...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}
      >
        <div className="h-2 w-2 rounded-full bg-red-500" />
        {error}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Header with sport filter tabs */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-medium text-muted-foreground">
          LIVE ODDS
        </span>
        <span className="text-[10px] text-muted-foreground/60 ml-auto">
          {displayRows.length} lines streaming
        </span>
      </div>

      {/* Sport filter tabs */}
      <div className="flex gap-1 mb-2 overflow-x-auto scrollbar-hide">
        {SPORT_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedSport(tab.key)}
            className={`px-2.5 py-0.5 text-[10px] rounded-full whitespace-nowrap transition-colors ${
              selectedSport === tab.key
                ? "bg-primary text-primary-foreground font-medium"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Advanced live filters */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <label className="relative min-w-[170px] flex-1 sm:flex-none">
          <Search className="pointer-events-none absolute left-2 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search teams or markets"
            aria-label="Search live odds"
            className="h-7 w-full rounded-md border border-border/60 bg-background/50 pl-7 pr-2 text-[10px] text-foreground outline-none focus:border-primary/60"
          />
        </label>
        <select
          value={selectedBook}
          onChange={event => setSelectedBook(event.target.value)}
          aria-label="Filter live odds by sportsbook"
          className="h-7 rounded-md border border-border/60 bg-background/50 px-2 text-[10px] text-foreground"
        >
          <option value="all">All books</option>
          {sportsbooks.map(book => (
            <option key={book} value={book}>
              {book}
            </option>
          ))}
        </select>
        <select
          value={selectedMarket}
          onChange={event => setSelectedMarket(event.target.value)}
          aria-label="Filter live odds by market"
          className="h-7 rounded-md border border-border/60 bg-background/50 px-2 text-[10px] text-foreground"
        >
          <option value="all">All markets</option>
          {markets.map(market => (
            <option key={market} value={market}>
              {market.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={event => setSort(event.target.value as LiveOddsSort)}
          aria-label="Sort live odds"
          className="h-7 rounded-md border border-border/60 bg-background/50 px-2 text-[10px] text-foreground"
        >
          <option value="latest">Latest update</option>
          <option value="odds_desc">Highest odds</option>
          <option value="odds_asc">Lowest odds</option>
          <option value="line_desc">Highest line</option>
          <option value="line_asc">Lowest line</option>
          <option value="team">Team A–Z</option>
        </select>
        <button
          type="button"
          onClick={() => setMovementOnly(value => !value)}
          aria-pressed={movementOnly}
          className={`inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[10px] transition-colors ${movementOnly ? "border-primary/60 bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground"}`}
        >
          <SlidersHorizontal className="h-3 w-3" /> Movement only
        </button>
      </div>

      {/* Saved presets and movement alerts */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <select
          defaultValue=""
          onChange={event => applyPreset(event.target.value)}
          aria-label="Apply saved odds preset"
          className="h-7 max-w-[150px] rounded-md border border-border/60 bg-background/50 px-2 text-[10px] text-foreground"
        >
          <option value="">Saved presets</option>
          {availablePresets.map(preset => (
            <option key={preset.name} value={preset.name}>
              {preset.name}
            </option>
          ))}
        </select>
        <input
          value={presetName}
          onChange={event => setPresetName(event.target.value)}
          onKeyDown={event => {
            if (event.key === "Enter") savePreset();
          }}
          maxLength={40}
          placeholder="Preset name"
          aria-label="New odds preset name"
          className="h-7 w-28 rounded-md border border-border/60 bg-background/50 px-2 text-[10px] text-foreground outline-none focus:border-primary/60"
        />
        <button
          type="button"
          onClick={savePreset}
          disabled={!presetName.trim()}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-border/60 px-2 text-[10px] text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Save className="h-3 w-3" /> Save
        </button>
        {availablePresets.length > 0 && (
          <button
            type="button"
            onClick={() =>
              deletePreset(availablePresets[availablePresets.length - 1].name)
            }
            title={`Delete ${availablePresets[availablePresets.length - 1].name}`}
            aria-label={`Delete ${availablePresets[availablePresets.length - 1].name}`}
            className="inline-flex h-7 items-center rounded-md border border-border/60 px-2 text-[10px] text-muted-foreground hover:text-red-400"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
        <span className="mx-1 h-4 w-px bg-border/60" />
        <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
          Alert move ≥
          <input
            type="number"
            min={1}
            max={1000}
            value={alertThreshold}
            onChange={event =>
              setAlertThreshold(Math.max(1, Number(event.target.value) || 1))
            }
            aria-label="Minimum odds movement alert threshold"
            className="h-7 w-14 rounded-md border border-border/60 bg-background/50 px-1 text-center text-[10px] text-foreground"
          />
        </label>
        <button
          type="button"
          onClick={alertsEnabled ? () => setAlertsEnabled(false) : enableAlerts}
          aria-pressed={alertsEnabled}
          className={`inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[10px] transition-colors ${alertsEnabled ? "border-primary/60 bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground"}`}
        >
          <Bell className="h-3 w-3" />{" "}
          {alertsEnabled ? "Alerts on" : "Notify me"}
        </button>
      </div>

      {/* Scrolling ticker */}
      {displayRows.length === 0 ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          {selectedSport
            ? `No ${formatSportLabel(selectedSport)} odds movement right now`
            : "Waiting for odds movement..."}
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {displayRows.map((row, i) => (
            <OddsChip
              key={`${row.eventId}-${row.sportsbook}-${row.selection}-${i}`}
              row={row}
              onClick={() => setSelectedRow(row)}
            />
          ))}
        </div>
      )}

      {/* Game matchup modal */}
      {selectedRow && (
        <GameMatchupModal
          row={selectedRow}
          onClose={() => setSelectedRow(null)}
        />
      )}
    </div>
  );
}
