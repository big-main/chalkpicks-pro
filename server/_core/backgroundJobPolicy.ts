/**
 * Background jobs are production-only by default.
 * Preview environments can opt in explicitly for targeted testing.
 */
export function shouldRunBackgroundJobs(
  nodeEnv = process.env.NODE_ENV,
  explicitFlag = process.env.ENABLE_BACKGROUND_JOBS
): boolean {
  return nodeEnv === "production" || explicitFlag === "true";
}
