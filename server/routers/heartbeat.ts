/**
 * Heartbeat Router — Manage scheduled cron jobs
 *
 * Exposes tRPC procedures to create, list, update, and delete Heartbeat jobs.
 * Jobs are HTTP callbacks triggered by Manus Heartbeat service on a cron schedule.
 *
 * Example: Daily Reddit post at 9 AM PT (16:00 UTC)
 *   cron: "0 0 16 * * *"
 *   path: "/api/scheduled/reddit-pick"
 */

import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import {
  createHeartbeatJob,
  updateHeartbeatJob,
  deleteHeartbeatJob,
  listHeartbeatJobs,
  type HeartbeatJob,
  type HeartbeatJobUpdate,
} from "../_core/heartbeat";

export const heartbeatRouter = router({
  /**
   * Create a new Heartbeat job (cron task).
   * Returns taskUid to store in your database if needed.
   */
  create: adminProcedure
    .input(
      z.object({
        name: z
          .string()
          .min(1)
          .max(128)
          .describe("Unique job name (e.g., 'reddit-daily-pick')"),
        cron: z
          .string()
          .regex(/^\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+$/)
          .describe(
            "6-field cron (sec min hour dom mon dow), UTC, min 60s interval"
          ),
        path: z
          .string()
          .startsWith("/api/scheduled/")
          .describe("Callback path, must start with /api/scheduled/"),
        method: z.enum(["POST", "PUT"]).optional().default("POST"),
        payload: z
          .any()
          .optional()
          .describe("Optional JSON payload to send with callback"),
        description: z
          .string()
          .optional()
          .describe("Human-readable description"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const job: HeartbeatJob = {
        name: input.name,
        cron: input.cron,
        path: input.path,
        method: input.method,
        payload: input.payload,
        description: input.description,
      };

      // Extract user session from context (empty string = owner)
      const userSession = ctx.user?.id ? String(ctx.user.id) : "";

      const result = await createHeartbeatJob(job, userSession);
      return {
        taskUid: result.taskUid,
        nextExecutionAt: result.nextExecutionAt,
        message: `Heartbeat job '${input.name}' created successfully`,
      };
    }),

  /**
   * List all Heartbeat jobs for the current actor (owner or user).
   */
  list: adminProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).optional().default(1),
          pageSize: z.number().int().min(1).max(100).optional().default(20),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const userSession = ctx.user?.id ? String(ctx.user.id) : "";
      const result = await listHeartbeatJobs(userSession, {
        page: input?.page,
        pageSize: input?.pageSize,
      });
      return result;
    }),

  /**
   * Update an existing Heartbeat job by taskUid.
   * Only fields you pass are updated; omitted fields remain unchanged.
   */
  update: adminProcedure
    .input(
      z.object({
        taskUid: z.string().min(1).describe("Task UID returned from create"),
        cron: z
          .string()
          .regex(/^\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+$/)
          .optional(),
        path: z.string().startsWith("/api/scheduled/").optional(),
        method: z.enum(["POST", "PUT"]).optional(),
        payload: z.any().optional(),
        description: z.string().optional(),
        enable: z.boolean().optional().describe("true = resume, false = pause"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userSession = ctx.user?.id ? String(ctx.user.id) : "";

      const patch: HeartbeatJobUpdate = {};
      if (input.cron !== undefined) patch.cron = input.cron;
      if (input.path !== undefined) patch.path = input.path;
      if (input.method !== undefined) patch.method = input.method;
      if (input.payload !== undefined) patch.payload = input.payload;
      if (input.description !== undefined)
        patch.description = input.description;
      if (input.enable !== undefined) patch.enable = input.enable;

      const result = await updateHeartbeatJob(
        input.taskUid,
        patch,
        userSession
      );
      return {
        nextExecutionAt: result.nextExecutionAt,
        message: "Heartbeat job updated successfully",
      };
    }),

  /**
   * Delete a Heartbeat job by taskUid.
   */
  delete: adminProcedure
    .input(z.object({ taskUid: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const userSession = ctx.user?.id ? String(ctx.user.id) : "";
      await deleteHeartbeatJob(input.taskUid, userSession);
      return { message: "Heartbeat job deleted successfully" };
    }),
});
