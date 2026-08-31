'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import { type CalendarEventData, type EditScope, type SeriesAdjustment } from '@/api/calendar/actions'
import { generateOccurrences } from '@/api/calendar/calendar-recurrence'
import { useCalendarFilter } from '@/components/calendar/calendar-filter-context'
import { SHARED_LIST_POLL_INTERVAL_MS } from '@/lib/realtime'
import type { Task } from '@/payload-types'
import { toast } from 'sonner'
import {
  type CalendarView,
  type CalendarEvent,
  type CalendarTask,
  type CalendarItem,
  type ParentOverride,
  getViewRange,
  getLocalDateKey,
  mapEvent,
  parseViewFromUrl,
  parseDateFromUrl,
  formatDateForUrl,
  minutesToPx,
  MIN_DURATION_MIN,
} from './calendar-utils'

const EVENTS_QUERY_KEY = 'workspace-calendar-events'

/**
 * Same shape as useCalendar, but scoped to the active workspace only, and
 * with no Google Calendar sync and no habit events — this calendar is purely
 * for content internal to the workspace.
 */
export const useWorkspaceCalendar = () => {
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

  const [optimisticParentOverrides, setOptimisticParentOverrides] = useState<
    Map<number, ParentOverride>
  >(new Map())

  const queryClient = useQueryClient()
  const { isCategoryVisible } = useCalendarFilter()
  const { from, to } = getViewRange(currentDate, view)

  const { data: eventsData } = useQuery({
    queryKey: [EVENTS_QUERY_KEY, from.toISOString(), to.toISOString()],
    queryFn: () => api.calendar.listFlowline(from.toISOString(), to.toISOString(), 'workspace'),
    staleTime: SHARED_LIST_POLL_INTERVAL_MS,
    refetchInterval: SHARED_LIST_POLL_INTERVAL_MS,
  })

  // Scoped to the active workspace — unlike the plain api.tasks.list() (used
  // by the global calendar, notifications, etc.), so a task due today in a
  // different workspace doesn't show up here. Polls at the same cadence as
  // the rest of the app's shared/collaborative data (see src/lib/realtime.ts)
  // so other members' changes show up here too.
  const { data: tasksData } = useQuery({
    queryKey: ['tasks', 'workspace-calendar'],
    queryFn: () => api.tasks.listForWorkspaceCalendar(),
    staleTime: SHARED_LIST_POLL_INTERVAL_MS,
    refetchInterval: SHARED_LIST_POLL_INTERVAL_MS,
  })

  const rawEvents = useMemo(() => (eventsData?.docs ?? []).map(mapEvent), [eventsData])

  const events: CalendarEvent[] = useMemo(() => {
    const result: CalendarEvent[] = []

    const parents = rawEvents.filter((e) => e.recurrence?.frequency && !e.recurrenceId)
    const overrides = rawEvents.filter((e) => e.recurrenceId)
    const normal = rawEvents.filter((e) => !e.recurrence?.frequency && !e.recurrenceId)

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
      const parentOverride = optimisticParentOverrides.get(parent.id)
      const effectiveParent = parentOverride
        ? {
            ...parent,
            ...(parentOverride.startDate !== undefined && { startDate: parentOverride.startDate }),
            ...(parentOverride.endDate !== undefined && { endDate: parentOverride.endDate }),
            ...(parentOverride.adjustments !== undefined && {
              adjustments: parentOverride.adjustments,
            }),
            ...(parentOverride.exceptions !== undefined && {
              exceptions: parentOverride.exceptions,
            }),
          }
        : parent

      const serverExceptions = new Set(
        (effectiveParent.exceptions ?? []).map((ex) => ex.date.slice(0, 10)),
      )

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
        { ...effectiveParent, adjustments: effectiveParent.adjustments ?? [] },
        from,
        to,
        allExceptions,
      )

      for (const occ of occurrences) {
        const occIso = occ.date.toISOString()
        const adj = occ.adjustment

        result.push({
          id: parent.id,
          title: adj?.title ?? effectiveParent.title,
          description: adj?.description ?? effectiveParent.description,
          startDate: occIso,
          endDate: occ.endDate.toISOString(),
          allDay: adj?.allDay ?? effectiveParent.allDay,
          color: adj?.color ?? effectiveParent.color,
          categoryId: adj?.categoryId ?? effectiveParent.categoryId,
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
            title: effectiveParent.title,
            description: effectiveParent.description,
            startDate: override.startDate,
            endDate: override.endDate,
            allDay: effectiveParent.allDay,
            color: effectiveParent.color,
            categoryId: effectiveParent.categoryId,
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

    return result
  }, [rawEvents, from, to, optimisticExceptions, optimisticParentOverrides])

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

  const applyOptimisticParentOverride = useCallback(
    (parentId: number, override: ParentOverride) => {
      setOptimisticParentOverrides((prev) => {
        const next = new Map(prev)
        next.set(parentId, override)
        return next
      })
    },
    [],
  )

  const clearOptimisticParentOverride = useCallback((parentId: number) => {
    setOptimisticParentOverrides((prev) => {
      const next = new Map(prev)
      next.delete(parentId)
      return next
    })
  }, [])

  const getRawParent = useCallback(
    (id: number) => {
      return (
        queryClient
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .getQueriesData<{ docs: any[] }>({ queryKey: [EVENTS_QUERY_KEY] })
          .flatMap(([, d]) => d?.docs ?? [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .find((e: any) => e.id === id) ?? null
      )
    },
    [queryClient],
  )

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
      queryClient.invalidateQueries({ queryKey: [EVENTS_QUERY_KEY] })
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
      await queryClient.cancelQueries({ queryKey: [EVENTS_QUERY_KEY] })
      const snapshot = queryClient.getQueriesData({ queryKey: [EVENTS_QUERY_KEY] })

      if (!scope || scope === 'all') {
        for (const [cacheKey, cacheData] of snapshot) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const currentData = cacheData as { docs: any[] } | undefined
          if (!currentData?.docs) continue
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            docs: currentData.docs.map((e: { id: number }) =>
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
        clearOptimisticParentOverride(id)
        queryClient.invalidateQueries({ queryKey: [EVENTS_QUERY_KEY] })
      } else {
        queryClient.invalidateQueries({ queryKey: [EVENTS_QUERY_KEY] }).then(() => {
          if (key) clearOptimistic(key)
          else clearOptimisticDate('event', id)
          if (occDate) clearOptimisticException(id, occDate)
          clearOptimisticParentOverride(id)
        })
      }
      if (dialogOpen) {
        toast.success('Event updated')
        setDialogOpen(false)
      }
    },

    onError: (_, { id, optimisticKey: key, occDate }, context) => {
      if (context?.snapshot) {
        for (const [queryKey, data] of context.snapshot) {
          queryClient.setQueryData(queryKey, data)
        }
      }
      if (key) clearOptimistic(key)
      else clearOptimisticDate('event', id)
      if (occDate) clearOptimisticException(id, occDate)
      clearOptimisticParentOverride(id)
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
      await queryClient.cancelQueries({ queryKey: [EVENTS_QUERY_KEY] })
      const snapshot = queryClient.getQueriesData({ queryKey: [EVENTS_QUERY_KEY] })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueriesData<{ docs: any[] }>({ queryKey: [EVENTS_QUERY_KEY] }, (old) =>
        old ? { ...old, docs: old.docs.filter((e) => e.id !== id) } : old,
      )
      return { snapshot }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EVENTS_QUERY_KEY] })
      toast.success('Event deleted')
      setDialogOpen(false)
      setSelectedItem(null)
    },
    onError: (_, __, context) => {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueriesData<{ docs: any[] }>({ queryKey: ['tasks'] }, (old) => {
        if (!old) return old
        return { ...old, docs: old.docs.map((t) => (t.id === id ? { ...t, dueDate } : t)) }
      })
      clearOptimisticDate('task', id)
      return { snapshot }
    },
    onSuccess: () => {},
    onError: (_, { id }, context) => {
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

      if (effectiveScope === 'thisAndFollowing' && occDate) {
        const rawParent = getRawParent(id)
        if (rawParent) {
          const parentStart = new Date(rawParent.startDate)
          const parentEnd = new Date(rawParent.endDate)
          const baseDuration = parentEnd.getTime() - parentStart.getTime()

          const newOccStart = new Date(newStartDate)
          const newAdjStartDate = new Date(
            new Date(occDate).getFullYear(),
            new Date(occDate).getMonth(),
            new Date(occDate).getDate(),
            newOccStart.getHours(),
            newOccStart.getMinutes(),
            0,
            0,
          ).toISOString()
          const newAdjEndDate = new Date(
            new Date(newAdjStartDate).getTime() + baseDuration,
          ).toISOString()

          const existingAdjustments = (rawParent.adjustments ?? []).filter(
            (a: SeriesAdjustment) => new Date(a.fromDate) < new Date(occDate),
          )

          const newAdjustment: SeriesAdjustment = {
            fromDate: occDate,
            startDate: newAdjStartDate,
            endDate: newAdjEndDate,
          }

          applyOptimisticParentOverride(id, {
            adjustments: [...existingAdjustments, newAdjustment],
          })
        }
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
    [
      events,
      updateMutation,
      setOptimisticMove,
      addOptimisticException,
      applyOptimisticParentOverride,
      getRawParent,
    ],
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

      const key = event?.optimisticKey ?? `event-${id}`
      const effectiveScope = scope ?? (event?.isOccurrence ? 'this' : 'all')
      const occDate =
        originalDate ?? event?.occurrenceDate ?? event?.originalDate ?? event?.startDate ?? ''

      setOptimisticResize(key, newEndDate.toISOString())

      if (effectiveScope === 'this' && event?.isOccurrence && occDate) {
        addOptimisticException(id, occDate, event.startDate, newEndDate.toISOString())
      }

      if (effectiveScope === 'thisAndFollowing' && occDate) {
        const rawParent = getRawParent(id)
        if (rawParent) {
          const parentStart = new Date(rawParent.startDate)

          const occStartDate = new Date(
            new Date(occDate).getFullYear(),
            new Date(occDate).getMonth(),
            new Date(occDate).getDate(),
            parentStart.getHours(),
            parentStart.getMinutes(),
            0,
            0,
          )
          const newDuration = newEndDate.getTime() - occStartDate.getTime()
          const newAdjEndDate = new Date(parentStart.getTime() + newDuration).toISOString()

          const existingAdjustments = (rawParent.adjustments ?? []).filter(
            (a: SeriesAdjustment) => new Date(a.fromDate) < new Date(occDate),
          )

          const newAdjustment: SeriesAdjustment = {
            fromDate: occDate,
            endDate: newAdjEndDate,
          }

          applyOptimisticParentOverride(id, {
            adjustments: [...existingAdjustments, newAdjustment],
          })
        }
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
    [
      updateMutation,
      events,
      setOptimisticResize,
      addOptimisticException,
      applyOptimisticParentOverride,
      getRawParent,
    ],
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
        if (!isCategoryVisible(e.categoryId)) return false
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
          const dayStart2 = new Date(date)
          dayStart2.setHours(0, 0, 0, 0)
          if (start < dayStart2) {
            const thisDayKey = getLocalDateKey(e.occurrenceDate ?? e.startDate)
            if (optimisticExceptions.has(`${e.id}:${thisDayKey}`)) return false
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
    [eventsWithOverrides, tasksWithOverrides, isCategoryVisible, optimisticExceptions],
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
