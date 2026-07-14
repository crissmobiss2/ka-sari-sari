// Rate limiter with Upstash Redis backend when UPSTASH_REDIS_REST_URL is set,
// falling back to in-memory for local development.
// WARNING: The in-memory fallback does NOT share state across serverless instances
// and resets on every cold start. Set UPSTASH_REDIS_REST_URL and
// UPSTASH_REDIS_REST_TOKEN in production for effective rate limiting.

const inMemoryStore = new Map<string, number[]>();

async function checkUpstash(
  key: string,
  limit: number,
  windowSecs: number
): Promise<{ allowed: boolean; retryAfterSecs: number } | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null; // signal: use in-memory fallback

  try {
    // Fixed-window counter: bucket key changes every windowSecs
    const bucket = Math.floor(Date.now() / (windowSecs * 1000));
    const redisKey = `rl:${key}:${bucket}`;

    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, windowSecs * 2],
      ]),
    });

    if (!res.ok) {
      console.warn("[rate-limit] Upstash request failed, allowing through", res.status);
      return { allowed: true, retryAfterSecs: 0 }; // fail open
    }

    const [[, count]] = await res.json() as [[string, number], [string, number]];
    if (count > limit) {
      const bucketStartMs = bucket * windowSecs * 1000;
      const retryAfterSecs = Math.ceil((bucketStartMs + windowSecs * 1000 - Date.now()) / 1000);
      return { allowed: false, retryAfterSecs: Math.max(1, retryAfterSecs) };
    }

    return { allowed: true, retryAfterSecs: 0 };
  } catch (err) {
    console.warn("[rate-limit] Upstash error, allowing through:", err);
    return { allowed: true, retryAfterSecs: 0 }; // fail open
  }
}

export async function checkRateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 60_000
): Promise<{ allowed: boolean; retryAfterSecs: number }> {
  const windowSecs = Math.ceil(windowMs / 1000);

  // Try Upstash first
  const upstashResult = await checkUpstash(key, limit, windowSecs);
  if (upstashResult !== null) return upstashResult;

  // In-memory fallback (dev only — not shared across instances)
  const now = Date.now();
  const timestamps = (inMemoryStore.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    const retryAfterSecs = Math.ceil((timestamps[0] + windowMs - now) / 1000);
    return { allowed: false, retryAfterSecs };
  }

  timestamps.push(now);
  inMemoryStore.set(key, timestamps);
  return { allowed: true, retryAfterSecs: 0 };
}

export function getClientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip");
  if (realIp && /^[\d.:a-f]+$/.test(realIp)) return realIp;
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
