'use server'

import 'server-only'
import { getPayload, type Where } from 'payload'
import config from '@/payload.config'
import { ok, err } from '@/types/result'
import { pool } from '@/lib/db-pool'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSession } from '@/lib/get-session'
import {
  getCurrentWorkspaceId,
  workspaceWhereClause,
  getEffectiveWorkspacePermissions,
  getWorkspaceRoleForUser,
} from '@/lib/get-current-workspace'
import { getUserPlanLimits } from '@/lib/get-user-plan'
import { isAtLimit, isPlanUnlimited, LIMIT_ERRORS, SAFETY_CAP_ERRORS } from '@/lib/plan-limits'
import { getTeamPermissions } from '@/api/teams/internal'
import { getMyTeamIds } from '@/lib/team-access'
import { countActiveCalendarCategories } from './internal'
import {
  CALENDAR_CATEGORY_NAME_TAKEN,
  NO_CATEGORY_EVENT_COLOR,
  normalizeCategoryName,
} from '@/lib/calendar-colors'

const getUserId = async () => {
  const session = await getSession()
  return session?.user?.id ?? null
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function toMidnight(iso: string): string {
  const d = new Date(iso)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).toISOString()
}

function getLocalKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export interface CalendarCategoryData {
  name: string
  color: string
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number
  daysOfWeek?: ('0' | '1' | '2' | '3' | '4' | '5' | '6')[]
  monthlyType?: 'dayOfMonth' | 'dayOfWeek'
  endType: 'never' | 'onDate' | 'afterCount'
  endDate?: string | null
  endCount?: number | null
}

export interface SeriesAdjustment {
  fromDate: string
  startDate?: string | null
  endDate?: string | null
  title?: string | null
  description?: string | null
  color?: string | null
  categoryId?: number | null
  allDay?: boolean | null
}

export interface CalendarEventData {
  title: string
  description?: string
  startDate: string
  endDate: string
  allDay?: boolean
  color?: string
  categoryId?: number | null
  /**
   * Optional team to scope this event to — visible to that team's members
   * instead of staying private to its creator. Only meaningful within the
   * Workspace Calendar; the global, cross-workspace Calendar never sets or
   * reads it.
   */
  teamId?: number | null
  /**
   * userIds of workspace members this event is assigned to (Workspace
   * Calendar only) — it then shows up in each of their own agendas. For a
   * team event, only that team's members.
   */
  assignedTo?: string[]
  /**
   * How the event affects its people's availability in the meeting
   * scheduler (Workspace Calendar). Defaults to busy.
   */
  showAs?: 'free' | 'tentative' | 'busy' | 'away'
  recurrence?: RecurrenceRule | null
  recurrenceId?: number | null
  originalDate?: string | null
  exceptions?: { date: string }[]
  adjustments?: SeriesAdjustment[]
}

export type EditScope = 'this' | 'thisAndFollowing' | 'all'

type ShowAs = NonNullable<CalendarEventData['showAs']>

// Availability status only means something in a workspace (meeting
// scheduler): workspace events default to busy, Personal events have none.
function showAsFor(workspaceId: string | null | undefined, showAs?: ShowAs | null) {
  return workspaceId ? (showAs ?? 'busy') : null
}

/**
 * 'global' aggregates data across all of the user's workspaces (the common
 * Calendar nav item); 'workspace' scopes it to the currently active workspace
 * (the Calendar nav item nested under Timer).
 */
export type CalendarScope = 'global' | 'workspace'

// Where a calendar category lives: a workspace's categories are shared by its
// members; Personal ones (no workspace) belong to their creator alone, so
// they must also be filtered by user — `workspaceWhereClause(null)` only
// says "no workspace" and would match every user's Personal categories.
function categoryScopeWhere(workspaceId: string | null, userId: string): Where {
  return workspaceId
    ? { workspace: { equals: workspaceId } }
    : { and: [{ workspace: { exists: false } }, { userId: { equals: userId } }] }
}

// Category names are unique (trimmed, case-insensitive) within one scope —
// a workspace, or a user's Personal calendar — but the same name can exist
// in different workspaces.
async function isCategoryNameTaken(
  payload: Awaited<ReturnType<typeof getPayload>>,
  workspaceId: string | null,
  userId: string,
  name: string,
  excludeId?: number,
): Promise<boolean> {
  const { docs } = await payload.find({
    collection: 'calendar-categories',
    where: {
      and: [
        categoryScopeWhere(workspaceId, userId),
        { planArchivedAt: { exists: false } },
        ...(excludeId !== undefined ? [{ id: { not_equals: excludeId } }] : []),
      ],
    },
    limit: 0,
    depth: 0,
    select: { name: true },
  })
  const wanted = normalizeCategoryName(name)
  return docs.some((d) => normalizeCategoryName(d.name) === wanted)
}

// An event's color is its category's color, or gray without one — never a
// free choice. The category must belong to the event's own scope.
async function resolveEventColor(
  payload: Awaited<ReturnType<typeof getPayload>>,
  categoryId: number | null | undefined,
  workspaceId: string | null,
  userId: string,
): Promise<string | null> {
  if (!categoryId) return NO_CATEGORY_EVENT_COLOR
  const category = await payload
    .findByID({ collection: 'calendar-categories', id: categoryId, depth: 0 })
    .catch(() => null)
  if (!category || (category.workspace ?? null) !== workspaceId) return null
  if (!workspaceId && category.userId !== userId) return null
  return category.color
}

