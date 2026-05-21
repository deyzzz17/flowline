'use server'

import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { ok, err } from '@/types/result'

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
  seriesId?: string | null
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
    const payload = await getPayload({ config })
    await payload.delete({ collection: 'calendar-categories', id })
    return ok(true)
  } catch {
    return err('Error deleting category')
  }
}

export const listCalendarEvents = async (from: string, to: string) => {
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

export const createCalendarEvent = async (data: CalendarEventData) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')
    const payload = await getPayload({ config })

    const seriesId = data.recurrence?.frequency
      ? (data.seriesId ?? `series-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      : null

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
        ...(seriesId ? { seriesId } : {}),
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

    if (scope === 'all') {
      const parent = await payload.findByID({ collection: 'calendar-events', id: parentId })
      const parentStart = new Date(parent.startDate)
      const parentEnd = new Date(parent.endDate)
      const originalDuration = parentEnd.getTime() - parentStart.getTime()
      const parentRecurrence = (parent as any).recurrence ?? {}
      const seriesId = (parent as any).seriesId ?? null

      const updateData: any = {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.allDay !== undefined && { allDay: data.allDay }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        exceptions: [],
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
        const occStart = new Date(originalOccurrenceDate ?? existing.startDate)
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

      if (seriesId) {
        const { docs: siblings } = await payload.find({
          collection: 'calendar-events',
          where: {
            and: [
              { seriesId: { equals: seriesId } },
              { id: { not_equals: parentId } },
              { recurrenceId: { exists: false } },
            ],
          },
          limit: 100,
        })
        for (const s of siblings) {
          const { docs: sOverrides } = await payload.find({
            collection: 'calendar-events',
            where: { recurrenceId: { equals: s.id } },
            limit: 500,
          })
          for (const o of sOverrides) {
            await payload.delete({ collection: 'calendar-events', id: o.id })
          }
          await payload.delete({ collection: 'calendar-events', id: s.id })
        }
      }

      const updated = await payload.update({
        collection: 'calendar-events',
        id: parentId,
        data: updateData,
      })
      return ok(updated)
    }

    const occDate = originalOccurrenceDate ?? data.startDate ?? existing.startDate
    const parent = await payload.findByID({ collection: 'calendar-events', id: parentId })

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
        const duration =
          new Date(existing.endDate).getTime() - new Date(existing.startDate).getTime()
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
      const seriesId = (parent as any).seriesId ?? null

      if (seriesId) {
        const { docs: laterSiblings } = await payload.find({
          collection: 'calendar-events',
          where: {
            and: [
              { seriesId: { equals: seriesId } },
              { id: { not_equals: parentId } },
              { recurrenceId: { exists: false } },
              { startDate: { greater_than_equal: toMidnight(occDate) } },
            ],
          },
          limit: 100,
        })
        for (const s of laterSiblings) {
          const { docs: sOverrides } = await payload.find({
            collection: 'calendar-events',
            where: { recurrenceId: { equals: s.id } },
            limit: 500,
          })
          for (const o of sOverrides)
            await payload.delete({ collection: 'calendar-events', id: o.id })
          await payload.delete({ collection: 'calendar-events', id: s.id })
        }
      }

      const { docs: overrides } = await payload.find({
        collection: 'calendar-events',
        where: {
          and: [
            { recurrenceId: { equals: parentId } },
            { startDate: { greater_than_equal: toMidnight(occDate) } },
          ],
        },
        limit: 500,
      })
      for (const o of overrides) await payload.delete({ collection: 'calendar-events', id: o.id })

      const parentRecurrence = (parent as any).recurrence ?? {}
      const cutDate = addDays(occDateTime, -1)
      await payload.update({
        collection: 'calendar-events',
        id: parentId,
        data: {
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

      const origParentStart = new Date(existing.startDate)
      const originalDuration =
        new Date(existing.endDate).getTime() - new Date(existing.startDate).getTime()

      let newStart: string
      let newEnd: string

      if (data.startDate) {
        newStart = data.startDate
        newEnd =
          data.endDate ?? new Date(new Date(newStart).getTime() + originalDuration).toISOString()
      } else {
        const occurrenceStart = new Date(occDate)
        newStart = new Date(
          occurrenceStart.getFullYear(),
          occurrenceStart.getMonth(),
          occurrenceStart.getDate(),
          origParentStart.getHours(),
          origParentStart.getMinutes(),
          0,
          0,
        ).toISOString()
        newEnd =
          data.endDate ?? new Date(new Date(newStart).getTime() + originalDuration).toISOString()
      }

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
          recurrence: data.recurrence
            ? (data.recurrence as any)
            : { ...parentRecurrence, endType: 'never', endDate: null, endCount: null },
          ...(seriesId ? { seriesId } : {}),
        },
      })
      return ok(created)
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

    if ((!isRecurring && !isOverride) || scope === 'all') {
      const targetId = isOverride ? (existing as any).recurrenceId : id
      const targetDoc = await payload.findByID({ collection: 'calendar-events', id: targetId })
      const seriesId = (targetDoc as any).seriesId ?? null

      if (seriesId) {
        const { docs: allSeriesParents } = await payload.find({
          collection: 'calendar-events',
          where: {
            and: [{ seriesId: { equals: seriesId } }, { recurrenceId: { exists: false } }],
          },
          limit: 100,
        })
        for (const sp of allSeriesParents) {
          const { docs: spOverrides } = await payload.find({
            collection: 'calendar-events',
            where: { recurrenceId: { equals: sp.id } },
            limit: 500,
          })
          for (const o of spOverrides)
            await payload.delete({ collection: 'calendar-events', id: o.id })
          await payload.delete({ collection: 'calendar-events', id: sp.id })
        }
        return ok(true)
      }

      const { docs: overrides } = await payload.find({
        collection: 'calendar-events',
        where: { recurrenceId: { equals: targetId } },
        limit: 500,
      })
      for (const o of overrides) await payload.delete({ collection: 'calendar-events', id: o.id })
      await payload.delete({ collection: 'calendar-events', id: targetId })
      return ok(true)
    }

    const occDate = originalOccurrenceDate ?? existing.startDate
    const parentId = isOverride ? (existing as any).recurrenceId : id

    if (scope === 'this') {
      if (isOverride) await payload.delete({ collection: 'calendar-events', id })
      const parent = await payload.findByID({ collection: 'calendar-events', id: parentId })
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
      const parent = await payload.findByID({ collection: 'calendar-events', id: parentId })
      const seriesId = (parent as any).seriesId ?? null

      if (seriesId) {
        const { docs: laterSiblings } = await payload.find({
          collection: 'calendar-events',
          where: {
            and: [
              { seriesId: { equals: seriesId } },
              { id: { not_equals: parentId } },
              { recurrenceId: { exists: false } },
              { startDate: { greater_than_equal: toMidnight(occDate) } },
            ],
          },
          limit: 100,
        })
        for (const s of laterSiblings) {
          const { docs: sOverrides } = await payload.find({
            collection: 'calendar-events',
            where: { recurrenceId: { equals: s.id } },
            limit: 500,
          })
          for (const o of sOverrides)
            await payload.delete({ collection: 'calendar-events', id: o.id })
          await payload.delete({ collection: 'calendar-events', id: s.id })
        }
      }

      const { docs: overrides } = await payload.find({
        collection: 'calendar-events',
        where: {
          and: [
            { recurrenceId: { equals: parentId } },
            { startDate: { greater_than_equal: toMidnight(occDate) } },
          ],
        },
        limit: 500,
      })
      for (const o of overrides) await payload.delete({ collection: 'calendar-events', id: o.id })

      const parentRecurrence = (parent as any).recurrence ?? {}
      const cutDate = addDays(occDateTime, -1)
      await payload.update({
        collection: 'calendar-events',
        id: parentId,
        data: {
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
