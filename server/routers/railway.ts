import { router, adminProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";

const RAILWAY_API = "https://backboard.railway.com/graphql/v2";
const PROJECT_ID = "c13dde22-2ed9-4e8e-b1c1-9c63b727f2e1";
const SERVICE_ID = "5fb17e12-fa1c-4c52-aed9-64de90a42476";
const ENV_ID = "6cb445df-a90c-4f70-a8e7-6199884fcd36";
const RAILWAY_DOMAIN = "chalkpicks-pro-chalkpicks-env.up.railway.app";

async function railwayQuery(token: string, query: string) {
  const res = await fetch(RAILWAY_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  return res.json();
}

export const railwayRouter = router({
  /** Get latest deployment status — admin only */
  status: adminProcedure.query(async ({ ctx }) => {
    const token = process.env.RAILWAY_API_TOKEN;
    if (!token) throw new Error("RAILWAY_API_TOKEN not set");

    const data = await railwayQuery(
      token,
      `{ service(id: "${SERVICE_ID}") {
        name
        updatedAt
        deployments(first: 3) {
          edges {
            node {
              id
              status
              createdAt
              updatedAt
              staticUrl
            }
          }
        }
      }}`
    );

    const svc = data?.data?.service;
    if (!svc) throw new Error("Failed to fetch Railway service");

    const deployments = svc.deployments.edges.map((e: any) => ({
      id: e.node.id,
      status: e.node.status as string,
      createdAt: e.node.createdAt as string,
      updatedAt: e.node.updatedAt as string,
      url: e.node.staticUrl as string | null,
    }));

    const latest = deployments[0];
    const mappedStatus =
      latest?.status === "SUCCESS"
        ? "ACTIVE"
        : latest?.status === "BUILDING" || latest?.status === "DEPLOYING"
        ? "DEPLOYING"
        : latest?.status === "SLEEPING"
        ? "ACTIVE"
        : "FAILED";

    return {
      projectName: "ChalkPicks-Pro",
      serviceName: svc.name as string,
      status: mappedStatus as "ACTIVE" | "FAILED" | "DEPLOYING",
      latestStatus: latest?.status ?? "UNKNOWN",
      lastDeployment: latest?.createdAt ?? svc.updatedAt,
      deploymentUrl: `https://${RAILWAY_DOMAIN}`,
      environment: "production",
      healthCheck: mappedStatus === "ACTIVE" ? ("passing" as const) : ("failing" as const),
      deployments,
    };
  }),

  /** Trigger a redeploy — admin only */
  redeploy: adminProcedure.mutation(async () => {
    const token = process.env.RAILWAY_API_TOKEN;
    if (!token) throw new Error("RAILWAY_API_TOKEN not set");

    const data = await railwayQuery(
      token,
      `mutation { serviceInstanceRedeploy(serviceId: "${SERVICE_ID}", environmentId: "${ENV_ID}") }`
    );

    if (data?.errors?.length) {
      throw new Error(data.errors[0].message);
    }

    return { success: true, message: "Redeploy triggered successfully" };
  }),

  /** Receive Railway deployment webhook — public (Railway calls this) */
  webhook: publicProcedure
    .input(
      z.object({
        type: z.string(),
        status: z.string().optional(),
        deployment: z
          .object({
            id: z.string(),
            status: z.string(),
            url: z.string().optional(),
          })
          .optional(),
        service: z
          .object({
            id: z.string(),
            name: z.string(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { type, status, deployment } = input;
      console.log(`[Railway Webhook] Event: ${type} | Status: ${status ?? deployment?.status}`);

      // Notify owner via Manus notification system
      const { notifyOwner } = await import("../_core/notification");
      const deployStatus = status ?? deployment?.status ?? "UNKNOWN";
      const emoji =
        deployStatus === "SUCCESS" ? "✅" : deployStatus === "FAILED" || deployStatus === "CRASHED" ? "🚨" : "🔄";

      await notifyOwner({
        title: `${emoji} Railway Deploy: ${deployStatus}`,
        content: `Railway deployment event received.\nType: ${type}\nStatus: ${deployStatus}\nDeployment ID: ${deployment?.id ?? "N/A"}\nURL: ${deployment?.url ?? RAILWAY_DOMAIN}`,
      }).catch(() => {}); // Non-blocking

      return { received: true };
    }),
});