const DEFAULT_CALENDAR_CATEGORIES = [
  { name: 'Personal', color: '#8b5cf6', isDefault: true },
  { name: 'Work', color: '#3b82f6', isDefault: true },
  { name: 'Health', color: '#10b981', isDefault: true },
]

export const listCalendarCategories = async (scope: CalendarScope = 'workspace') => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }
  const payload = await getPayload({ config })

  if (scope === 'global') {
    return payload.find({
      collection: 'calendar-categories',
      where: {
        and: [{ userId: { equals: userId } }, { planArchivedAt: { exists: false } }],
      },
      limit: 0,
      sort: 'createdAt',
    })
  }

  const workspaceId = await getCurrentWorkspaceId()
  const existing = await payload.find({
    collection: 'calendar-categories',
    where: {
      and: [categoryScopeWhere(workspaceId, userId), { planArchivedAt: { exists: false } }],
    },
    limit: 0,
    sort: 'createdAt',
  })

  // Only the Personal workspace gets seeded with default categories — other
  // workspaces start empty (no data on creation).
  if (existing.docs.length === 0 && workspaceId === null) {
    for (const cat of DEFAULT_CALENDAR_CATEGORIES) {
      await payload.create({
        collection: 'calendar-categories',
        data: { ...cat, userId, workspace: workspaceId },
      })
    }
    return payload.find({
      collection: 'calendar-categories',
      where: {
        and: [categoryScopeWhere(workspaceId, userId), { planArchivedAt: { exists: false } }],
      },
      limit: 0,
      sort: 'createdAt',
    })
  }

  const visible = await filterVisibleCategories(payload, existing.docs, workspaceId, userId)
  return { ...existing, docs: visible }
}

// Team-scoped categories are only visible to that team's own members — the
// query above matches on workspace alone (Payload can't filter "team is
// null or one of these ids" in one relationship where clause), so narrow it
// down here. A workspace-wide category (no team) stays visible to everyone.
// The workspace's real owner/admin (not a custom role's derived tier — see
// deriveBetterAuthRole) still sees every team's categories too, same as
// they do for lists.
async function filterVisibleCategories<T extends { team?: unknown }>(
  payload: Awaited<ReturnType<typeof getPayload>>,
  docs: T[],
  workspaceId: string | null,
  userId: string,
): Promise<T[]> {
  if (!workspaceId) return docs
  const hasTeamScoped = docs.some((d) => !!d.team)
  if (!hasTeamScoped) return docs

  const effective = await getEffectiveWorkspacePermissions(workspaceId, userId)
  const isPlainOwnerOrAdmin =
    (effective.role === 'owner' || effective.role === 'admin') && effective.customRoleName === null
  if (isPlainOwnerOrAdmin) return docs

  const myTeamIds = new Set(await getMyTeamIds(payload, workspaceId, userId))
  return docs.filter((d) => {
    if (!d.team) return true
    const teamId = typeof d.team === 'object' ? (d.team as { id?: number })?.id : d.team
    return typeof teamId === 'number' && myTeamIds.has(teamId)
  })
}

export const createCalendarCategory = async (
  data: CalendarCategoryData,
  teamId?: number | null,
) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const workspaceId = await getCurrentWorkspaceId()

    const permissions = await getEffectiveWorkspacePermissions(workspaceId, userId)
    if (!permissions.canManageCalendar) return err('Not authorized')

    const { plan, limits } = await getUserPlanLimits()
    const totalDocs = await countActiveCalendarCategories(payload, userId)
    if (isAtLimit(totalDocs, limits.calendarCategories)) {
      return err(
        isPlanUnlimited(plan, 'calendarCategories')
          ? SAFETY_CAP_ERRORS.CALENDAR_CATEGORIES_CAP
          : LIMIT_ERRORS.CALENDAR_CATEGORIES_LIMIT,
      )
    }

    if (teamId) {
      const team = await payload.findByID({ collection: 'teams', id: teamId }).catch(() => null)
      if (!team || team.workspace !== workspaceId || team.planArchivedAt) {
        return err('Team not found')
      }
      const teamPermissions = await getTeamPermissions(teamId, userId)
      if (!teamPermissions.canManageCalendar) return err('Not authorized')
    }

    const name = data.name.trim()
    if (!name) return err('Name is required')
    if (await isCategoryNameTaken(payload, workspaceId, userId, name)) {
      return err(CALENDAR_CATEGORY_NAME_TAKEN)
    }

    return ok(
      await payload.create({
        collection: 'calendar-categories',
        data: {
          ...data,
          name,
          userId,
          workspace: workspaceId,
          ...(teamId && { team: teamId }),
          isDefault: false,
        },
      }),
    )
  } catch {
    return err('Error creating category')
  }
}

export const checkCalendarCategoriesCompliance = async () => {
  const userId = await getUserId()
  if (!userId) return null

  const payload = await getPayload({ config })
  const { limits } = await getUserPlanLimits()

  const { docs: activeCategories, totalDocs } = await payload.find({
    collection: 'calendar-categories',
    sort: 'createdAt',
    limit: 0,
    where: {
      and: [{ userId: { equals: userId } }, { planArchivedAt: { exists: false } }],
    },
  })

  if (totalDocs <= limits.calendarCategories) return null

  return {
    overBy: totalDocs - limits.calendarCategories,
    limit: limits.calendarCategories,
    categories: activeCategories,
  }
}

