'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import {
  listCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  type CalendarEventData,
} from '@/api/calendar/actions'
import type { Task } from '@/payload-types'
import { toast } from 'sonner'

export type CalendarView = 'month' | 'week' | 'day'

export interface CalendarEvent {
  id: number
  title: string
  description?: string
  startDate: string
  endDate: string
  allDay: boolean
  color: string
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

function getViewRange(date: Date, view: CalendarView): { from: Date; to: Date } {
  const y = date.getFullYear()
  const m = date.getMonth()
  const d = date.getDate()

  switch (view) {
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
    case 'day': {
      const from = new Date(y, m, d, 0, 0, 0)
      const to = new Date(y, m, d, 23, 59, 59)
      return { from, to }
    }
  }
}

export const useCalendar = () => {
  const [view, setView] = useState<CalendarView>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newEventDate, setNewEventDate] = useState<Date | null>(null)

  const queryClient = useQueryClient()
  const { from, to } = getViewRange(currentDate, view)

  const { data: eventsData } = useQuery({
    queryKey: ['calendar-events', from.toISOString(), to.toISOString()],
    queryFn: () => listCalendarEvents(from.toISOString(), to.toISOString()),
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

  const createMutation = useMutation({
    mutationFn: (data: CalendarEventData) => createCalendarEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      toast.success('Event created')
      setDialogOpen(false)
    },
    onError: () => toast.error('Failed to create event'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CalendarEventData> }) =>
      updateCalendarEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      toast.success('Event updated')
      setDialogOpen(false)
    },
    onError: () => toast.error('Failed to update event'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCalendarEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
      toast.success('Event deleted')
      setDialogOpen(false)
      setSelectedItem(null)
    },
    onError: () => toast.error('Failed to delete event'),
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
      const duration = new Date(event.endDate).getTime() - new Date(event.startDate).getTime()
      const newEndDate = new Date(newStartDate.getTime() + duration)
      updateMutation.mutate({
        id,
        data: {
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString(),
        },
      })
    },
    [events, updateMutation],
  )

  const getItemsForDate = useCallback(
    (date: Date): CalendarItem[] => {
      const dateStr = date.toDateString()
      const dayEvents = events.filter((e) => new Date(e.startDate).toDateString() === dateStr)
      const dayTasks = tasks.filter((t) => new Date(t.dueDate).toDateString() === dateStr)
      return [...dayEvents, ...dayTasks].sort((a, b) => {
        const aDate = a.type === 'event' ? a.startDate : a.dueDate
        const bDate = b.type === 'event' ? b.startDate : b.dueDate
        return new Date(aDate).getTime() - new Date(bDate).getTime()
      })
    },
    [events, tasks],
  )

  return {
    view,
    setView,
    currentDate,
    setCurrentDate,
    navigate,
    events,
    tasks,
    from,
    to,
    selectedItem,
    dialogOpen,
    setDialogOpen,
    newEventDate,
    openNewEvent,
    openEdit,
    moveEvent,
    getItemsForDate,
    createMutation,
    updateMutation,
    deleteMutation,
  }
}
