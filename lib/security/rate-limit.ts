type RateLimitEntry = {
  count: number
  resetAt: number
}

type RateLimitStore = Map<string, RateLimitEntry>

declare global {
  var __amgRateLimitStore: RateLimitStore | undefined
}

const store = globalThis.__amgRateLimitStore ?? new Map<string, RateLimitEntry>()

if (process.env.NODE_ENV !== "production") {
  globalThis.__amgRateLimitStore = store
}

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
) {
  const now = Date.now()
  const current = store.get(key)

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: Math.max(0, limit - 1), retryAfter: 0 }
  }

  current.count += 1
  store.set(key, current)

  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  }
}

export function clearRateLimit(key: string) {
  store.delete(key)
}
