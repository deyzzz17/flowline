'use client'

import { useCallback, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '@/api'
import {
  type CalendarEventData,
  type EditScope,
  type RecurrenceRule,
  type SeriesAdjustment,
} from '@/api/calendar/actions'
import { generateOccurrences } from '@/api/calendar/calendar-recurrence'
import { useCalendarFilter } from '@/components/calendar/calendar-filter-context'
import type { Task } from '@/payload-types'
import { toast } from 'sonner'
import { getHabitCalendarEvents, type HabitCalendarEvent } from '@/api/habits-calendar/actions'

export type CalendarView = 'year' | 'month' | 'week' | 'day'

export interface CalendarEvent {
  id: number | string
  title: string
  description?: string
  startDate: string
  endDate: string
  allDay: boolean
  color: string
  categoryId?: number | null
  recurrence?: RecurrenceRule | null
  recurrenceId?: number | null
  originalDate?: string | null
  isOccurrence?: boolean
  occurrenceDate?: string
  optimisticKey?: string
  source?: 'flowline' | 'google'
  googleCalendarId?: string | null
  googleCalendarName?: string | null
  googleEventId?: string | null
  activeAdjustment?: SeriesAdjustment | null
  type: 'event'
}

export interface CalendarTask {
  id: number
  title: string
  dueDate: string
  listName: string
  listColor: string
  listSlug: string
  type: 'task'
}

export type CalendarItem = CalendarEvent | CalendarTask

const SLOT_HEIGHT = 56
const MIN_DURATION_MIN = 15
const VALID_VIEWS: CalendarView[] = ['year', 'month', 'week', 'day']

function minutesToPx(minutes: number) {
  return (minutes / 60) * SLOT_HEIGHT
}

function getLocalDateKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getViewRange(date: Date, view: CalendarView): { from: Date; to: Date } {
  const y = date.getFullYear()
  const m = date.getMonth()
  const d = date.getDate()
  switch (view) {
    case 'year': {
      const from = new Date(y, 0, 1)
      from.setHours(0, 0, 0, 0)
      const to = new Date(y, 11, 31)
      to.setHours(23, 59, 59)
      return { from, to }
    }
    case 'month': {
      const from = new Date(y, m, 1)
      from.setDate(from.getDate() - from.getDay())
      const to = new Date(y, m + 1, 0)
      to.setDate(to.getDate() + (6 - to.getDay()))
      to.setHours(23, 59, 59)
      return { from, to }
    }
    case 'week': {
      const from = new Date(y, m, d - date.getDay() - 1)
      from.setHours(0, 0, 0)
      const to = new Date(y, m, d - date.getDay() + 6)
      to.setHours(23, 59, 59)
      return { from, to }
    }
    case 'day':
      return {
        from: new Date(y, m, d - 1, 0, 0, 0),
        to: new Date(y, m, d, 23, 59, 59),
      }
  }
}

function mapEvent(e: any) {
  return {
    id: e.id,
    title: e.title,
    description: e.description ?? undefined,
    startDate: e.startDate,
    endDate: e.endDate,
    allDay: e.allDay ?? false,
    color: e.color ?? '#8b5cf6',
    categoryId: typeof e.categoryId === 'number' ? e.categoryId : null,
    recurrence: e.recurrence?.frequency ? (e.recurrence as RecurrenceRule) : null,
    recurrenceId: e.recurrenceId ?? null,
    originalDate: e.originalDate ?? null,
    exceptions: (e.exceptions ?? []) as { date: string }[],
    adjustments: (e.adjustments ?? []) as SeriesAdjustment[],
    source: (e.source ?? 'flowline') as 'flowline' | 'google',
    googleCalendarId: e.googleCalendarId ?? null,
    googleCalendarName: e.googleCalendarName ?? null,
    googleEventId: e.googleEventId ?? null,
    type: 'event' as const,
  }
}

function parseViewFromUrl(raw: string | null): CalendarView {
  if (raw && VALID_VIEWS.includes(raw as CalendarView)) return raw as CalendarView
  return 'month'
}

function parseDateFromUrl(raw: string | null): Date {
  if (!raw) return new Date()
  const parts = raw.split('-').map(Number)
  if (parts.length !== 3 || parts.some(isNaN)) return new Date()
  const [year, month, day] = parts
  const d = new Date(year, month - 1, day, 12, 0, 0)
  return isNaN(d.getTime()) ? new Date() : d
}

function formatDateForUrl(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export const useCalendar = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const view = parseViewFromUrl(searchParams.get('view'))
  const currentDate = parseDateFromUrl(searchParams.get('date'))

  const pushUrl = useCallback(
    (newView: CalendarView, newDate: Date) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('view', newView)
      params.set('date', formatDateForUrl(newDate))
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  const setView = useCallback((v: CalendarView) => pushUrl(v, currentDate), [pushUrl, currentDate])

  const setCurrentDate = useCallback(
    (d: Date | ((prev: Date) => Date)) => {
      const next = typeof d === 'function' ? d(currentDate) : d
      pushUrl(view, next)
    },
    [pushUrl, view, currentDate],
  )

  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newEventDate, setNewEventDate] = useState<Date | null>(null)

  const [optimisticOverrides, setOptimisticOverrides] = useState<
    Map<string, { startDate?: string; endDate?: string }>
  >(new Map())

  const [optimisticExceptions, setOptimisticExceptions] = useState<
    Map<string, { startDate: string; endDate: string }>
  >(new Map())

  const queryClient = useQueryClient()
  const { isCategoryVisible, isGoogleCalendarVisible, habitsVisible } = useCalendarFilter()
  const { from, to } = getViewRange(currentDate, view)

  const { data: eventsData } = useQuery({
    queryKey: ['calendar-events-flowline', from.toISOString(), to.toISOString()],
    queryFn: () => api.calendar.listFlowline(from.toISOString(), to.toISOString()),
    staleTime: Infinity,
  })

  const { data: googleEventsData } = useQuery({
    queryKey: ['calendar-events-google', from.toISOString(), to.toISOString()],
    queryFn: () => api.calendar.listGoogle(from.toISOString(), to.toISOString()),
    staleTime: 0,
    refetchInterval: 30_000,
  })

  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.tasks.list(),
    staleTime: Infinity,
  })

  const { data: habitEventsData } = useQuery({
    queryKey: ['calendar-events-habits', from.toISOString(), to.toISOString()],
    queryFn: () => getHabitCalendarEvents(from.toISOString(), to.toISOString()),
    staleTime: 0,
  })

  const rawEvents = useMemo(
    () => [...(eventsData?.docs ?? []), ...(googleEventsData?.docs ?? [])].map(mapEvent),
    [eventsData, googleEventsData],
  )

  const rawHabitEvents = useMemo(
    (): CalendarEvent[] =>
      (habitEventsData ?? []).map((h: HabitCalendarEvent) => ({
        id: h.id,
        title: h.title,
        startDate: h.startDate,
        endDate: h.endDate,
        allDay: false,
        color: h.color,
        categoryId: null,
        recurrence: null,
        recurrenceId: null,
        originalDate: null,
        isOccurrence: false,
        optimisticKey: h.id,
        source: 'habit' as any,
        googleCalendarId: null,
        googleCalendarName: null,
        googleEventId: null,
        activeAdjustment: null,
        type: 'event' as const,
        habitId: (h as any).habitId,
        habitSlug: (h as any).habitSlug,
      })),
    [habitEventsData],
  )

  const events: CalendarEvent[] = useMemo(() => {
    const result: CalendarEvent[] = []

    const googleEvents = rawEvents.filter((e) => e.source === 'google')
    const flowlineEvents = rawEvents.filter((e) => e.source !== 'google')

    const parents = flowlineEvents.filter((e) => e.recurrence?.frequency && !e.recurrenceId)
    const overrides = flowlineEvents.filter((e) => e.recurrenceId)
    const normal = flowlineEvents.filter((e) => !e.recurrence?.frequency && !e.recurrenceId)

    result.push(
      ...normal.map(({ exceptions, adjustments, ...e }) => ({
        ...e,
        optimisticKey: `event-${e.id}`,
      })),
    )

    result.push(
      ...overrides.map(({ exceptions, adjustments, ...e }) => ({
        ...e,
        isOccurrence: true,
        optimisticKey: `event-${e.id}`,
      })),
    )

    for (const parent of parents) {
      const serverExceptions = new Set((parent.exceptions ?? []).map((ex) => ex.date.slice(0, 10)))

      const parentOptExceptions = new Map<string, { startDate: string; endDate: string }>()
      for (const [key, val] of optimisticExceptions.entries()) {
        if (key.startsWith(`${parent.id}:`)) {
          const dateKey = key.split(':')[1]
          if (dateKey) parentOptExceptions.set(dateKey, val)
        }
      }

      const allExceptions = new Set([
        ...serverExceptions,
        ...parentOptExceptions.keys(),
        ...overrides
          .filter((o) => o.recurrenceId === parent.id)
          .map((o) => (o.originalDate ?? o.startDate).slice(0, 10)),
      ])

      const occurrences = generateOccurrences(
        { ...parent, adjustments: parent.adjustments ?? [] },
        from,
        to,
        allExceptions,
      )

      for (const occ of occurrences) {
        const occIso = occ.date.toISOString()
        const adj = occ.adjustment

        result.push({
          id: parent.id,
          title: adj?.title ?? parent.title,
          description: adj?.description ?? parent.description,
          startDate: occIso,
          endDate: occ.endDate.toISOString(),
          allDay: adj?.allDay ?? parent.allDay,
          color: adj?.color ?? parent.color,
          categoryId: adj?.categoryId ?? parent.categoryId,
          recurrence: parent.recurrence,
          recurrenceId: null,
          originalDate: occIso,
          isOccurrence: true,
          occurrenceDate: occIso,
          optimisticKey: `event-${parent.id}-${occIso}`,
          source: 'flowline',
          activeAdjustment: adj ?? null,
          type: 'event',
        })
      }

      for (const [dateKey, override] of parentOptExceptions.entries()) {
        const overrideKey = `optimistic-${parent.id}-${dateKey}`
        const serverOverrideExists = overrides.some(
          (o) =>
            o.recurrenceId === parent.id &&
            (o.originalDate ?? o.startDate).slice(0, 10) === dateKey,
        )
        if (!serverOverrideExists) {
          result.push({
            id: parent.id,
            title: parent.title,
            description: parent.description,
            startDate: override.startDate,
            endDate: override.endDate,
            allDay: parent.allDay,
            color: parent.color,
            categoryId: parent.categoryId,
            recurrence: parent.recurrence,
            recurrenceId: null,
            originalDate: override.startDate,
            isOccurrence: true,
            occurrenceDate: override.startDate,
            optimisticKey: overrideKey,
            source: 'flowline',
            activeAdjustment: null,
            type: 'event',
          })
        }
      }
    }

    result.push(
      ...googleEvents.map(({ exceptions, adjustments, ...e }) => ({
        ...e,
        optimisticKey: `google-${e.googleEventId ?? e.id}`,
      })),
    )

    result.push(...rawHabitEvents)

    return result
  }, [rawEvents, rawHabitEvents, from, to, optimisticExceptions])

  const tasks: CalendarTask[] = useMemo(() => {
    const allTasks = (tasksData?.docs ?? []) as Task[]
    return allTasks
      .filter((t) => t.dueDate && t.status === 'active')
      .map((t) => {
        type ListObj = { name: string; slug: string; category?: { color?: string | null } | null }
        const list = t.list && typeof t.list === 'object' ? (t.list as ListObj) : null
        return {
          id: t.id,
          title: t.title,
          dueDate: t.dueDate!,
          listName: list?.name ?? '',
          listColor: list?.category?.color ?? '#8b5cf6',
          listSlug: list?.slug ?? '',
          type: 'task' as const,
        }
      })
  }, [tasksData])

  const eventsWithOverrides = useMemo(
    () =>
      events.map((e) => {
        const key = e.optimisticKey ?? `event-${e.id}`
        const override = optimisticOverrides.get(key)
        if (!override) return e
        const duration = new Date(e.endDate).getTime() - new Date(e.startDate).getTime()
        const newStart = override.startDate ?? e.startDate
        const newEnd = override.endDate
          ? override.endDate
          : override.startDate
            ? new Date(new Date(override.startDate).getTime() + duration).toISOString()
            : e.endDate
        return { ...e, startDate: newStart, endDate: newEnd }
      }),
    [events, optimisticOverrides],
  )

  const tasksWithOverrides = useMemo(
    () =>
      tasks.map((t) => {
        const override = optimisticOverrides.get(`task-${t.id}`)
        return override ? { ...t, dueDate: override.startDate ?? t.dueDate } : t
      }),
    [tasks, optimisticOverrides],
  )

  const setOptimisticMove = useCallback((key: string, startDate: string) => {
    setOptimisticOverrides((prev) => {
      const next = new Map(prev)
      next.set(key, { startDate })
      return next
    })
  }, [])

  const setOptimisticResize = useCallback((key: string, endDate: string) => {
    setOptimisticOverrides((prev) => {
      const next = new Map(prev)
      next.set(key, { ...prev.get(key), endDate })
      return next
    })
  }, [])

  const clearOptimistic = useCallback((key: string) => {
    setOptimisticOverrides((prev) => {
      const next = new Map(prev)
      next.delete(key)
      return next
    })
  }, [])

  const setOptimisticDate = useCallback((type: 'event' | 'task', id: number, date: string) => {
    setOptimisticOverrides((prev) => {
      const next = new Map(prev)
      next.set(`${type}-${id}`, { startDate: date })
      return next
    })
  }, [])

  const clearOptimisticDate = useCallback((type: 'event' | 'task', id: number) => {
    setOptimisticOverrides((prev) => {
      const next = new Map(prev)
      next.delete(`${type}-${id}`)
      return next
    })
  }, [])

  const addOptimisticException = useCallback(
    (parentId: number, occDate: string, newStartDate: string, newEndDate: string) => {
      const dateKey = getLocalDateKey(occDate)
      setOptimisticExceptions((prev) => {
        const next = new Map(prev)
        next.set(`${parentId}:${dateKey}`, { startDate: newStartDate, endDate: newEndDate })
        return next
      })
    },
    [],
  )

  const clearOptimisticException = useCallback((parentId: number, occDate: string) => {
    const dateKey = getLocalDateKey(occDate)
    setOptimisticExceptions((prev) => {
      const next = new Map(prev)
      next.delete(`${parentId}:${dateKey}`)
      return next
    })
  }, [])

  const getItemDisplayHeight = useCallback(
    (item: CalendarItem): number => {
      if (item.type === 'event') {
        const key = (item as CalendarEvent).optimisticKey ?? `event-${item.id}`
        const override = optimisticOverrides.get(key)
        const startDate = new Date(override?.startDate ?? item.startDate)
        const endDate = new Date(override?.endDate ?? item.endDate)
        const durationMin = Math.max(
          MIN_DURATION_MIN,
          (endDate.getTime() - startDate.getTime()) / 60000,
        )
        return minutesToPx(durationMin)
      } else {
        const override = optimisticOverrides.get(`task-${item.id}`)
        if (override?.endDate) {
          const durationMin = Math.max(
            MIN_DURATION_MIN,
            (new Date(override.endDate).getTime() - new Date(item.dueDate).getTime()) / 60000,
          )
          return minutesToPx(durationMin)
        }
        return minutesToPx(30)
      }
    },
    [optimisticOverrides],
  )

  const createMutation = useMutation({
    mutationFn: (data: CalendarEventData) => api.calendar.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events-flowline'] })
      toast.success('Event created')
      setDialogOpen(false)
    },
    onError: () => toast.error('Failed to create event'),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
      scope,
      originalDate,
    }: {
      id: number
      data: Partial<CalendarEventData>
      scope?: EditScope
      originalDate?: string
      optimisticKey?: string
      occDate?: string
    }) => api.calendar.update(id, data, scope, originalDate),

    onMutate: async ({ id, data, scope, optimisticKey: key }) => {
      await queryClient.cancelQueries({ queryKey: ['calendar-events-flowline'] })
      const snapshot = queryClient.getQueriesData({ queryKey: ['calendar-events-flowline'] })

      if (!scope || scope === 'all') {
        for (const [cacheKey, cacheData] of snapshot) {
          const currentData = cacheData as { docs: any[] } | undefined
          if (!currentData?.docs) continue
          const parentDoc = currentData.docs.find((e: any) => e.id === id)
          if (!parentDoc) continue

          const parentStart = new Date(parentDoc.startDate)
          const parentEnd = new Date(parentDoc.endDate)
          const originalDuration = parentEnd.getTime() - parentStart.getTime()
          let newStartDate = parentDoc.startDate
          let newEndDate = parentDoc.endDate

          if (data.startDate) {
            const newOccStart = new Date(data.startDate)
            newStartDate = new Date(
              parentStart.getFullYear(),
              parentStart.getMonth(),
              parentStart.getDate(),
              newOccStart.getHours(),
              newOccStart.getMinutes(),
              0,
              0,
            ).toISOString()
            if (data.endDate) {
              const newDuration =
                new Date(data.endDate).getTime() - new Date(data.startDate).getTime()
              newEndDate = new Date(new Date(newStartDate).getTime() + newDuration).toISOString()
            } else {
              newEndDate = new Date(
                new Date(newStartDate).getTime() + originalDuration,
              ).toISOString()
            }
          }

          queryClient.setQueryData(cacheKey, {
            ...currentData,
            docs: currentData.docs.map((e: any) =>
              e.id === id
                ? {
                    ...e,
                    startDate: newStartDate,
                    endDate: newEndDate,
                    exceptions: [],
                    adjustments: [],
                  }
                : e,
            ),
          })
        }
      }

      return { snapshot, key }
    },

    onSuccess: (_, { id, scope, optimisticKey: key, occDate }) => {
      if (!scope || scope === 'all') {
        if (key) clearOptimistic(key)
        else clearOptimisticDate('event', id)
        queryClient.invalidateQueries({ queryKey: ['calendar-events-flowline'] })
        queryClient.invalidateQueries({ queryKey: ['calendar-events-habits'] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['calendar-events-flowline'] }).then(() => {
          if (key) clearOptimistic(key)
          else clearOptimisticDate('event', id)
          if (occDate) clearOptimisticException(id, occDate)
        })
        queryClient.invalidateQueries({ queryKey: ['calendar-events-habits'] })
      }
    },

    onError: (_, { id, optimisticKey: key, occDate }, context: any) => {
      if (context?.snapshot) {
        for (const [queryKey, data] of context.snapshot) {
          queryClient.setQueryData(queryKey, data)
        }
      }
      if (key) clearOptimistic(key)
      else clearOptimisticDate('event', id)
      if (occDate) clearOptimisticException(id, occDate)
      toast.error('Failed to update event')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({
      id,
      scope,
      originalDate,
    }: {
      id: number
      scope?: EditScope
      originalDate?: string
    }) => api.calendar.delete(id, scope, originalDate),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['calendar-events-flowline'] })
      const snapshot = queryClient.getQueriesData({ queryKey: ['calendar-events-flowline'] })
      queryClient.setQueriesData<{ docs: any[] }>(
        { queryKey: ['calendar-events-flowline'] },
        (old) => (old ? { ...old, docs: old.docs.filter((e) => e.id !== id) } : old),
      )
      return { snapshot }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events-flowline'] })
      queryClient.invalidateQueries({ queryKey: ['calendar-events-habits'] })
      toast.success('Event deleted')
      setDialogOpen(false)
      setSelectedItem(null)
    },
    onError: (_, __, context: any) => {
      if (context?.snapshot) {
        for (const [queryKey, data] of context.snapshot) {
          queryClient.setQueryData(queryKey, data)
        }
      }
      toast.error('Failed to delete event')
    },
  })

  const moveTaskMutation = useMutation({
    mutationFn: ({ id, dueDate }: { id: number; dueDate: string }) =>
      api.tasks.edit(id, { dueDate }),
    onMutate: async ({ id, dueDate }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const snapshot = queryClient.getQueriesData({ queryKey: ['tasks'] })
      queryClient.setQueriesData<{ docs: any[] }>({ queryKey: ['tasks'] }, (old) => {
        if (!old) return old
        return { ...old, docs: old.docs.map((t) => (t.id === id ? { ...t, dueDate } : t)) }
      })
      clearOptimisticDate('task', id)
      return { snapshot }
    },
    onSuccess: () => {},
    onError: (_, { id }, context: any) => {
      if (context?.snapshot) {
        for (const [queryKey, data] of context.snapshot) {
          queryClient.setQueryData(queryKey, data)
        }
      }
      clearOptimisticDate('task', id)
      toast.error('Failed to reschedule task')
    },
  })

  const navigate = useCallback(
    (direction: 'prev' | 'next' | 'today' | 'prev3' | 'next3') => {
      if (direction === 'today') {
        pushUrl(view, new Date())
        return
      }
      const d = new Date(currentDate)
      switch (direction) {
        case 'prev3':
          d.setDate(d.getDate() - 3)
          break
        case 'next3':
          d.setDate(d.getDate() + 3)
          break
        default:
          switch (view) {
            case 'year':
              d.setFullYear(d.getFullYear() + (direction === 'next' ? 1 : -1))
              break
            case 'month':
              d.setMonth(d.getMonth() + (direction === 'next' ? 1 : -1))
              break
            case 'week':
              d.setDate(d.getDate() + (direction === 'next' ? 7 : -7))
              break
            case 'day':
              d.setDate(d.getDate() + (direction === 'next' ? 1 : -1))
              break
          }
      }
      pushUrl(view, d)
    },
    [view, currentDate, pushUrl],
  )

  const openNewEvent = useCallback((date: Date) => {
    setNewEventDate(date)
    setSelectedItem(null)
    setDialogOpen(true)
  }, [])

  const openEdit = useCallback((item: CalendarItem) => {
    setSelectedItem(item)
    setDialogOpen(true)
  }, [])

  const moveEvent = useCallback(
    (
      id: number,
      newStartDate: Date,
      scope?: EditScope,
      originalDate?: string,
      eventOptimisticKey?: string,
    ) => {
      const event =
        events.find((e) =>
          eventOptimisticKey
            ? e.optimisticKey === eventOptimisticKey
            : e.id === id && !e.isOccurrence,
        ) ?? events.find((e) => e.id === id)
      if (!event) return
      if (event.source === 'google') return

      const key = event.optimisticKey ?? `event-${id}`
      const duration = new Date(event.endDate).getTime() - new Date(event.startDate).getTime()
      const effectiveScope = scope ?? (event.isOccurrence ? 'this' : 'all')
      const occDate = originalDate ?? event.occurrenceDate ?? event.startDate

      setOptimisticMove(key, newStartDate.toISOString())

      if (effectiveScope === 'this' && occDate) {
        addOptimisticException(
          id,
          occDate,
          newStartDate.toISOString(),
          new Date(newStartDate.getTime() + duration).toISOString(),
        )
      }

      updateMutation.mutate({
        id,
        data: {
          startDate: newStartDate.toISOString(),
          endDate: new Date(newStartDate.getTime() + duration).toISOString(),
        },
        scope: effectiveScope,
        originalDate: occDate,
        optimisticKey: key,
        occDate,
      })
    },
    [events, updateMutation, setOptimisticMove, addOptimisticException],
  )

  const resizeEvent = useCallback(
    (
      id: number,
      newEndDate: Date,
      scope?: EditScope,
      originalDate?: string,
      eventOptimisticKey?: string,
    ) => {
      const event =
        events.find((e) =>
          eventOptimisticKey
            ? e.optimisticKey === eventOptimisticKey
            : e.id === id && !e.isOccurrence,
        ) ?? events.find((e) => e.id === id)
      if (event?.source === 'google') return

      const key = event?.optimisticKey ?? `event-${id}`
      const effectiveScope = scope ?? (event?.isOccurrence ? 'this' : 'all')
      const occDate =
        originalDate ?? event?.occurrenceDate ?? event?.originalDate ?? event?.startDate ?? ''

      setOptimisticResize(key, newEndDate.toISOString())

      if (effectiveScope === 'this' && event?.isOccurrence && occDate) {
        addOptimisticException(id, occDate, event.startDate, newEndDate.toISOString())
      }

      updateMutation.mutate({
        id,
        data: {
          startDate: event?.startDate,
          endDate: newEndDate.toISOString(),
        },
        scope: effectiveScope,
        originalDate: occDate,
        optimisticKey: key,
        occDate,
      })
    },
    [updateMutation, events, setOptimisticResize, addOptimisticException],
  )

  const moveTask = useCallback(
    (id: number, newDueDate: Date) => {
      setOptimisticOverrides((prev) => {
        const next = new Map(prev)
        next.set(`task-${id}`, { startDate: newDueDate.toISOString() })
        return next
      })
      moveTaskMutation.mutate({ id, dueDate: newDueDate.toISOString() })
    },
    [moveTaskMutation],
  )

  const resizeTask = useCallback(
    (id: number, newEndDate: Date) => {
      setOptimisticOverrides((prev) => {
        const next = new Map(prev)
        next.set(`task-end-${id}`, { endDate: newEndDate.toISOString() })
        return next
      })
      moveTaskMutation.mutate({ id, dueDate: newEndDate.toISOString() })
    },
    [moveTaskMutation],
  )

  const getItemsForDate = useCallback(
    (date: Date): CalendarItem[] => {
      const y = date.getFullYear()
      const m = date.getMonth()
      const d = date.getDate()

      const sameLocalDate = (iso: string) => {
        const dt = new Date(iso)
        return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d
      }

      const dayEvents = eventsWithOverrides.filter((e) => {
        const isHabit = (e as any).source === 'habit'
        if (isHabit && !habitsVisible) return false
        if (!isHabit && !isCategoryVisible(e.categoryId)) return false
        if (e.source === 'google' && e.googleCalendarId) {
          if (!isGoogleCalendarVisible(e.googleCalendarId)) return false
        }
        const start = new Date(e.startDate)
        const end = new Date(e.endDate)
        const dayStart = new Date(date)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(date)
        dayEnd.setHours(23, 59, 59, 999)
        if (!(start <= dayEnd && end >= dayStart)) return false

        if (e.isOccurrence && !e.optimisticKey?.startsWith('optimistic-')) {
          if (e.occurrenceDate) {
            const occDateKey = getLocalDateKey(e.occurrenceDate)
            if (optimisticExceptions.has(`${e.id}:${occDateKey}`)) return false
          }
          const dayStart = new Date(date)
          dayStart.setHours(0, 0, 0, 0)
          const start = new Date(e.startDate)
          if (start < dayStart) {
            for (const key of optimisticExceptions.keys()) {
              if (key.startsWith(`${e.id}:`)) return false
            }
          }
        }

        return true
      })

      const dayTasks = tasksWithOverrides.filter((t) => sameLocalDate(t.dueDate))

      return [...dayEvents, ...dayTasks].sort((a, b) => {
        const aDate = a.type === 'event' ? a.startDate : a.dueDate
        const bDate = b.type === 'event' ? b.startDate : b.dueDate
        return new Date(aDate).getTime() - new Date(bDate).getTime()
      })
    },
    [
      eventsWithOverrides,
      tasksWithOverrides,
      isCategoryVisible,
      isGoogleCalendarVisible,
      habitsVisible,
      optimisticExceptions,
    ],
  )

  const goToDay = useCallback((date: Date) => pushUrl('day', date), [pushUrl])
  const goToMonth = useCallback((date: Date) => pushUrl('month', date), [pushUrl])

  return {
    view,
    setView,
    currentDate,
    setCurrentDate,
    navigate,
    goToDay,
    goToMonth,
    events: eventsWithOverrides,
    tasks: tasksWithOverrides,
    from,
    to,
    selectedItem,
    dialogOpen,
    setDialogOpen,
    newEventDate,
    openNewEvent,
    openEdit,
    moveEvent,
    moveTask,
    moveTaskMutation,
    resizeEvent,
    resizeTask,
    getItemsForDate,
    getItemDisplayHeight,
    createMutation,
    updateMutation,
    deleteMutation,
    setOptimisticDate,
  }
}
