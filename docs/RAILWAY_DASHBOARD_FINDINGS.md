# Railway Dashboard Findings

**Inspection date:** 2026-08-13

The authenticated Railway project is `Chalkpicks Pro` at project ID `c13dde22-2ed9-4e8e-b1c1-9c63b727f2e1`. The initial dashboard opened the PR preview environment `chalkpicks-pro-pr-60`; switching the environment selector to **Chalkpicks Env** activated the production environment ID `6cb445df-a90c-4f70-a8e7-6199884fcd36`.

The production service is named `chalkpicks-pro`, has Railway domain `chalkpicks-pro-chalkpicks-env.up.railway.app`, and is currently displayed as **Crashed**. No DNS changes were made. The `.pro` domain remains on Manus and is still the planned primary domain for a later cutover.

Next browser action: open the production service details and inspect the waiting/crashed deployment, build/start commands, pre-deploy command, sleep mode, health check, and deployment controls.

The production service details show Node `22.23.2`, US West, one replica, and the public Railway staging URL `https://chalkpicks-pro-chalkpicks-env.up.railway.app`. The service dashboard is on the Deployments view and exposes Variables, Metrics, Console, and Settings. The service status remains **Crashed**. The next inspection is the deployment history/logs, followed by service Settings; no DNS changes have been made.

The production Deployments view shows the latest `88c419fd` Railway configuration checkpoint as **CRASHED** (via GitHub), while the API probe had reported the same deployment as `WAITING`; the dashboard is authoritative for the visible deployment state. The previous `cfac72a5` checkpoint is marked **REMOVED**, and older checkpoints were skipped because of CI failures. The service exposes a `Restart` control and per-deployment `View logs` links. The next step is to open the latest deployment logs before changing any service settings.

The selected latest deployment URL is the production service page with deployment id `2677ab93-4ee2-4c02-8b8c-d5977e282c5d`; the dashboard identifies it as the `88c419fd` Railway configuration correction checkpoint and shows **Crashed**, with a visible Restart action. Older removed deployments expose View logs links; the current deployment's action menu is the next route to retrieve its logs or retry it.

The latest deployment Build Logs show Railway scheduled the build on a Metal builder using Railpack `v0.36.4`, installed dependencies with pnpm, ran `pnpm build`, created the container image, and reached the end of the build-log range. This indicates the current blocker is after the image build, in deployment startup/runtime rather than TypeScript or the Railway build command. The next inspection is Deploy Logs.

Railway Deploy Logs show the container starting at `2026-08-13 04:27:56 UTC`, followed by an `ELIFECYCLE` failure with exit code `45`; the dashboard does not expose the full command in the extracted log text. Build Logs completed successfully, so the likely failure is in `pnpm start` or the production guard rather than the image build. The project must be inspected for `scripts/prod-start-guard.mjs`, runtime assumptions, and the expected `PORT`/database behavior before retrying.

The direct Railway Variables navigation returned the authenticated service route, but the subsequent browser view resolved to `about:blank` with no elements. No variable values were read or changed. Because the service page itself previously rendered authenticated, this appears to be a browser-tab/rendering issue rather than evidence that variables are absent. The production start guard requires `JWT_SECRET` and `DATABASE_URL`; these must be checked in Railway before retrying the deployment.

Railway Variables confirms the production service has only one service variable, `RAILWAY_ENV`, plus Railway's eight system-provided variables (`RAILWAY_PUBLIC_DOMAIN`, `RAILWAY_PRIVATE_DOMAIN`, `RAILWAY_PROJECT_NAME`, `RAILWAY_ENVIRONMENT_NAME`, `RAILWAY_SERVICE_NAME`, `RAILWAY_PROJECT_ID`, `RAILWAY_ENVIRONMENT_ID`, and `RAILWAY_SERVICE_ID`). No application secrets such as `DATABASE_URL` or `JWT_SECRET` are configured in this Railway environment. This explains the production start guard failure; no secret values will be copied automatically or exposed.

An authenticated read-only Railway API token was tested against the official `variableCollectionUpsert` mutation with `skipDeploys: true`; Railway returned `Not Authorized`. No variables were changed by this attempt. The safe fallback is the authenticated Railway Variables UI: the owner must enter the required secret values there, beginning with `DATABASE_URL` and `JWT_SECRET`, followed by the provider keys listed in `RAILWAY_ENVIRONMENT_MANIFEST.md`. Values must not be pasted into GitHub, project files, or chat.
