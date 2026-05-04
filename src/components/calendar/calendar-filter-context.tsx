'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface CalendarFilterContextValue {
  hiddenCategories: Set<number>
  toggleCategory: (id: number) => void
  isCategoryVisible: (id: number | null | undefined) => boolean
}

const CalendarFilterContext = createContext<CalendarFilterContextValue>({
  hiddenCategories: new Set(),
  toggleCategory: () => {},
  isCategoryVisible: () => true,
})

export function CalendarFilterProvider({ children }: { children: ReactNode }) {
  const [hiddenCategories, setHiddenCategories] = useState<Set<number>>(new Set())

  const toggleCategory = (id: number) => {
    setHiddenCategories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isCategoryVisible = (id: number | null | undefined) => {
    if (!id) return true
    return !hiddenCategories.has(id)
  }

  return (
    <CalendarFilterContext.Provider value={{ hiddenCategories, toggleCategory, isCategoryVisible }}>
      {children}
    </CalendarFilterContext.Provider>
  )
}

export const useCalendarFilter = () => useContext(CalendarFilterContext)