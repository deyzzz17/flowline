import type { CalendarItem } from '@/hooks/calendar/use-calendar'
import { getItemTop, getItemHeight } from './calendar-event-block'

interface ColumnLayout {
  item: CalendarItem
  column: number
  totalColumns: number
}

export function computeColumns(items: CalendarItem[]): ColumnLayout[] {
  if (items.length === 0) return []

  const sorted = [...items].sort((a, b) => {
    const aStart = new Date(a.type === 'event' ? a.startDate : a.dueDate).getTime()
    const bStart = new Date(b.type === 'event' ? b.startDate : b.dueDate).getTime()
    return aStart - bStart
  })

  const groups: CalendarItem[][] = []
  let currentGroup: CalendarItem[] = []
  let groupEnd = 0

  for (const item of sorted) {
    const start = new Date(item.type === 'event' ? item.startDate : item.dueDate).getTime()
    const top = getItemTop(item)
    const height = getItemHeight(item)
    const end = top + height

    if (currentGroup.length === 0 || start < groupEnd) {
      currentGroup.push(item)
      groupEnd = Math.max(groupEnd, end)
    } else {
      groups.push([...currentGroup])
      currentGroup = [item]
      groupEnd = end
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup)

  const result: ColumnLayout[] = []

  for (const group of groups) {
    const columns: CalendarItem[][] = []

    for (const item of group) {
      const itemTop = getItemTop(item)

      let placed = false
      for (let col = 0; col < columns.length; col++) {
        const lastInCol = columns[col][columns[col].length - 1]
        const lastTop = getItemTop(lastInCol)
        const lastBottom = lastTop + getItemHeight(lastInCol)

        if (itemTop >= lastBottom) {
          columns[col].push(item)
          placed = true
          break
        }
      }
      if (!placed) columns.push([item])
    }

    const totalColumns = columns.length
    columns.forEach((col, colIndex) => {
      col.forEach((item) => {
        result.push({ item, column: colIndex, totalColumns })
      })
    })
  }

  return result
}