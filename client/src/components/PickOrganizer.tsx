import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { formatSportLabel } from "@/lib/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import {
  estimatedReturn,
  filterOrganizer,
  organizerPlanSchema,
  type OrganizerFilters,
  type OrganizerPlanInput,
} from "../../../shared/pickOrganizer";

type SourcePick = {
  id: number;
  sportKey: string;
  recommendation: string;
  odds: number | null;
  tier: string;
  result: string;
  homeTeam: string | null;
  awayTeam: string | null;
  gameTime?: Date | string | null;
};
const defaultFilters: OrganizerFilters = {
  query: "",
  kind: "all",
  status: "all",
  sport: "all",
  upcomingOnly: false,
  sort: "event",
};
const blankPlan = (): OrganizerPlanInput => ({
  title: "",
  kind: "pick",
  status: "draft",
  sport: "other",
  eventAt: null,
  stake: 0,
  notes: "",
  legs: [{ description: "", odds: null }],
});
const selectStyle =
  "h-10 w-full rounded-md border border-white/15 bg-[#111318] px-3 text-sm text-white focus:ring-2 focus:ring-green-400";
function localTime(value: number | null) {
  if (value === null) return "";
  const date = new Date(value);
  return new Date(value - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export default function PickOrganizer({ picks }: { picks: SourcePick[] }) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [offset, setOffset] = useState(0);
  const query = trpc.pickOrganizer.list.useQuery(
    { offset, userId: user?.id },
    { enabled: !!user, staleTime: 30000 }
  );
  const [filters, setFilters] = useState<OrganizerFilters>(defaultFilters);
  const [editor, setEditor] = useState<OrganizerPlanInput | null>(null);
  const [editingId, setEditingId] = useState<number | undefined>();
  const [removeId, setRemoveId] = useState<number | null>(null);
  const save = trpc.pickOrganizer.save.useMutation({
    onSuccess: async () => {
      await utils.pickOrganizer.list.invalidate();
      setEditor(null);
      toast.success("Plan saved to your account");
    },
    onError: error => toast.error(error.message),
  });
  const remove = trpc.pickOrganizer.remove.useMutation({
    onSuccess: async () => {
      await utils.pickOrganizer.list.invalidate();
      setRemoveId(null);
      toast.success("Plan removed");
    },
    onError: error => toast.error(error.message),
  });
  const records = query.data?.records ?? [];
  const filtered = useMemo(
    () => filterOrganizer(records, filters),
    [records, filters]
  );
  const premium =
    user?.role === "admin" ||
    (!!user &&
      ["daily", "monthly", "yearly"].includes(user.subscriptionTier) &&
      (!user.subscriptionExpiresAt ||
        new Date(user.subscriptionExpiresAt) > new Date()));
  const availablePicks = picks.filter(
    pick => pick.result === "pending" && (pick.tier === "free" || premium)
  );
  const sports = Array.from(
    new Set([
      ...records.map(record => record.sport),
      ...availablePicks.map(pick => pick.sportKey),
    ])
  ).sort();
  const update = <K extends keyof OrganizerPlanInput>(
    key: K,
    value: OrganizerPlanInput[K]
  ) =>
    setEditor(previous =>
      previous ? { ...previous, [key]: value } : previous
    );
  function start(kind: OrganizerPlanInput["kind"]) {
    setEditingId(undefined);
    setEditor({
      ...blankPlan(),
      kind,
      legs:
        kind === "parlay"
          ? [
              { description: "", odds: null },
              { description: "", odds: null },
            ]
          : [{ description: "", odds: null }],
    });
  }
  function submit() {
    const result = organizerPlanSchema.safeParse(editor);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message || "Check your plan");
      return;
    }
    save.mutate({ id: editingId, plan: result.data });
  }
  const payout = editor ? estimatedReturn(editor) : null;
  return (
    <section
      id="my-organizer"
      className="mt-8 rounded-2xl border border-green-400/20 bg-[#0c1013] p-4 sm:p-6 space-y-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
            <FolderOpen className="h-5 w-5 text-green-400" /> My Picks &amp;
            Plans
          </h2>
          <p className="mt-1 text-sm text-white/55">
            Private, account-saved picks, parlays and trade plans. Planning
            only—no bets or trades are placed.
          </p>
        </div>
        {user && (
          <div className="flex flex-wrap gap-2">
            {(["pick", "parlay", "trade"] as const).map(kind => (
              <Button key={kind} variant="outline" onClick={() => start(kind)}>
                <Plus className="h-4 w-4 mr-1" />
                {kind === "trade"
                  ? "Trade plan"
                  : kind === "parlay"
                    ? "Parlay"
                    : "Pick"}
              </Button>
            ))}
          </div>
        )}
      </div>
      {!user ? (
        <div className="rounded-lg border border-white/10 p-5 text-white/65">
          Sign in to create private plans and sync them across devices.{" "}
          <Link className="text-green-400 underline" href="/login">
            Sign in
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <Label htmlFor="organizer-search">Search plans</Label>
              <Input
                id="organizer-search"
                placeholder="Title, team, selection or notes"
                value={filters.query}
                onChange={e =>
                  setFilters({ ...filters, query: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="organizer-kind">Plan type</Label>
              <select
                id="organizer-kind"
                className={selectStyle}
                value={filters.kind}
                onChange={e => setFilters({ ...filters, kind: e.target.value })}
              >
                <option value="all">All types</option>
                <option value="pick">Picks</option>
                <option value="parlay">Parlays</option>
                <option value="trade">Trade plans</option>
              </select>
            </div>
            <div>
              <Label htmlFor="organizer-status">Status</Label>
              <select
                id="organizer-status"
                className={selectStyle}
                value={filters.status}
                onChange={e =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="ready">Ready</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <Label htmlFor="organizer-sport">Sport / market</Label>
              <select
                id="organizer-sport"
                className={selectStyle}
                value={filters.sport}
                onChange={e =>
                  setFilters({ ...filters, sport: e.target.value })
                }
              >
                <option value="all">All sports / markets</option>
                {sports.map(sport => (
                  <option value={sport} key={sport}>
                    {formatSportLabel(sport)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="organizer-sort">Sort plans</Label>
              <select
                id="organizer-sort"
                className={selectStyle}
                value={filters.sort}
                onChange={e =>
                  setFilters({
                    ...filters,
                    sort: e.target.value as OrganizerFilters["sort"],
                  })
                }
              >
                <option value="event">Event soonest (unknown last)</option>
                <option value="updated">Recently edited</option>
                <option value="stake">Highest planned stake</option>
                <option value="title">Title A–Z</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/65">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.upcomingOnly}
                onChange={e =>
                  setFilters({ ...filters, upcomingOnly: e.target.checked })
                }
              />
              Upcoming only (known start time)
            </label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFilters(defaultFilters)}
            >
              Reset
            </Button>
            <span aria-live="polite">{filtered.length} plans on this page</span>
          </div>
          {query.isLoading ? (
            <p role="status" className="text-white/60">
              Loading your plans…
            </p>
          ) : query.isError ? (
            <div role="alert" className="text-red-300">
              {query.error.message}
              <Button variant="ghost" onClick={() => query.refetch()}>
                Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/15 py-8 text-center text-white/55">
              {records.length
                ? "No plans match these filters. Reset filters or check another page."
                : "No saved plans yet. Create a pick, parlay or trade plan above."}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map(record => (
                <article
                  key={record.id}
                  className="min-w-0 rounded-xl border border-white/10 p-4 space-y-3"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <h3 className="font-semibold text-white break-words">
                      {record.title}
                    </h3>
                    <span className="text-xs text-green-300 capitalize">
                      {record.kind} · {record.status}
                    </span>
                  </div>
                  <p className="text-xs text-white/55">
                    {formatSportLabel(record.sport)} ·{" "}
                    {record.eventAt === null
                      ? "Start time not set"
                      : new Date(record.eventAt).toLocaleString()}
                  </p>
                  <ul className="space-y-1 text-sm text-white/80">
                    {record.legs.map((leg, index) => (
                      <li key={index} className="break-words">
                        {index + 1}. {leg.description}{" "}
                        {leg.odds !== null && (
                          <span className="text-green-300">
                            ({leg.odds > 0 ? "+" : ""}
                            {leg.odds})
                          </span>
                        )}
                        <span className="ml-1 text-xs text-white/40">
                          {leg.pickId ? "Linked pick" : "User-entered"}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-white/65">
                    Planned stake: ${record.stake.toFixed(2)}
                    {estimatedReturn(record) !== null && (
                      <>
                        {" "}
                        · Estimated gross return: $
                        {estimatedReturn(record)!.toFixed(2)}
                      </>
                    )}
                  </p>
                  {record.notes && (
                    <p className="text-sm text-white/55 whitespace-pre-wrap break-words">
                      {record.notes}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(record.id);
                        setEditor({
                          title: record.title,
                          kind: record.kind,
                          status: record.status,
                          sport: record.sport,
                          eventAt: record.eventAt,
                          stake: record.stake,
                          notes: record.notes,
                          legs: record.legs,
                        });
                      }}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Edit plan
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setRemoveId(record.id)}
                      aria-label={`Delete ${record.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {(offset > 0 || query.data?.hasMore) && (
            <div className="flex gap-3 items-center">
              <Button
                variant="outline"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - 150))}
              >
                Previous
              </Button>
              <span className="text-sm text-white/55">
                Page {offset / 150 + 1} · filters apply to this page
              </span>
              <Button
                variant="outline"
                disabled={!query.data?.hasMore}
                onClick={() => setOffset(offset + 150)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
      <p className="text-xs text-white/40">
        Odds are saved snapshots, not executable quotes. Verify availability,
        current odds and start times with your platform. Parlay estimates assume
        independent legs; correlated combinations may pay differently. 21+ where
        required. Gamble responsibly.
      </p>
      <Dialog
        open={editor !== null}
        onOpenChange={open => {
          if (!open && !save.isPending) setEditor(null);
        }}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit" : "Create"}{" "}
              {editor?.kind === "trade" ? "trade plan" : editor?.kind}
            </DialogTitle>
          </DialogHeader>
          {editor && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="plan-title">Title</Label>
                <Input
                  id="plan-title"
                  maxLength={120}
                  value={editor.title}
                  onChange={e => update("title", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="plan-status">Status</Label>
                  <select
                    id="plan-status"
                    className={selectStyle}
                    value={editor.status}
                    onChange={e =>
                      update(
                        "status",
                        e.target.value as OrganizerPlanInput["status"]
                      )
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="plan-sport">Sport / market</Label>
                  <Input
                    id="plan-sport"
                    maxLength={32}
                    placeholder="nba, nfl, soccer, btc…"
                    value={editor.sport}
                    onChange={e => update("sport", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="plan-time">
                    Event start (your local time)
                  </Label>
                  <Input
                    id="plan-time"
                    type="datetime-local"
                    value={localTime(editor.eventAt)}
                    onChange={e =>
                      update(
                        "eventAt",
                        e.target.value
                          ? new Date(e.target.value).getTime()
                          : null
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave blank if unconfirmed; saved as UTC.
                  </p>
                </div>
                <div>
                  <Label htmlFor="plan-stake">Planned stake ($)</Label>
                  <Input
                    id="plan-stake"
                    type="number"
                    min="0"
                    max="1000000"
                    step="0.01"
                    value={editor.stake}
                    onChange={e => update("stake", Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-3">
                {editor.legs.map((leg, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-white/10 p-3 space-y-2"
                  >
                    <div className="flex justify-between">
                      <Label htmlFor={`plan-leg-${index}`}>
                        Selection {index + 1}
                        {leg.pickId ? " · linked source" : " · user-entered"}
                      </Label>
                      {editor.kind === "parlay" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Remove selection ${index + 1}`}
                          onClick={() =>
                            update(
                              "legs",
                              editor.legs.filter((_, i) => i !== index)
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      id={`plan-leg-${index}`}
                      maxLength={256}
                      disabled={!!leg.pickId}
                      placeholder={
                        editor.kind === "trade"
                          ? "Contract / position thesis (no order submitted)"
                          : "Team / player and market selection"
                      }
                      value={leg.description}
                      onChange={e =>
                        update(
                          "legs",
                          editor.legs.map((item, i) =>
                            i === index
                              ? { ...item, description: e.target.value }
                              : item
                          )
                        )
                      }
                    />
                    <Label htmlFor={`plan-odds-${index}`}>
                      American odds (optional)
                    </Label>
                    <Input
                      id={`plan-odds-${index}`}
                      type="number"
                      disabled={!!leg.pickId}
                      placeholder="-110 or +150"
                      value={leg.odds ?? ""}
                      onChange={e =>
                        update(
                          "legs",
                          editor.legs.map((item, i) =>
                            i === index
                              ? {
                                  ...item,
                                  odds:
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value),
                                }
                              : item
                          )
                        )
                      }
                    />
                    {availablePicks.length > 0 && (
                      <>
                        <Label htmlFor={`plan-source-${index}`}>
                          Use an available board pick
                        </Label>
                        <select
                          id={`plan-source-${index}`}
                          className={selectStyle}
                          value={leg.pickId ?? "manual"}
                          onChange={e => {
                            const source = availablePicks.find(
                              pick => pick.id === Number(e.target.value)
                            );
                            update(
                              "legs",
                              editor.legs.map((item, i) =>
                                i === index
                                  ? source
                                    ? {
                                        pickId: source.id,
                                        description: source.recommendation,
                                        odds: source.odds,
                                      }
                                    : { description: "", odds: null }
                                  : item
                              )
                            );
                            if (source && editor.sport === "other")
                              update("sport", source.sportKey);
                            if (source?.gameTime && editor.eventAt === null)
                              update(
                                "eventAt",
                                new Date(source.gameTime).getTime()
                              );
                          }}
                        >
                          <option value="manual">Manual selection</option>
                          {availablePicks.map(pick => (
                            <option key={pick.id} value={pick.id}>
                              {formatSportLabel(pick.sportKey)} ·{" "}
                              {pick.awayTeam} @ {pick.homeTeam} ·{" "}
                              {pick.recommendation}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>
                ))}
                {editor.kind === "parlay" && (
                  <Button
                    variant="outline"
                    disabled={editor.legs.length >= 12}
                    onClick={() =>
                      update("legs", [
                        ...editor.legs,
                        { description: "", odds: null },
                      ])
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add leg
                  </Button>
                )}
              </div>
              <div>
                <Label htmlFor="plan-notes">
                  Notes / platform / risk limits
                </Label>
                <Textarea
                  id="plan-notes"
                  maxLength={2000}
                  value={editor.notes}
                  onChange={e => update("notes", e.target.value)}
                />
              </div>
              {payout !== null && (
                <p className="text-sm text-green-300">
                  Estimated gross return: ${payout.toFixed(2)} (stake included;
                  not guaranteed)
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Linked recommendations cannot be rewritten. Swap or remove the
                selection to edit your plan. Saving does not alter the Pick
                Ledger or submit an order.
              </p>
              <Button
                className="w-full"
                disabled={save.isPending}
                onClick={submit}
              >
                {save.isPending ? "Saving…" : "Save plan"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={removeId !== null}
        onOpenChange={open => {
          if (!open && !remove.isPending) setRemoveId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this private plan?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This removes only your organizer record. Original picks and any
            sportsbook positions are unchanged.
          </p>
          <Button
            variant="destructive"
            disabled={remove.isPending}
            onClick={() => removeId !== null && remove.mutate({ id: removeId })}
          >
            {remove.isPending ? "Removing…" : "Remove plan"}
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
