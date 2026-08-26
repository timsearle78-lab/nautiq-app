/**
 * Lightweight in-memory rate limiter.
 *
 * Each Vercel serverless function instance has its own memory, so this won't
 * coordinate across instances — but it meaningfully slows down single-IP
 * abuse and is zero-dependency. Entries are lazily evicted to avoid leaks.
 */

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

/** Remove stale entries to prevent unbounded memory growth. */
function evict() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

let evictTick = 0;

/**
 * Returns true if the request is allowed, false if it should be rejected.
 * @param key      Unique bucket key, e.g. `"waitlist:1.2.3.4"`
 * @param limit    Max requests allowed in the window
 * @param windowMs Window size in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  // Evict ~1 in every 100 calls to keep the map tidy without adding overhead.
  if (++evictTick % 100 === 0) evict();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}

/** Extract the real client IP from Next.js / Vercel request headers. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Convenience: build a 429 response. */
export function tooManyRequests(extra?: HeadersInit): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "60",
        ...extra,
      },
    }
  );
}
