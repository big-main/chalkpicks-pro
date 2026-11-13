import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";

type RouterOutputs = inferRouterOutputs<AppRouter>;

export type RecentSettledPick =
  RouterOutputs["picks"]["recentSettled"]["picks"][number];

export type ArchiveDay = RouterOutputs["picks"]["archive"]["days"][number];
export type ArchivePick = ArchiveDay["picks"][number];
