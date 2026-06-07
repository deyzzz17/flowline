interface RateLimitEntry {
  count: number
  windowStart: number
}

const store = new Map<string, RateLimitEntry>()

if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now()
      for (const [key, entry] of store.entries()) {
        if (now - entry.windowStart > 10_000) {
          store.delete(key)
        }
      }
    },
    5 * 60 * 1000,
  )
}

export function checkRateLimit(key: string, limit: number, windowMs: number = 1000): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now })
    return true
  }

  if (entry.count >= limit) {
    return false
  }

  entry.count++
  return true
}
