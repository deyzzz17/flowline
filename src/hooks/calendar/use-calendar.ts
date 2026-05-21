'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import { type CalendarEventData, type EditScope, type RecurrenceRule } from '@/api/calendar/actions'
import { generateOccurrences } from '@/api/calendar/calendar-recurrence'
import { useCalendarFilter } from '@/components/calendar/calendar-filter-context'
import type { Task } from '@/payload-types'
import { toast } from 'sonner'

export type CalendarView = 'year' | 'month' | 'week' | 'day'

export interface CalendarEvent {
  id: number
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

function minutesToPx(minutes: number) { return (minutes / 60) * SLOT_HEIGHT }

function getViewRange(date: Date, view: CalendarView): { from: Date; to: Date } {
  const y = date.getFullYear()
  const m = date.getMonth()
  const d = date.getDate()
  switch (view) {
    case 'year': {
      const from = new Date(y, 0, 1); from.setHours(0, 0, 0, 0)
      const to = new Date(y, 11, 31); to.setHours(23, 59, 59)
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
      const from = new Date(y, m, d - date.getDay()); from.setHours(0, 0, 0)
      const to = new Date(from); to.setDate(to.getDate() + 6); to.setHours(23, 59, 59)
      return { from, to }
    }
    case 'day':
      return {
        from: new Date(y, m, d - 1, 0, 0, 0),
        to: new Date(y, m, d, 23, 59, 59),
      }
  }
}

export const useCalendar = () => {
  const [view, setView] = useState<CalendarView>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newEventDate, setNewEventDate] = useState<Date | null>(null)

  const [optimisticOverrides, setOptimisticOverrides] = useState<
    Map<string, { startDate?: string; endDate?: string }>
  >(new Map())

  const queryClient = useQueryClient()
  const { isCategoryVisible } = useCalendarFilter()
  const { from, to } = getViewRange(currentDate, view)