export const chooseCalendarCategoriesToKeep = async (keepIds: number[]) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const { limits } = await getUserPlanLimits()

    if (keepIds.length > limits.calendarCategories) {
      return err('TOO_MANY_SELECTED')
    }

    const { docs: activeCategories } = await payload.find({
      collection: 'calendar-categories',
      where: {
        and: [{ userId: { equals: userId } }, { planArchivedAt: { exists: false } }],
      },
      limit: 0,
    })

    const keepSet = new Set(keepIds)
    const toArchive = activeCategories.filter((c) => !keepSet.has(c.id))

    const now = new Date().toISOString()
    for (const category of toArchive) {
      if ((category as any).userId !== userId) continue
      await payload.update({
        collection: 'calendar-categories',
        id: category.id,
        data: { planArchivedAt: now } as any,
      })
    }

    return ok(true)
  } catch {
    return err('Error while archiving categories')
  }
}

export const restoreArchivedCalendarCategory = async (id: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const category = await payload.findByID({ collection: 'calendar-categories', id })
    if (!category || (category as any).userId !== userId) return err('Not authorized')
    if (!(category as any).planArchivedAt) return err('Category is not archived')

    const { limits } = await getUserPlanLimits()
    const currentCount = await countActiveCalendarCategories(payload, userId)

    if (isAtLimit(currentCount, limits.calendarCategories)) {
      return err('LIMIT_FULL')
    }

    if (
      await isCategoryNameTaken(payload, (category as any).workspace ?? null, userId, category.name)
    ) {
      return err(CALENDAR_CATEGORY_NAME_TAKEN)
    }

    await payload.update({
      collection: 'calendar-categories',
      id,
      data: { planArchivedAt: null } as any,
    })

    return ok(true)
  } catch {
    return err('Error while restoring the category')
  }
}

export const listPlanArchivedCalendarCategories = async () => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }

  const payload = await getPayload({ config })
  return await payload.find({
    collection: 'calendar-categories',
    sort: '-planArchivedAt',
    limit: 0,
    where: {
      and: [{ userId: { equals: userId } }, { planArchivedAt: { exists: true } }],
    },
  })
}

export const updateCalendarCategory = async (id: number, data: Partial<CalendarCategoryData>) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const category = await payload.findByID({ collection: 'calendar-categories', id })
    if ((category as any).userId !== userId) return err('Not authorized')

    const workspaceId = (category as any).workspace ?? null
    const permissions = await getEffectiveWorkspacePermissions(workspaceId, userId)
    if (!permissions.canManageCalendar) return err('Not authorized')

    if (data.name !== undefined) {
      const name = data.name.trim()
      if (!name) return err('Name is required')
      if (await isCategoryNameTaken(payload, workspaceId, userId, name, id)) {
        return err(CALENDAR_CATEGORY_NAME_TAKEN)
      }
      data = { ...data, name }
    }

    const updated = await payload.update({ collection: 'calendar-categories', id, data })

    // Events store their category's color (see resolveEventColor) — keep
    // every event of this category in sync, series adjustments included.
    if (data.color !== undefined && data.color !== category.color) {
      await pool.query('UPDATE "calendar_events" SET "color" = $1 WHERE "category_id" = $2', [
        data.color,
        id,
      ])
      await pool.query(
        'UPDATE "calendar_events_adjustments" SET "color" = $1 WHERE "category_id" = $2',
        [data.color, id],
      )
    }

    return ok(updated)
  } catch {
    return err('Error updating category')
  }
}

export const deleteCalendarCategory = async (id: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })

    const category = await payload.findByID({ collection: 'calendar-categories', id })
    const workspaceId = (category as any).workspace ?? null

    if (workspaceId === null) {
      if ((category as any).userId !== userId) return err('Not authorized')
    } else {
      // Inside a workspace, deleting a category is owner/admin territory
      // regardless of who created it — editors can't delete any category,
      // even one of their own.
      const permissions = await getEffectiveWorkspacePermissions(workspaceId, userId)
      if (!permissions.role) return err('Not authorized')
      if (!permissions.canDeleteCalendarCategories) {
        return err('Only the workspace owner or an admin can delete calendar categories.')
      }
    }

    const { docs: relatedEvents } = await payload.find({
      collection: 'calendar-events',
      where: {
        and: [{ userId: { equals: userId } }, { categoryId: { equals: id } }],
      },
      limit: 0,
    })

    for (const event of relatedEvents) {
      await payload.delete({ collection: 'calendar-events', id: event.id })
    }

    await payload.delete({ collection: 'calendar-categories', id })

    return ok(true)
  } catch {
    return err('Error deleting category')
  }
}

async function getGoogleAccessToken(userId: string): Promise<string | null> {
  const result = await pool.query(
    `SELECT "accessToken", "accessTokenExpiresAt", "refreshToken"
     FROM account WHERE "userId" = $1 AND "providerId" = 'google' LIMIT 1`,
    [userId],
  )
  if (result.rows.length === 0) return null
  const account = result.rows[0]
  if (account.accessTokenExpiresAt && new Date(account.accessTokenExpiresAt) < new Date()) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: account.refreshToken,
        grant_type: 'refresh_token',
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString()
    await pool.query(
      `UPDATE account SET "accessToken" = $1, "accessTokenExpiresAt" = $2 WHERE "userId" = $3 AND "providerId" = 'google'`,
      [data.access_token, expiresAt, userId],
    )
    return data.access_token
  }
  return account.accessToken
}

