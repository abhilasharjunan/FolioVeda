// Vercel's native Cron Jobs send `Authorization: Bearer <CRON_SECRET>`, not a
// query param. The `?key=` fallback stays so these routes can still be
// triggered manually (e.g. curl, browser) for testing/backfills.
export function isAuthorizedCronRequest(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const { searchParams } = new URL(req.url);
  return searchParams.get("key") === secret;
}
