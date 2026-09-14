// Single source of truth for the cookies Flowline actually sets, shared by
// the Cookie Policy page and the cookie preferences dialog so the two never
// drift apart. Every cookie here is genuinely "strictly necessary" — Better
// Auth's session cookies (via the `nextCookies()` plugin, see src/lib/auth.ts)
// and the sidebar's own open/collapsed state. There are currently no
// optional (functional/analytics/marketing) cookies; if one is ever added,
// give it its own `category` here and both pages update automatically.
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

export const COOKIE_CATEGORIES: CookieCategoryInfo[] = [
  {
    key: 'strictly_necessary',
    label: 'Strictly necessary',
    description:
      "Required to keep you signed in and keep Flowline secure. Exempt from consent under the ePrivacy Directive and GDPR, so these can't be turned off while you use Flowline.",
    locked: true,
  },
]

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
    duration: '5 minutes',
    category: 'strictly_necessary',
  },
  {
    name: 'sidebar_state',
    purpose:
      'Remembers whether the app sidebar is expanded or collapsed. Only set once you are signed in and using the app.',
    duration: '7 days',
    category: 'strictly_necessary',
  },
]

export function cookiesByCategory(category: CookieCategoryKey): CookieCatalogEntry[] {
  return COOKIE_CATALOG.filter((c) => c.category === category)
}
