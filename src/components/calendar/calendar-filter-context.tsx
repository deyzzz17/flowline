'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface CalendarFilterContextValue {
  hiddenCategories: Set<number>
  toggleCategory: (id: number) => void
  isCategoryVisible: (id: number | null | undefined) => boolean
  hiddenGoogleCalendars: Set<string>
  toggleGoogleCalendar: (googleCalendarId: string) => void
  isGoogleCalendarVisible: (googleCalendarId: string | null | undefined) => boolean
  habitsVisible: boolean
  toggleHabits: () => void
}

const CalendarFilterContext = createContext<CalendarFilterContextValue>({
  hiddenCategories: new Set(),
  toggleCategory: () => {},
  isCategoryVisible: () => true,
  hiddenGoogleCalendars: new Set(),
  toggleGoogleCalendar: () => {},
  isGoogleCalendarVisible: () => true,
  habitsVisible: true,
  toggleHabits: () => {},
})

export function CalendarFilterProvider({ children }: { children: ReactNode }) {
  const [hiddenCategories, setHiddenCategories] = useState<Set<number>>(new Set())
  const [hiddenGoogleCalendars, setHiddenGoogleCalendars] = useState<Set<string>>(new Set())
  const [habitsVisible, setHabitsVisible] = useState(true)

  const toggleCategory = useCallback((id: number) => {
    setHiddenCategories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const isCategoryVisible = useCallback(
    (id: number | null | undefined) => {
      if (!id) return true
      return !hiddenCategories.has(id)
    },
    [hiddenCategories],
  )

  const toggleGoogleCalendar = useCallback((googleCalendarId: string) => {
    setHiddenGoogleCalendars((prev) => {
      const next = new Set(prev)
      if (next.has(googleCalendarId)) next.delete(googleCalendarId)
      else next.add(googleCalendarId)
      return next
    })
  }, [])

  const isGoogleCalendarVisible = useCallback(
    (googleCalendarId: string | null | undefined) => {
      if (!googleCalendarId) return true
      return !hiddenGoogleCalendars.has(googleCalendarId)
    },
    [hiddenGoogleCalendars],
  )

  const toggleHabits = useCallback(() => {
    setHabitsVisible((prev) => !prev)
  }, [])

  const value = useMemo(
    () => ({
      hiddenCategories,
      toggleCategory,
      isCategoryVisible,
      hiddenGoogleCalendars,
      toggleGoogleCalendar,
      isGoogleCalendarVisible,
      habitsVisible,
      toggleHabits,
    }),
    [
      hiddenCategories,
      toggleCategory,
      isCategoryVisible,
      hiddenGoogleCalendars,
      toggleGoogleCalendar,
      isGoogleCalendarVisible,
      habitsVisible,
      toggleHabits,
    ],
  )

  return <CalendarFilterContext.Provider value={value}>{children}</CalendarFilterContext.Provider>
}

export const useCalendarFilter = () => useContext(CalendarFilterContext)
