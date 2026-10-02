// Single source of truth for the cookies (and browser storage) Flowline
// actually uses, listed on the Cookie Policy page. Every entry here is
// genuinely "strictly necessary" or a plain UI preference — Better Auth's
// cookies (via the `nextCookies()` plugin, see src/lib/auth.ts), Payload's
// admin-panel cookie, and the app's own small cookies/storage keys. There are
// currently no optional (analytics/marketing) cookies, which is why the
// consent banner only offers "Essential only" / "Accept all"; if one is ever
// added, give it its own `category` here and revisit the banner.
//
// When adding a cookie or a localStorage/sessionStorage key anywhere in the
// app, add it here too so the policy stays accurate.
export type CookieCategoryKey = 'strictly_necessary'

export interface CookieCategoryInfo {
  key: CookieCategoryKey
  label: string
  description: string
  // Whether this category can be turned off. Every category today is
  // locked because every cookie in it is strictly necessary — kept as a
  // field (rather than hardcoding "always locked") so a future optional
  // category can flip this to false without restructuring the UI.
  locked: boolean
}

export interface CookieCatalogEntry {
  name: string
  purpose: string
  duration: string
  category: CookieCategoryKey
}

export interface StorageCatalogEntry {
  name: string
  purpose: string
  storage: 'Local storage' | 'Session storage'
  duration: string
}

export const COOKIE_CATEGORIES: CookieCategoryInfo[] = [
  {
    key: 'strictly_necessary',
    label: 'Strictly necessary',
    description:
      "Required to keep you signed in and keep Flowline secure. Exempt from consent under the ePrivacy Directive and GDPR, so these can't be turned off while you use Flowline.",
    locked: true,
  },
]

// Durations mirror the code: Better Auth's default 7-day session, the
// `cookieCache.maxAge` in auth.ts (10 min), its 5-min OAuth state cookie,
// `syncIfNeeded()` in api/tasks/actions.ts, SIDEBAR_COOKIE_MAX_AGE, and
// Payload's default 2-hour admin token.
export const COOKIE_CATALOG: CookieCatalogEntry[] = [
  {
    name: 'better-auth.session_token',
    purpose: 'Keeps you signed in to your account.',
    duration: '7 days',
    category: 'strictly_necessary',
  },
  {
    name: 'better-auth.session_data',
    purpose: 'Short-lived cache of your session, to avoid re-checking it on every request.',
    duration: '10 minutes',
    category: 'strictly_necessary',
  },
  {
    name: 'better-auth.state',
    purpose:
      'Protects "Continue with Google" sign-in against forged requests. Only set while you are signing in with Google.',
    duration: '5 minutes',
    category: 'strictly_necessary',
  },
  {
    name: 'tasks_last_sync',
    purpose:
      "Remembers that today's recurring tasks have already been prepared, so it only happens once a day.",
    duration: '24 hours',
    category: 'strictly_necessary',
  },
  {
    name: 'sidebar_state',
    purpose:
      'Remembers whether the app sidebar is expanded or collapsed. Only set once you are signed in and using the app.',
    duration: '7 days',
    category: 'strictly_necessary',
  },
  {
    name: 'payload-token',
    purpose:
      'Keeps Flowline staff signed in to the internal administration panel. Never set for regular users.',
    duration: '2 hours',
    category: 'strictly_necessary',
  },
]

export const STORAGE_CATALOG: StorageCatalogEntry[] = [
  {
    name: 'flowline_cookie_consent',
    purpose: 'Remembers your choice in the cookie banner.',
    storage: 'Local storage',
    duration: 'Until you clear it',
  },
  {
    name: 'theme',
    purpose: 'Remembers whether you use the light, dark, or system theme.',
    storage: 'Local storage',
    duration: 'Until you clear it',
  },
  {
    name: 'flowline-query-cache:*',
    purpose:
      'A copy of your recently loaded data so the app opens faster. Removed when you sign out.',
    storage: 'Local storage',
    duration: 'Up to 24 hours',
  },
  {
    name: 'flowline_timer',
    purpose: 'Keeps a running focus timer going if you reload or reopen the page.',
    storage: 'Local storage',
    duration: 'Until the session ends',
  },
  {
    name: 'notifications_read_ids, notifications_dismissed_ids, notifications_toasted_ids',
    purpose:
      'Remembers which notifications you have read, dismissed, or already been alerted about.',
    storage: 'Local storage',
    duration: 'Until you clear it',
  },
  {
    name: 'comments-seen-*',
    purpose: "Remembers when you last read a task's comments, to highlight new ones.",
    storage: 'Local storage',
    duration: 'Until you clear it',
  },
  {
    name: 'pending_timezone',
    purpose: "Your device's time zone, saved when you sign in with Google to set up your account.",
    storage: 'Local storage',
    duration: 'Until you clear it',
  },
  {
    name: 'flowline_verify_email_dismissed, newsletter_dismissed',
    purpose: 'Hides the email-verification and newsletter prompts once you dismiss them.',
    storage: 'Session storage',
    duration: 'Until you close the tab',
  },
]

export function cookiesByCategory(category: CookieCategoryKey): CookieCatalogEntry[] {
  return COOKIE_CATALOG.filter((c) => c.category === category)
}
