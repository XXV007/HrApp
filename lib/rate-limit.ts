type RateLimitClient = {
  rpc: (
    name: string,
    params: { p_key: string; p_limit: number; p_window_seconds: number },
  ) => PromiseLike<{ data: { allowed: boolean; retry_after: number }[] | null; error: unknown }>;
};

export async function rateLimit(
  db: RateLimitClient,
  key: string,
  limit = 30,
  windowSeconds = 60,
) {
  const { data, error } = await db.rpc("consume_api_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error || !data?.[0]) throw new Error("Rate limit service unavailable");
  return {
    allowed: data[0].allowed,
    retryAfter: data[0].retry_after,
  };
}
