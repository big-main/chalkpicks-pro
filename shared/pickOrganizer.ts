import { z } from "zod";

export const organizerLegSchema = z.object({
  pickId: z.number().int().positive().optional(),
  description: z.string().trim().min(1).max(256),
  odds: z
    .number()
    .int()
    .min(-100000)
    .max(100000)
    .refine(
      n => Math.abs(n) >= 100,
      "American odds must be at least +100 or at most -100"
    )
    .nullable(),
});
export const organizerPlanSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    kind: z.enum(["pick", "parlay", "trade"]),
    status: z.enum(["draft", "ready", "archived"]),
    sport: z.string().trim().min(1).max(32),
    eventAt: z.number().int().min(0).max(2147483647000).nullable(),
    stake: z.number().finite().min(0).max(1000000),
    notes: z.string().max(2000),
    legs: z.array(organizerLegSchema).min(1).max(12),
  })
  .superRefine((value, ctx) => {
    if (value.kind === "parlay" && value.legs.length < 2)
      ctx.addIssue({
        code: "custom",
        path: ["legs"],
        message: "A parlay requires at least two legs",
      });
    if (value.kind !== "parlay" && value.legs.length !== 1)
      ctx.addIssue({
        code: "custom",
        path: ["legs"],
        message: "Picks and trade plans require one selection",
      });
    const ids = value.legs.flatMap(leg => (leg.pickId ? [leg.pickId] : []));
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({
        code: "custom",
        path: ["legs"],
        message: "Duplicate picks cannot form a parlay",
      });
  });
export type OrganizerPlanInput = z.infer<typeof organizerPlanSchema>;
export type OrganizerRecord = OrganizerPlanInput & {
  id: number;
  updatedAt: Date | string;
  eventAt: number | null;
};
export type OrganizerFilters = {
  query: string;
  kind: string;
  status: string;
  sport: string;
  upcomingOnly: boolean;
  sort: "event" | "updated" | "stake" | "title";
};
export function filterOrganizer<T extends OrganizerRecord>(
  records: T[],
  filters: OrganizerFilters,
  now = Date.now()
): T[] {
  const query = filters.query.toLowerCase().trim();
  return records
    .filter(
      record =>
        (filters.kind === "all" || record.kind === filters.kind) &&
        (filters.status === "all" || record.status === filters.status) &&
        (filters.sport === "all" || record.sport === filters.sport) &&
        (!filters.upcomingOnly ||
          (record.eventAt !== null &&
            record.eventAt >= now &&
            record.status !== "archived")) &&
        (!query ||
          `${record.title} ${record.notes} ${record.legs.map(leg => leg.description).join(" ")}`
            .toLowerCase()
            .includes(query))
    )
    .sort((a, b) => {
      const difference =
        filters.sort === "event"
          ? (a.eventAt ?? Infinity) - (b.eventAt ?? Infinity)
          : filters.sort === "updated"
            ? new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            : filters.sort === "stake"
              ? b.stake - a.stake
              : a.title.localeCompare(b.title);
      return (Number.isNaN(difference) ? 0 : difference) || a.id - b.id;
    });
}
export function estimatedReturn(
  plan: Pick<OrganizerPlanInput, "legs" | "stake" | "kind">
): number | null {
  if (plan.kind === "trade" || plan.legs.some(leg => leg.odds === null))
    return null;
  return (
    plan.stake *
    plan.legs.reduce((product, leg) => {
      const odds = leg.odds!;
      return product * (odds > 0 ? 1 + odds / 100 : 1 + 100 / Math.abs(odds));
    }, 1)
  );
}
