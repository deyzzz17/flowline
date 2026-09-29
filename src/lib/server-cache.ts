// No 'server-only': Payload collection hooks (loaded by the Payload CLI in
// plain Node) invalidate these tags too.
import { unstable_cache, revalidateTag } from 'next/cache'

// Cross-request cache (Next.js data cache, shared by every function instance
// on Vercel) for small values that are read on almost every request but
// change rarely: a user's plan, their role in a workspace, whether a
// workspace is archived. React's `cache()` only dedupes within one render,
// so these used to cost a DB round trip on every single server action.
//
// Every write path that changes one of these calls the matching
// `invalidate*` below. The TTLs are only a safety net for a missed path —
// keep them short since some of these gate permissions.

export const cacheTags = {
  userPlan: (userId: string) => `user-plan:${userId}`,
  workspace: (workspaceId: string) => `workspace:${workspaceId}`,
  userWorkspaces: (userId: string) => `user-workspaces:${userId}`,
  /** A user's own data of one kind (see UserDataScope) — dashboard/analytics caches. */
  userData: (userId: string, scope: UserDataScope) => `user-data:${userId}:${scope}`,
}

/**
 * Kinds of per-user data the dashboard/analytics caches depend on. Each is
 * invalidated by Payload collection hooks whenever a document of that kind
 * belonging to the user changes (see payload.config.ts).
 */
export type UserDataScope = 'tasks' | 'habits' | 'timer' | 'calendar' | 'compliance'

/**
 * `unstable_cache` with a pass-through fallback: outside a Next.js request
 * (scripts, the Payload CLI) there is no data cache and it throws, in which
 * case the value is simply computed directly.
 */
export function cached<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
  keyPrefix: string,
  options: { tags: (...args: Args) => string[]; revalidate: number },
): (...args: Args) => Promise<R> {
  return async (...args: Args) => {
    try {
      return await unstable_cache(() => fn(...args), [keyPrefix, JSON.stringify(args)], {
        tags: options.tags(...args),
        revalidate: options.revalidate,
      })()
    } catch (e) {
      if (e instanceof Error && /incrementalCache|static generation store/i.test(e.message)) {
        return fn(...args)
      }
      throw e
    }
  }
}

/** Today's date (UTC) — part of every per-user cache key, so "today"-relative results roll over daily. */
function utcDayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Caches the result of a dashboard/analytics computation for one user
 * across requests. Invalidated when any of `scopes` changes for that user,
 * or their plan changes (analytics history windows depend on it); the key
 * also includes the current day. `fn` must not read the session/cookies/
 * headers — pass it the userId.
 */
export async function cacheForUser<T>(
  userId: string,
  scopes: UserDataScope[],
  keyParts: unknown[],
  fn: () => Promise<T>,
  revalidate = 15 * 60,
): Promise<T> {
  const key = ['user-data', userId, ...scopes, utcDayKey(), JSON.stringify(keyParts)]
  const tags = [...scopes.map((s) => cacheTags.userData(userId, s)), cacheTags.userPlan(userId)]
  try {
    return await unstable_cache(fn, key, { tags, revalidate })()
  } catch (e) {
    if (e instanceof Error && /incrementalCache|static generation store/i.test(e.message)) {
      return fn()
    }
    throw e
  }
}

function safeRevalidateTag(tag: string) {
  try {
    revalidateTag(tag)
  } catch {
    // Outside a Next.js request — nothing cached to invalidate there.
  }
}

export function invalidateUserPlan(userId: string) {
  safeRevalidateTag(cacheTags.userPlan(userId))
}

/** Membership, roles, custom roles or archive state of a workspace changed. */
export function invalidateWorkspace(workspaceId: string) {
  safeRevalidateTag(cacheTags.workspace(workspaceId))
}

/** The set of workspaces a user belongs to changed (joined, left, removed). */
export function invalidateUserWorkspaces(userId: string) {
  safeRevalidateTag(cacheTags.userWorkspaces(userId))
}

/** Some of this user's data of the given kind changed. */
export function invalidateUserData(userId: string, scope: UserDataScope) {
  safeRevalidateTag(cacheTags.userData(userId, scope))
}
