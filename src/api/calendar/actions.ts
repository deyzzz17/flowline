'use server'

import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { ok, err } from '@/types/result'
import { Pool } from 'pg'
import { checkRateLimit } from '@/lib/rate-limit'

const getUserId = async () => {
  const session = await auth.api.getSession({ headers: await headers() })
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
  recurrence?: RecurrenceRule | null
  recurrenceId?: number | null
  originalDate?: string | null
  exceptions?: { date: string }[]
  adjustments?: SeriesAdjustment[]
}

export type EditScope = 'this' | 'thisAndFollowing' | 'all'

const DEFAULT_CALENDAR_CATEGORIES = [
  { name: 'Personal', color: '#8b5cf6', isDefault: true },
  { name: 'Work', color: '#3b82f6', isDefault: true },
  { name: 'Health', color: '#10b981', isDefault: true },
]

export const listCalendarCategories = async () => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }
  const payload = await getPayload({ config })
  const existing = await payload.find({
    collection: 'calendar-categories',
    where: { userId: { equals: userId } },
    limit: 0,
    sort: 'createdAt',
  })
  if (existing.docs.length === 0) {
    for (const cat of DEFAULT_CALENDAR_CATEGORIES) {
      await payload.create({ collection: 'calendar-categories', data: { ...cat, userId } })
    }
    return payload.find({
      collection: 'calendar-categories',
      where: { userId: { equals: userId } },
      limit: 0,
      sort: 'createdAt',
    })
  }
  return existing
}

export const createCalendarCategory = async (data: CalendarCategoryData) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')
    const payload = await getPayload({ config })
    return ok(
      await payload.create({
        collection: 'calendar-categories',
        data: { ...data, userId, isDefault: false },
      }),
    )
  } catch {
    return err('Error creating category')
  }
}

export const updateCalendarCategory = async (id: number, data: Partial<CalendarCategoryData>) => {
  try {
    const payload = await getPayload({ config })
    return ok(await payload.update({ collection: 'calendar-categories', id, data }))
  } catch {
    return err('Error updating category')
  }
}

export const deleteCalendarCategory = async (id: number) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })

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
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
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
  } finally {
    await pool.end()
  }
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

export const listFlowlineCalendarEvents = async (from: string, to: string) => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'calendar-events',
    limit: 500,
    sort: 'startDate',
    where: {
      and: [
        { userId: { equals: userId } },
        {
          or: [
            { and: [{ recurrenceId: { exists: false } }, { startDate: { less_than_equal: to } }] },
            { and: [{ recurrenceId: { exists: true } }, { startDate: { less_than_equal: to } }] },
          ],
        },
      ],
    },
  })
  return { docs }
}

export const listGoogleCalendarEvents = async (from: string, to: string) => {
  const userId = await getUserId()
  if (!userId) return { docs: [] }
  const payload = await getPayload({ config })
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
    const event = await payload.create({
      collection: 'calendar-events',
      data: {
        userId,
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        allDay: data.allDay ?? false,
        color: data.color ?? '#8b5cf6',
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
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
        },
      })
      return ok(updated)
    }

    const parentId = isOverride ? (existing as any).recurrenceId : id
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
          const newOccEnd = new Date(data.endDate)
          updateData.endDate = new Date(
            parentEnd.getFullYear(),
            parentEnd.getMonth(),
            parentEnd.getDate(),
            newOccEnd.getHours(),
            newOccEnd.getMinutes(),
            0,
            0,
          ).toISOString()
        } else {
          updateData.endDate = new Date(
            new Date(updateData.startDate).getTime() + originalDuration,
          ).toISOString()
        }
      } else if (data.endDate) {
        const occStart = new Date(occDate)
        const occStartInSeries = new Date(
          occStart.getFullYear(),
          occStart.getMonth(),
          occStart.getDate(),
          parentStart.getHours(),
          parentStart.getMinutes(),
          0,
          0,
        )
        const newDuration = new Date(data.endDate).getTime() - occStartInSeries.getTime()
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
      const occDateKey = new Date(occDate).toISOString().slice(0, 10)

      if (!exceptions.find((e) => new Date(e.date).toISOString().slice(0, 10) === occDateKey)) {
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
        const duration = parentEnd.getTime() - parentStart.getTime()
        const newStart = data.startDate ?? occDate
        const newEnd =
          data.endDate ?? new Date(new Date(newStart).getTime() + duration).toISOString()
        const created = await payload.create({
          collection: 'calendar-events',
          data: {
            userId,
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
        const baseDuration = parentEnd.getTime() - parentStart.getTime()
        newEnd = data.endDate ?? new Date(new Date(newStart).getTime() + baseDuration).toISOString()
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
        const baseDuration = parentEnd.getTime() - parentStart.getTime()
        newEnd = data.endDate ?? new Date(new Date(newStart).getTime() + baseDuration).toISOString()
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
    const payload = await getPayload({ config })
    const existing = await payload.findByID({ collection: 'calendar-events', id })
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
      const occDateKey = new Date(occDate).toISOString().slice(0, 10)
      if (!exceptions.find((e) => new Date(e.date).toISOString().slice(0, 10) === occDateKey)) {
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