  const { data: eventsData } = useQuery({
    queryKey: ['calendar-events', from.toISOString(), to.toISOString()],
    queryFn: () => api.calendar.list(from.toISOString(), to.toISOString()),
    staleTime: 30_000,
  })

  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.tasks.list(),
    staleTime: 0,
  })

  const rawEvents = useMemo(
    () => (eventsData?.docs ?? []).map((e: any) => ({
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
      type: 'event' as const,
    })),
    [eventsData],
  )

  const events: CalendarEvent[] = useMemo(() => {
    const result: CalendarEvent[] = []
    const parents = rawEvents.filter((e) => e.recurrence?.frequency && !e.recurrenceId)
    const overrides = rawEvents.filter((e) => e.recurrenceId)
    const normal = rawEvents.filter((e) => !e.recurrence?.frequency && !e.recurrenceId)

    result.push(...normal.map(({ exceptions, ...e }) => ({
      ...e, optimisticKey: `event-${e.id}`,
    })))

    result.push(...overrides.map(({ exceptions, ...e }) => ({
      ...e, isOccurrence: true, optimisticKey: `event-${e.id}`,
    })))

    for (const parent of parents) {
      const exceptions = new Set(
        (parent.exceptions ?? []).map((ex) => new Date(ex.date).toISOString().slice(0, 10)),
      )
      const overrideDates = new Set(
        overrides
          .filter((o) => o.recurrenceId === parent.id)
          .map((o) => new Date(o.originalDate ?? o.startDate).toISOString().slice(0, 10)),
      )
      const allExceptions = new Set([...exceptions, ...overrideDates])
      const occurrences = generateOccurrences(parent, from, to, allExceptions)
      for (const occ of occurrences) {
        const occIso = occ.date.toISOString()
        result.push({
          id: parent.id, title: parent.title, description: parent.description,
          startDate: occIso, endDate: occ.endDate.toISOString(),
          allDay: parent.allDay, color: parent.color, categoryId: parent.categoryId,
          recurrence: parent.recurrence, recurrenceId: null,
          originalDate: occIso, isOccurrence: true, occurrenceDate: occIso,
          optimisticKey: `event-${parent.id}-${occIso}`,
          type: 'event',
        })
      }
    }
    return result
  }, [rawEvents, from, to])

  const tasks: CalendarTask[] = useMemo(() => {
    const allTasks = (tasksData?.docs ?? []) as Task[]
    return allTasks.filter((t) => t.dueDate && t.status === 'active').map((t) => {
      type ListObj = { name: string; slug: string; category?: { color?: string | null } | null }
      const list = t.list && typeof t.list === 'object' ? (t.list as ListObj) : null
      return {
        id: t.id, title: t.title, dueDate: t.dueDate!,
        listName: list?.name ?? '', listColor: list?.category?.color ?? '#8b5cf6',
        listSlug: list?.slug ?? '', type: 'task' as const,
      }
    })
  }, [tasksData])

  const eventsWithOverrides = useMemo(
    () => events.map((e) => {
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
    () => tasks.map((t) => {
      const override = optimisticOverrides.get(`task-${t.id}`)
      return override ? { ...t, dueDate: override.startDate ?? t.dueDate } : t
    }),
    [tasks, optimisticOverrides],
  )

  const setOptimisticMove = useCallback((key: string, startDate: string) => {
    setOptimisticOverrides((prev) => { const next = new Map(prev); next.set(key, { startDate }); return next })
  }, [])

  const setOptimisticResize = useCallback((key: string, endDate: string) => {
    setOptimisticOverrides((prev) => {
      const next = new Map(prev)
      next.set(key, { ...prev.get(key), endDate })
      return next
    })
  }, [])

  const clearOptimistic = useCallback((key: string) => {
    setOptimisticOverrides((prev) => { const next = new Map(prev); next.delete(key); return next })
  }, [])

  const setOptimisticDate = useCallback((type: 'event' | 'task', id: number, date: string) => {
    setOptimisticOverrides((prev) => {
      const next = new Map(prev); next.set(`${type}-${id}`, { startDate: date }); return next
    })
  }, [])

  const clearOptimisticDate = useCallback((type: 'event' | 'task', id: number) => {
    setOptimisticOverrides((prev) => { const next = new Map(prev); next.delete(`${type}-${id}`); return next })
  }, [])

  const getItemDisplayHeight = useCallback((item: CalendarItem): number => {
    if (item.type === 'event') {
      const key = (item as CalendarEvent).optimisticKey ?? `event-${item.id}`
      const override = optimisticOverrides.get(key)
      const startDate = new Date(override?.startDate ?? item.startDate)
      const endDate = new Date(override?.endDate ?? item.endDate)
      const durationMin = Math.max(MIN_DURATION_MIN, (endDate.getTime() - startDate.getTime()) / 60000)
      return minutesToPx(durationMin)
    } else {
      const override = optimisticOverrides.get(`task-${item.id}`)
      if (override?.endDate) {
        const durationMin = Math.max(MIN_DURATION_MIN,
          (new Date(override.endDate).getTime() - new Date(item.dueDate).getTime()) / 60000)
        return minutesToPx(durationMin)
      }
      return minutesToPx(30)
    }
  }, [optimisticOverrides])

  const createMutation = useMutation({
    mutationFn: (data: CalendarEventData) => api.calendar.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      toast.success('Event created')
      setDialogOpen(false)
    },
    onError: () => toast.error('Failed to create event'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data, scope, originalDate }: {
      id: number
      data: Partial<CalendarEventData>
      scope?: EditScope
      originalDate?: string
      optimisticKey?: string
    }) => api.calendar.update(id, data, scope, originalDate),

    onMutate: async ({ id, data, scope, optimisticKey: key }) => {
      if (!scope || scope === 'all') {
        await queryClient.cancelQueries({ queryKey: ['calendar-events'] })

        const snapshot = queryClient.getQueriesData({ queryKey: ['calendar-events'] })
        queryClient.setQueriesData<{ docs: any[] }>(
          { queryKey: ['calendar-events'] },
          (old) => {
            if (!old) return old
            return { ...old, docs: old.docs.map((e) => e.id === id ? { ...e, ...data } : e) }
          }
        )
        if (key) clearOptimistic(key)
        else clearOptimisticDate('event', id)

        return { snapshot, key }
      }
      return { snapshot: null, key }
    },

    onSuccess: (_, { id, scope, optimisticKey: key }, context: any) => {
      if (!scope || scope === 'all') {
      } else {
        if (key) clearOptimistic(key)
        else clearOptimisticDate('event', id)
        Promise.resolve().then(() => {
          queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
        })
      }
      if (dialogOpen) { toast.success('Event updated'); setDialogOpen(false) }
    },

    onError: (_, { id, optimisticKey: key }, context: any) => {
      if (context?.snapshot) {
        for (const [queryKey, data] of context.snapshot) {
          queryClient.setQueryData(queryKey, data)
        }
      }
      if (key) clearOptimistic(key)
      else clearOptimisticDate('event', id)
      toast.error('Failed to update event')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id, scope, originalDate }: {
      id: number; scope?: EditScope; originalDate?: string
    }) => api.calendar.delete(id, scope, originalDate),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['calendar-events'] })
      const snapshot = queryClient.getQueriesData({ queryKey: ['calendar-events'] })
      queryClient.setQueriesData<{ docs: any[] }>(
        { queryKey: ['calendar-events'] },
        (old) => old ? { ...old, docs: old.docs.filter((e) => e.id !== id) } : old
      )
      return { snapshot }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
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
        return { ...old, docs: old.docs.map((t) => t.id === id ? { ...t, dueDate } : t) }
      })
      clearOptimisticDate('task', id)
      return { snapshot }
    },
    onSuccess: () => {
    },
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

  const navigate = useCallback((direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') { setCurrentDate(new Date()); return }
    setCurrentDate((prev) => {
      const d = new Date(prev)
      switch (view) {
        case 'year': d.setFullYear(d.getFullYear() + (direction === 'next' ? 1 : -1)); break
        case 'month': d.setMonth(d.getMonth() + (direction === 'next' ? 1 : -1)); break
        case 'week': d.setDate(d.getDate() + (direction === 'next' ? 7 : -7)); break
        case 'day': d.setDate(d.getDate() + (direction === 'next' ? 1 : -1)); break
      }
      return d
    })
  }, [view])

  const openNewEvent = useCallback((date: Date) => {
    setNewEventDate(date); setSelectedItem(null); setDialogOpen(true)
  }, [])

  const openEdit = useCallback((item: CalendarItem) => {
    setSelectedItem(item); setDialogOpen(true)
  }, [])

  const moveEvent = useCallback((
    id: number,
    newStartDate: Date,
    scope?: EditScope,
    originalDate?: string,
    eventOptimisticKey?: string,
  ) => {
    const event = events.find((e) =>
      eventOptimisticKey ? e.optimisticKey === eventOptimisticKey : e.id === id && !e.isOccurrence
    ) ?? events.find((e) => e.id === id)
    if (!event) return

    const key = event.optimisticKey ?? `event-${id}`
    const duration = new Date(event.endDate).getTime() - new Date(event.startDate).getTime()

    setOptimisticMove(key, newStartDate.toISOString())

    updateMutation.mutate({
      id,
      data: {
        startDate: newStartDate.toISOString(),
        endDate: new Date(newStartDate.getTime() + duration).toISOString(),
      },
      scope: scope ?? (event.isOccurrence ? 'this' : 'all'),
      originalDate: originalDate ?? event.occurrenceDate ?? event.startDate,
      optimisticKey: key,
    })
  }, [events, updateMutation, setOptimisticMove])

  const resizeEvent = useCallback((
    id: number,
    newEndDate: Date,
    scope?: EditScope,
    originalDate?: string,
    eventOptimisticKey?: string,
  ) => {
    const event = events.find((e) =>
      eventOptimisticKey ? e.optimisticKey === eventOptimisticKey : e.id === id && !e.isOccurrence
    ) ?? events.find((e) => e.id === id)

    const key = event?.optimisticKey ?? `event-${id}`

    setOptimisticResize(key, newEndDate.toISOString())

    updateMutation.mutate({
      id,
      data: { endDate: newEndDate.toISOString() },
      scope: scope ?? (event?.isOccurrence ? 'this' : 'all'),
      originalDate: originalDate ?? event?.occurrenceDate ?? event?.startDate,
      optimisticKey: key,
    })
  }, [updateMutation, events, setOptimisticResize])

  const moveTask = useCallback((id: number, newDueDate: Date) => {
    setOptimisticOverrides((prev) => {
      const next = new Map(prev); next.set(`task-${id}`, { startDate: newDueDate.toISOString() }); return next
    })
    moveTaskMutation.mutate({ id, dueDate: newDueDate.toISOString() })
  }, [moveTaskMutation])

  const resizeTask = useCallback((id: number, newEndDate: Date) => {
    setOptimisticOverrides((prev) => {
      const next = new Map(prev); next.set(`task-end-${id}`, { endDate: newEndDate.toISOString() }); return next
    })
    moveTaskMutation.mutate({ id, dueDate: newEndDate.toISOString() })
  }, [moveTaskMutation])

  const getItemsForDate = useCallback((date: Date): CalendarItem[] => {
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
      const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999)
      return start <= dayEnd && end >= dayStart
    })

    const dayTasks = tasksWithOverrides.filter((t) => sameLocalDate(t.dueDate))

    return [...dayEvents, ...dayTasks].sort((a, b) => {
      const aDate = a.type === 'event' ? a.startDate : a.dueDate
      const bDate = b.type === 'event' ? b.startDate : b.dueDate
      return new Date(aDate).getTime() - new Date(bDate).getTime()
    })
  }, [eventsWithOverrides, tasksWithOverrides, isCategoryVisible])

  return {
    view, setView, currentDate, setCurrentDate, navigate,
    events: eventsWithOverrides, tasks: tasksWithOverrides,
    from, to, selectedItem, dialogOpen, setDialogOpen,
    newEventDate, openNewEvent, openEdit,
    moveEvent, moveTask, moveTaskMutation,
    resizeEvent, resizeTask,
    getItemsForDate, getItemDisplayHeight,
    createMutation, updateMutation, deleteMutation,
    setOptimisticDate,
  }
}