async function fetchGoogleCalendarEvents(
  userId: string,
  from: string,
  to: string,
  payload: any,
): Promise<any[]> {
  try {
    const { docs: syncs } = await payload.find({
      collection: 'google-calendar-syncs',
      where: { and: [{ userId: { equals: userId } }, { status: { equals: 'connected' } }] },
      limit: 1,
    })
    if (syncs.length === 0) return []

    const sync = syncs[0] as any
    const accessToken = await getGoogleAccessToken(userId)
    if (!accessToken) return []

    try {
      const calListRes = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        { headers: { Authorization: `Bearer ${accessToken}` } },
      )
      if (calListRes.ok) {
        const calListData = await calListRes.json()
        const freshCalendars = (calListData.items ?? []).map((cal: any) => {
          const existing = (sync.calendars ?? []).find((c: any) => c.googleId === cal.id)
          return {
            googleId: cal.id,
            name: cal.summary,
            color: cal.backgroundColor ?? '#4285f4',
            primary: cal.primary ?? false,
            enabled: existing ? existing.enabled : true,
          }
        })
        const currentIds = (sync.calendars ?? [])
          .map((c: any) => c.googleId)
          .sort()
          .join(',')
        const freshIds = freshCalendars
          .map((c: any) => c.googleId)
          .sort()
          .join(',')
        if (currentIds !== freshIds) {
          await payload.update({
            collection: 'google-calendar-syncs',
            id: sync.id,
            data: { calendars: freshCalendars } as any,
          })
          sync.calendars = freshCalendars
        }
      }
    } catch {}

    const enabledCalendars = (sync.calendars ?? []).filter((c: any) => c.enabled)
    if (enabledCalendars.length === 0) return []

    const allEvents: any[] = []
    await Promise.all(
      enabledCalendars.map(async (cal: any) => {
        try {
          const url = new URL(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.googleId)}/events`,
          )
          url.searchParams.set('singleEvents', 'true')
          url.searchParams.set('maxResults', '500')
          url.searchParams.set('timeMin', from)
          url.searchParams.set('timeMax', to)
          url.searchParams.set('orderBy', 'startTime')
          const res = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          if (!res.ok) return
          const data = await res.json()
          for (const gEvent of data.items ?? []) {
            if (gEvent.status === 'cancelled' || !gEvent.start) continue
            const allDay = !gEvent.start.dateTime
            const startDate = gEvent.start.dateTime
              ? new Date(gEvent.start.dateTime).toISOString()
              : new Date(gEvent.start.date + 'T00:00:00').toISOString()
            const endDate = gEvent.end?.dateTime
              ? new Date(gEvent.end.dateTime).toISOString()
              : gEvent.end?.date
                ? new Date(gEvent.end.date + 'T00:00:00').toISOString()
                : startDate
            allEvents.push({
              id: `google-${gEvent.id}`,
              title: gEvent.summary ?? '(no title)',
              description: gEvent.description ?? undefined,
              startDate,
              endDate,
              allDay,
              color: cal.color ?? '#4285f4',
              source: 'google',
              googleEventId: gEvent.id,
              googleCalendarId: cal.googleId,
              googleCalendarName: cal.name,
              recurrence: null,
              recurrenceId: null,
              originalDate: null,
              exceptions: [],
              adjustments: [],
              categoryId: null,
            })
          }
        } catch (e) {
          console.error(`Error fetching calendar ${cal.googleId}:`, e)
        }
      }),
    )
    return allEvents
  } catch (e) {
    console.error('Error fetching Google Calendar events:', e)
    return []
  }
}

/** Which Workspace Calendar to show: the viewer's own agenda, or one team's calendar. */
export type WorkspaceCalendarSelection = 'mine' | { teamId: number }

function teamIdOf(team: unknown): number | null {
  if (team && typeof team === 'object') return (team as { id: number }).id
  return typeof team === 'number' ? team : null
}

/** Ids of the events assigned to a user (assignedTo lives in calendar_events_texts). */
/**
 * Events that belong in the user's own agenda because they're on them:
 * assigned to the user, except meeting invitations they haven't answered
 * yet (an accepted one counts; a declined one already removed them).
 */
async function getMyAgendaEventIds(userId: string): Promise<number[]> {
  const { rows } = await pool.query<{ parent_id: number }>(
    `SELECT DISTINCT t.parent_id FROM calendar_events_texts t
      WHERE t.path = 'assignedTo' AND t.text = $1
        AND NOT EXISTS (
          SELECT 1 FROM calendar_event_invitations i
           WHERE i.event_id = t.parent_id AND i.user_id = $1 AND i.status = 'pending'
        )`,
    [userId],
  )
  return rows.map((r) => r.parent_id)
}

/** Workspaces the user is currently a member of (archived ones left out). */
async function getMyActiveWorkspaceIds(userId: string): Promise<string[]> {
  const { rows } = await pool.query<{ organizationId: string }>(
    `SELECT m."organizationId" FROM member m
      WHERE m."userId" = $1
        AND NOT EXISTS (SELECT 1 FROM workspace_archive wa WHERE wa.organization_id = m."organizationId")`,
    [userId],
  )
  return rows.map((r) => r.organizationId)
}

/** The people a team's events can be assigned to: its members plus its creator. */
async function getTeamMemberUserIds(
  payload: Awaited<ReturnType<typeof getPayload>>,
  teamId: number,
): Promise<Set<string>> {
  const [{ docs }, team] = await Promise.all([
    payload.find({
      collection: 'team-members',
      where: { team: { equals: teamId } },
      limit: 0,
      depth: 0,
      pagination: false,
    }),
    payload.findByID({ collection: 'teams', id: teamId, depth: 0 }).catch(() => null),
  ])
  const ids = new Set(docs.map((d) => d.userId as string))
  if (team?.createdBy) ids.add(team.createdBy)
  return ids
}

/**
 * Validates an event's assignees: members of the workspace, or — for a team
 * event — of that team. Returns the de-duplicated list, or null if anyone
 * isn't allowed. Personal has no members, so nothing can be assigned there.
 */
async function resolveAssignees(
  payload: Awaited<ReturnType<typeof getPayload>>,
  workspaceId: string | null,
  teamId: number | null,
  userIds: string[] | undefined,
): Promise<string[] | null> {
  const unique = [...new Set(userIds ?? [])]
  if (unique.length === 0 || !workspaceId) return []
  if (teamId) {
    const allowed = await getTeamMemberUserIds(payload, teamId)
    return unique.every((id) => allowed.has(id)) ? unique : null
  }
  const { rows } = await pool.query<{ userId: string }>(
    `SELECT "userId" FROM member WHERE "organizationId" = $1 AND "userId" = ANY($2)`,
    [workspaceId, unique],
  )
  return rows.length === unique.length ? unique : null
}

const INVALID_ASSIGNEES = 'Some assignees are not members of this workspace or team'

export const listFlowlineCalendarEvents = async (
  from: string,
  to: string,
  scope: CalendarScope = 'workspace',
  calendar: WorkspaceCalendarSelection = 'mine',
) => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }
  const payload = await getPayload({ config })

  const dateFilter: Where = {
    or: [
      { and: [{ recurrenceId: { exists: false } }, { startDate: { less_than_equal: to } }] },
      { and: [{ recurrenceId: { exists: true } }, { startDate: { less_than_equal: to } }] },
    ],
  }

  const findEvents = async (visibility: Where) => {
    const { docs } = await payload.find({
      collection: 'calendar-events',
      limit: 500,
      sort: 'startDate',
      where: { and: [visibility, dateFilter] },
    })
    // A recurring series' modified occurrences are separate documents that
    // may not match the visibility rule themselves (created before they
    // inherited the series' team/assignees) — without them those
    // occurrences would vanish, since the series lists them as exceptions.
    const parentIds = docs
      .filter((d) => d.recurrence?.frequency && !d.recurrenceId)
      .map((d) => d.id)
    if (parentIds.length === 0) return docs
    const known = new Set(docs.map((d) => d.id))
    const { docs: overrides } = await payload.find({
      collection: 'calendar-events',
      limit: 500,
      where: { and: [{ recurrenceId: { in: parentIds } }, dateFilter] },
    })
    return [...docs, ...overrides.filter((o) => !known.has(o.id))]
  }

  // The global, cross-workspace Calendar: everything that is in the user's
  // own agenda of every workspace they belong to (see below), plus all of
  // their own events (Personal included).
  if (scope === 'global') {
    const [agendaIds, workspaceIds] = await Promise.all([
      getMyAgendaEventIds(userId),
      getMyActiveWorkspaceIds(userId),
    ])
    const visibilityOr: Where[] = [{ userId: { equals: userId } }]
    if (agendaIds.length > 0 && workspaceIds.length > 0) {
      visibilityOr.push({
        and: [{ id: { in: agendaIds } }, { workspace: { in: workspaceIds } }],
      })
    }
    return { docs: await findEvents({ or: visibilityOr }) }
  }

  const workspaceId = await getCurrentWorkspaceId()

  // One team's calendar: every event of that team. Readable by any member of
  // the workspace (not only the team's own members).
  if (workspaceId && calendar !== 'mine') {
    const team = await payload
      .findByID({ collection: 'teams', id: calendar.teamId, depth: 0 })
      .catch(() => null)
    if (!team || team.workspace !== workspaceId || team.planArchivedAt) return { docs: [] }
    if (!(await getWorkspaceRoleForUser(workspaceId, userId))) return { docs: [] }
    return {
      docs: await findEvents({
        and: [
          workspaceWhereClause(workspaceId),
          { or: [{ team: { equals: calendar.teamId } }, { teams: { in: [calendar.teamId] } }] },
        ],
      }),
    }
  }

  // The viewer's own agenda: every event they created (team events
  // included), plus every event they're on — assigned, or an accepted
  // meeting invitation. A team event they're not on only appears in that
  // team's calendar.
  const agendaIds = workspaceId ? await getMyAgendaEventIds(userId) : []
  const visibilityOr: Where[] = [{ userId: { equals: userId } }]
  if (agendaIds.length > 0) visibilityOr.push({ id: { in: agendaIds } })
  return {
    docs: await findEvents({ and: [workspaceWhereClause(workspaceId), { or: visibilityOr }] }),
  }
}

export const listGoogleCalendarEvents = async (
  from: string,
  to: string,
  scope: CalendarScope = 'workspace',
) => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }
  const payload = await getPayload({ config })

  // Google Calendar is only connected on the Personal workspace for now. The
  // global (all-workspaces) view still includes it since Personal is one of
  // the aggregated workspaces; the workspace-scoped view only includes it
  // when Personal itself is the active workspace.
  if (scope === 'workspace') {
    const workspaceId = await getCurrentWorkspaceId()
    if (workspaceId !== null) return { docs: [] }
  }

  const docs = await fetchGoogleCalendarEvents(userId, from, to, payload)
  return { docs }
}

export const createCalendarEvent = async (data: CalendarEventData) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    if (!checkRateLimit(`create-event:${userId}`, 1, 1000)) {
      return err('Too many requests. Please wait a moment.')
    }

    const payload = await getPayload({ config })
    const workspaceId = await getCurrentWorkspaceId()

    const permissions = await getEffectiveWorkspacePermissions(workspaceId, userId)
    if (!permissions.canManageCalendar) return err('Not authorized')

    if (data.teamId) {
      if (!workspaceId) return err('Team not found')
      const team = await payload
        .findByID({ collection: 'teams', id: data.teamId })
        .catch(() => null)
      if (!team || team.workspace !== workspaceId || team.planArchivedAt) {
        return err('Team not found')
      }
      const teamPermissions = await getTeamPermissions(data.teamId, userId)
      if (!teamPermissions.canManageCalendar) return err('Not authorized')
    }

    const assignedTo = await resolveAssignees(
      payload,
      workspaceId,
      data.teamId ?? null,
      data.assignedTo,
    )
    if (!assignedTo) return err(INVALID_ASSIGNEES)

    const color = await resolveEventColor(payload, data.categoryId, workspaceId, userId)
    if (!color) return err('Category not found')

    const event = await payload.create({
      collection: 'calendar-events',
      data: {
        userId,
        workspace: workspaceId,
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        allDay: data.allDay ?? false,
        color,
        categoryId: data.categoryId ?? null,
        ...(data.teamId && { team: data.teamId }),
        assignedTo,
        showAs: showAsFor(workspaceId, data.showAs),
        ...(data.recurrence ? { recurrence: data.recurrence as any } : {}),
        ...(data.recurrenceId ? { recurrenceId: data.recurrenceId } : {}),
        ...(data.originalDate ? { originalDate: data.originalDate } : {}),
      },
    })
    return ok(event)
  } catch (e) {
    console.error(e)
    return err('Error creating event')
  }
}

// A team-scoped event is governed by that team's own canManageCalendar
// permission — even for someone who is otherwise the workspace owner/admin,
// same precedence as everywhere else team access overrides a blanket
// workspace-tier permission (see getTeamPermissionsForUser). A non-team
// event falls back to the plain workspace-level check, as before.
async function canManageCalendarEvent(
  existing: {
    workspace?: string | null
    team?: number | { id: number } | null
    teams?: (number | { id: number })[] | null
    userId?: string
  },
  userId: string,
): Promise<boolean> {
  // A scheduled meeting linked to several teams: its organizer, or anyone
  // allowed to manage the calendar of one of those teams.
  const linkedTeams = (existing.teams ?? []).map((t) => teamIdOf(t)).filter((id) => id !== null)
  if (linkedTeams.length > 0) {
    if (existing.userId === userId) return true
    for (const id of linkedTeams) {
      if ((await getTeamPermissions(id, userId)).canManageCalendar) return true
    }
    return false
  }
  const teamId = typeof existing.team === 'object' ? existing.team?.id : existing.team
  if (teamId) {
    const teamPermissions = await getTeamPermissions(teamId, userId)
    return teamPermissions.canManageCalendar
  }
  const permissions = await getEffectiveWorkspacePermissions(existing.workspace ?? null, userId)
  return permissions.canManageCalendar
}

export const updateCalendarEvent = async (
  id: number,
  data: Partial<CalendarEventData>,
  scope: EditScope = 'all',
  originalOccurrenceDate?: string,
) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const existing = await payload.findByID({ collection: 'calendar-events', id })

    if (!(await canManageCalendarEvent(existing as any, userId))) return err('Not authorized')

    // The color follows the category (gray without one): a client-sent color
    // is ignored, and changing the category recomputes it.
    const { color: _ignoredColor, ...rest } = data
    data = rest
    if (data.categoryId !== undefined) {
      const color = await resolveEventColor(
        payload,
        data.categoryId,
        existing.workspace ?? null,
        existing.userId,
      )
      if (!color) return err('Category not found')
      data = { ...data, color }
    }
    // Personal events never carry an availability status.
    if (!existing.workspace) {
      const { showAs: _ignoredShowAs, ...withoutShowAs } = data
      data = withoutShowAs
    }

    // Assignees belong to the whole event (series included), whatever the
    // edit scope — validated against the event's own workspace/team.
    let assignedTo: string[] | undefined
    if (data.assignedTo !== undefined) {
      const resolved = await resolveAssignees(
        payload,
        existing.workspace ?? null,
        teamIdOf(existing.team),
        data.assignedTo,
      )
      if (!resolved) return err(INVALID_ASSIGNEES)
      assignedTo = resolved
    }

    const isRecurring = !!(existing as any).recurrence?.frequency
    const isOverride = !!(existing as any).recurrenceId

    if (!isRecurring && !isOverride) {
      const updated = await payload.update({
        collection: 'calendar-events',
        id,
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.startDate !== undefined && { startDate: data.startDate }),
          ...(data.endDate !== undefined && { endDate: data.endDate }),
          ...(data.allDay !== undefined && { allDay: data.allDay }),
          ...(data.color !== undefined && { color: data.color }),
          ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
          ...(data.recurrence !== undefined && {
            recurrence: (data.recurrence as any) ?? undefined,
          }),
          ...(assignedTo !== undefined && { assignedTo }),
          ...(data.showAs !== undefined && { showAs: data.showAs }),
        },
      })
      return ok(updated)
    }

    const parentId = isOverride ? (existing as any).recurrenceId : id
    // Assignees and availability status belong to the whole series.
    if (assignedTo !== undefined || data.showAs !== undefined) {
      await payload.update({
        collection: 'calendar-events',
        where: { or: [{ id: { equals: parentId } }, { recurrenceId: { equals: parentId } }] },
        data: {
          ...(assignedTo !== undefined && { assignedTo }),
          ...(data.showAs !== undefined && { showAs: data.showAs }),
        },
      })
    }
    const parent = await payload.findByID({ collection: 'calendar-events', id: parentId })
    const parentStart = new Date(parent.startDate)
    const parentEnd = new Date(parent.endDate)
    const parentRecurrence = (parent as any).recurrence ?? {}
    const occDate = originalOccurrenceDate ?? data.startDate ?? existing.startDate

    if (scope === 'all') {
      const originalDuration = parentEnd.getTime() - parentStart.getTime()

      const updateData: any = {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.allDay !== undefined && { allDay: data.allDay }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        exceptions: [],
        adjustments: [],
        recurrence: data.recurrence
          ? (data.recurrence as any)
          : ({ ...parentRecurrence, endType: 'never', endDate: null, endCount: null } as any),
      }

      if (data.startDate) {
        const newOccStart = new Date(data.startDate)
        updateData.startDate = new Date(
          parentStart.getFullYear(),
          parentStart.getMonth(),
          parentStart.getDate(),
          newOccStart.getHours(),
          newOccStart.getMinutes(),
          0,
          0,
        ).toISOString()

        if (data.endDate) {
          const newDuration = new Date(data.endDate).getTime() - new Date(data.startDate).getTime()
          updateData.endDate = new Date(
            new Date(updateData.startDate).getTime() + newDuration,
          ).toISOString()
        } else {
          updateData.endDate = new Date(
            new Date(updateData.startDate).getTime() + originalDuration,
          ).toISOString()
        }
      } else if (data.endDate) {
        const occStartDate = new Date(
          new Date(occDate).getFullYear(),
          new Date(occDate).getMonth(),
          new Date(occDate).getDate(),
          parentStart.getHours(),
          parentStart.getMinutes(),
          0,
          0,
        )
        const newDuration = new Date(data.endDate).getTime() - occStartDate.getTime()
        updateData.endDate = new Date(parentStart.getTime() + newDuration).toISOString()
      }

      const { docs: allOverrides } = await payload.find({
        collection: 'calendar-events',
        where: { recurrenceId: { equals: parentId } },
        limit: 500,
      })
      for (const o of allOverrides) {
        await payload.delete({ collection: 'calendar-events', id: o.id })
      }

      const updated = await payload.update({
        collection: 'calendar-events',
        id: parentId,
        data: updateData,
      })
      return ok(updated)
    }

    if (scope === 'this') {
      const exceptions = ((parent as any).exceptions ?? []) as { date: string }[]
      const occDateKey = getLocalKey(occDate)

      if (!exceptions.find((e) => getLocalKey(e.date) === occDateKey)) {
        await payload.update({
          collection: 'calendar-events',
          id: parentId,
          data: { exceptions: [...exceptions, { date: occDate }] as any },
        })
      }

      if (isOverride) {
        const updated = await payload.update({
          collection: 'calendar-events',
          id,
          data: {
            ...(data.title !== undefined && { title: data.title }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.startDate !== undefined && { startDate: data.startDate }),
            ...(data.endDate !== undefined && { endDate: data.endDate }),
            ...(data.allDay !== undefined && { allDay: data.allDay }),
            ...(data.color !== undefined && { color: data.color }),
            ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
          },
        })
        return ok(updated)
      } else {
        const occStartTime = new Date(
          new Date(occDate).getFullYear(),
          new Date(occDate).getMonth(),
          new Date(occDate).getDate(),
          parentStart.getHours(),
          parentStart.getMinutes(),
          0,
          0,
        )

        const newStart = data.startDate ?? occStartTime.toISOString()

        let newEnd: string
        if (data.endDate && data.startDate) {
          const newDuration = new Date(data.endDate).getTime() - new Date(data.startDate).getTime()
          newEnd = new Date(new Date(newStart).getTime() + newDuration).toISOString()
        } else if (data.endDate) {
          newEnd = data.endDate
        } else {
          const originalDuration = parentEnd.getTime() - parentStart.getTime()
          newEnd = new Date(new Date(newStart).getTime() + originalDuration).toISOString()
        }

        const parentWorkspace = (parent as any).workspace ?? null

        const created = await payload.create({
          collection: 'calendar-events',
          data: {
            userId,
            workspace: parentWorkspace,
            title: data.title ?? existing.title,
            description: data.description ?? (existing as any).description ?? undefined,
            startDate: newStart,
            endDate: newEnd,
            allDay: data.allDay ?? existing.allDay ?? false,
            color: data.color ?? existing.color ?? '#8b5cf6',
            ...(data.categoryId !== undefined
              ? { categoryId: data.categoryId }
              : (existing as any).categoryId
                ? { categoryId: (existing as any).categoryId }
                : {}),
            // A modified occurrence stays part of the series' team and keeps
            // its assignees, so it stays visible to the same people.
            ...(teamIdOf((parent as any).team) ? { team: teamIdOf((parent as any).team)! } : {}),
            assignedTo: assignedTo ?? (((parent as any).assignedTo ?? []) as string[]),
            ...(((parent as any).teams ?? []).length > 0 && {
              teams: ((parent as any).teams as unknown[]).map((t) => teamIdOf(t)!),
            }),
            showAs: showAsFor(parent.workspace, data.showAs ?? (parent as any).showAs),
            recurrenceId: parentId,
            originalDate: occDate,
          },
        })
        return ok(created)
      }
    }

    if (scope === 'thisAndFollowing') {
      const occDateTime = new Date(occDate)

      const { docs: futureOverrides } = await payload.find({
        collection: 'calendar-events',
        where: {
          and: [
            { recurrenceId: { equals: parentId } },
            { startDate: { greater_than_equal: toMidnight(occDate) } },
          ],
        },
        limit: 500,
      })
      for (const o of futureOverrides) {
        await payload.delete({ collection: 'calendar-events', id: o.id })
      }

      let newStart: string
      let newEnd: string

      if (data.startDate) {
        newStart = data.startDate
        if (data.endDate) {
          const newDuration = new Date(data.endDate).getTime() - new Date(data.startDate).getTime()
          newEnd = new Date(new Date(newStart).getTime() + newDuration).toISOString()
        } else {
          const baseDuration = parentEnd.getTime() - parentStart.getTime()
          newEnd = new Date(new Date(newStart).getTime() + baseDuration).toISOString()
        }
      } else {
        newStart = new Date(
          occDateTime.getFullYear(),
          occDateTime.getMonth(),
          occDateTime.getDate(),
          parentStart.getHours(),
          parentStart.getMinutes(),
          0,
          0,
        ).toISOString()
        if (data.endDate) {
          const newDuration = new Date(data.endDate).getTime() - new Date(newStart).getTime()
          newEnd = new Date(new Date(newStart).getTime() + newDuration).toISOString()
        } else {
          const baseDuration = parentEnd.getTime() - parentStart.getTime()
          newEnd = new Date(new Date(newStart).getTime() + baseDuration).toISOString()
        }
      }

      const existingAdjustments = ((parent as any).adjustments ?? []) as SeriesAdjustment[]
      const keptAdjustments = existingAdjustments.filter((a) => new Date(a.fromDate) < occDateTime)

      const newAdjustment: SeriesAdjustment = {
        fromDate: occDate,
        ...(data.startDate ? { startDate: newStart } : {}),
        ...(data.endDate ? { endDate: newEnd } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.color !== undefined ? { color: data.color } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
        ...(data.allDay !== undefined ? { allDay: data.allDay } : {}),
      }

      const updated = await payload.update({
        collection: 'calendar-events',
        id: parentId,
        data: {
          adjustments: [...keptAdjustments, newAdjustment] as any,
        },
      })
      return ok(updated)
    }

    return err('Unknown scope')
  } catch (e) {
    console.error(e)
    return err('Error updating event')
  }
}

export const deleteCalendarEvent = async (
  id: number,
  scope: EditScope = 'all',
  originalOccurrenceDate?: string,
) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const existing = await payload.findByID({ collection: 'calendar-events', id })

    if (!(await canManageCalendarEvent(existing as any, userId))) return err('Not authorized')

    const isRecurring = !!(existing as any).recurrence?.frequency
    const isOverride = !!(existing as any).recurrenceId

    const parentId = isOverride ? (existing as any).recurrenceId : id

    if ((!isRecurring && !isOverride) || scope === 'all') {
      const targetId = isOverride ? (existing as any).recurrenceId : id
      const { docs: overrides } = await payload.find({
        collection: 'calendar-events',
        where: { recurrenceId: { equals: targetId } },
        limit: 500,
      })
      for (const o of overrides) {
        await payload.delete({ collection: 'calendar-events', id: o.id })
      }
      await payload.delete({ collection: 'calendar-events', id: targetId })
      return ok(true)
    }

    const occDate = originalOccurrenceDate ?? existing.startDate
    const parent = await payload.findByID({ collection: 'calendar-events', id: parentId })

    if (scope === 'this') {
      if (isOverride) await payload.delete({ collection: 'calendar-events', id })
      const exceptions = ((parent as any).exceptions ?? []) as { date: string }[]
      const occDateKey = getLocalKey(occDate)
      if (!exceptions.find((e) => getLocalKey(e.date) === occDateKey)) {
        await payload.update({
          collection: 'calendar-events',
          id: parentId,
          data: { exceptions: [...exceptions, { date: occDate }] as any },
        })
      }
      return ok(true)
    }

    if (scope === 'thisAndFollowing') {
      const occDateTime = new Date(occDate)

      const { docs: futureOverrides } = await payload.find({
        collection: 'calendar-events',
        where: {
          and: [
            { recurrenceId: { equals: parentId } },
            { startDate: { greater_than_equal: toMidnight(occDate) } },
          ],
        },
        limit: 500,
      })
      for (const o of futureOverrides) {
        await payload.delete({ collection: 'calendar-events', id: o.id })
      }

      const existingAdjustments = ((parent as any).adjustments ?? []) as SeriesAdjustment[]
      const keptAdjustments = existingAdjustments.filter((a) => new Date(a.fromDate) < occDateTime)

      const cutDate = addDays(occDateTime, -1)
      const parentRecurrence = (parent as any).recurrence ?? {}
      await payload.update({
        collection: 'calendar-events',
        id: parentId,
        data: {
          adjustments: keptAdjustments as any,
          recurrence: {
            ...parentRecurrence,
            endType: 'onDate',
            endDate: new Date(
              cutDate.getFullYear(),
              cutDate.getMonth(),
              cutDate.getDate(),
              23,
              59,
              59,
            ).toISOString(),
          } as any,
        },
      })
      return ok(true)
    }

    return err('Unknown scope')
  } catch (e) {
    console.error(e)
    return err('Error deleting event')
  }
}
