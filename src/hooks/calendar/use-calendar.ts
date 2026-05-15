'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import { type CalendarEventData } from '@/api/calendar/actions'
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

function minutesToPx(minutes: number) {
  return (minutes / 60) * SLOT_HEIGHT
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
      const from = new Date(y, m, d - date.getDay())
      from.setHours(0, 0, 0)
      const to = new Date(from)
      to.setDate(to.getDate() + 6)
      to.setHours(23, 59, 59)
      return { from, to }
    }
    case 'day':
      return { from: new Date(y, m, d, 0, 0, 0), to: new Date(y, m, d, 23, 59, 59) }
  }
}

export const useCalendar = () => {
  const [view, setView] = useState<CalendarView>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newEventDate, setNewEventDate] = useState<Date | null>(null)
  const [optimisticOverrides, setOptimisticOverrides] = useState<Map<string, string>>(new Map())

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

  const events: CalendarEvent[] = useMemo(
    () =>
      (eventsData?.docs ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description ?? undefined,
        startDate: e.startDate,
        endDate: e.endDate,
        allDay: e.allDay ?? false,
        color: e.color ?? '#8b5cf6',
        categoryId: typeof e.categoryId === 'number' ? e.categoryId : null,
        type: 'event' as const,
      })),
    [eventsData],
  )

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
        const startOverride = optimisticOverrides.get(`event-${e.id}`)
        const endOverride = optimisticOverrides.get(`event-end-${e.id}`)
        if (!startOverride && !endOverride) return e
        const newStart = startOverride ?? e.startDate
        const newEnd = endOverride
          ? endOverride
          : startOverride
            ? new Date(
                new Date(startOverride).getTime() +
                  (new Date(e.endDate).getTime() - new Date(e.startDate).getTime()),
              ).toISOString()
            : e.endDate
        return { ...e, startDate: newStart, endDate: newEnd }
      }),
    [events, optimisticOverrides],
  )

  const tasksWithOverrides = useMemo(
    () =>
      tasks.map((t) => {
        const override = optimisticOverrides.get(`task-${t.id}`)
        if (!override) return t
        return { ...t, dueDate: override }
      }),
    [tasks, optimisticOverrides],
  )

  const setOptimisticDate = useCallback((type: 'event' | 'task', id: number, date: string) => {
    setOptimisticOverrides((prev) => {
      const next = new Map(prev)
      next.set(`${type}-${id}`, date)
      return next
    })
  }, [])

  const clearOptimisticDate = useCallback((type: 'event' | 'task', id: number) => {
    setOptimisticOverrides((prev) => {
      const next = new Map(prev)
      next.delete(`${type}-${id}`)
      next.delete(`${type}-end-${id}`)
      return next
    })
  }, [])

  const getItemDisplayHeight = useCallback(
    (item: CalendarItem): number => {
      if (item.type === 'event') {
        const endOverride = optimisticOverrides.get(`event-end-${item.id}`)
        const endDate = endOverride ? new Date(endOverride) : new Date(item.endDate)
        const startDate = new Date(item.startDate)
        const durationMin = Math.max(
          MIN_DURATION_MIN,
          (endDate.getTime() - startDate.getTime()) / 60000,
        )
        return minutesToPx(durationMin)
      } else {
        const endOverride = optimisticOverrides.get(`task-end-${item.id}`)
        if (endOverride) {
          const endDate = new Date(endOverride)
          const startDate = new Date(item.dueDate)
          const durationMin = Math.max(
            MIN_DURATION_MIN,
            (endDate.getTime() - startDate.getTime()) / 60000,
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
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      toast.success('Event created')
      setDialogOpen(false)
    },
    onError: () => toast.error('Failed to create event'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CalendarEventData> }) =>
      api.calendar.update(id, data),
    onSuccess: (updatedEvent, { id, data }) => {
      queryClient.setQueriesData<{ docs: any[] }>({ queryKey: ['calendar-events'] }, (old) => {
        if (!old) return old
        return {
          ...old,
          docs: old.docs.map((e) => (e.id === id ? { ...e, ...data } : e)),
        }
      })
      clearOptimisticDate('event', id)
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      }, 1000)
      if (dialogOpen) {
        toast.success('Event updated')
        setDialogOpen(false)
      }
    },
    onError: (_, { id }) => {
      clearOptimisticDate('event', id)
      toast.error('Failed to update event')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.calendar.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      toast.success('Event deleted')
      setDialogOpen(false)
      setSelectedItem(null)
    },
    onError: () => toast.error('Failed to delete event'),
  })

  const moveTaskMutation = useMutation({
    mutationFn: ({ id, dueDate }: { id: number; dueDate: string }) =>
      api.tasks.edit(id, { dueDate }),
    onSuccess: (_, { id, dueDate }) => {
      queryClient.setQueriesData<{ docs: any[] }>({ queryKey: ['tasks'] }, (old) => {
        if (!old) return old
        return {
          ...old,
          docs: old.docs.map((t) => (t.id === id ? { ...t, dueDate } : t)),
        }
      })
      clearOptimisticDate('task', id)
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
      }, 1000)
    },
    onError: (_, { id }) => {
      clearOptimisticDate('task', id)
      toast.error('Failed to reschedule task')
    },
  })

  const navigate = useCallback(
    (direction: 'prev' | 'next' | 'today') => {
      if (direction === 'today') {
        setCurrentDate(new Date())
        return
      }
      setCurrentDate((prev) => {
        const d = new Date(prev)
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
        return d
      })
    },
    [view],
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
    (id: number, newStartDate: Date) => {
      const event = events.find((e) => e.id === id)
      if (!event) return
      setOptimisticDate('event', id, newStartDate.toISOString())
      const duration = new Date(event.endDate).getTime() - new Date(event.startDate).getTime()
      updateMutation.mutate({
        id,
        data: {
          startDate: newStartDate.toISOString(),
          endDate: new Date(newStartDate.getTime() + duration).toISOString(),
        },
      })
    },
    [events, updateMutation, setOptimisticDate],
  )

  const moveTask = useCallback(
    (id: number, newDueDate: Date) => {
      setOptimisticDate('task', id, newDueDate.toISOString())
      moveTaskMutation.mutate({ id, dueDate: newDueDate.toISOString() })
    },
    [moveTaskMutation, setOptimisticDate],
  )

  const resizeEvent = useCallback(
    (id: number, newEndDate: Date) => {
      setOptimisticOverrides((prev) => {
        const next = new Map(prev)
        next.set(`event-end-${id}`, newEndDate.toISOString())
        return next
      })
      updateMutation.mutate({ id, data: { endDate: newEndDate.toISOString() } })
    },
    [updateMutation],
  )

  const resizeTask = useCallback(
    (id: number, newEndDate: Date) => {
      setOptimisticOverrides((prev) => {
        const next = new Map(prev)
        next.set(`task-end-${id}`, newEndDate.toISOString())
        return next
      })
      moveTaskMutation.mutate({ id, dueDate: newEndDate.toISOString() })
    },
    [moveTaskMutation],
  )

  const getItemsForDate = useCallback(
    (date: Date): CalendarItem[] => {
      const dateStr = date.toDateString()
      const dayEvents = eventsWithOverrides.filter(
        (e) => new Date(e.startDate).toDateString() === dateStr && isCategoryVisible(e.categoryId),
      )
      const dayTasks = tasksWithOverrides.filter(
        (t) => new Date(t.dueDate).toDateString() === dateStr,
      )
      return [...dayEvents, ...dayTasks].sort((a, b) => {
        const aDate = a.type === 'event' ? a.startDate : a.dueDate
        const bDate = b.type === 'event' ? b.startDate : b.dueDate
        return new Date(aDate).getTime() - new Date(bDate).getTime()
      })
    },
    [eventsWithOverrides, tasksWithOverrides, isCategoryVisible],
  )

  return {
    view,
    setView,
    currentDate,
    setCurrentDate,
    navigate,
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
