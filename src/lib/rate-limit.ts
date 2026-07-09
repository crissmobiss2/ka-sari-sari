const store = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 60_000
): { allowed: boolean; retryAfterSecs: number } {
  const now = Date.now();
  const timestamps = (store.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    const retryAfterSecs = Math.ceil((timestamps[0] + windowMs - now) / 1000);
    return { allowed: false, retryAfterSecs };
  }

  timestamps.push(now);
  store.set(key, timestamps);
  return { allowed: true, retryAfterSecs: 0 };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
