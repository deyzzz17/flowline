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

const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

function getTodayKey(timezone = 'UTC'): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date())
}

function getDateKey(date: Date, timezone = 'UTC'): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(date)
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export interface HabitData {
  name: string
  description?: string
  color?: string
  categoryTag?: string
  frequency: 'daily' | 'days_of_week' | 'times_per_week'
  daysOfWeek?: string[]
  timesPerWeek?: number
  order?: number
}

export interface HabitWithStats {
  id: number
  name: string
  description?: string | null
  color: string
  categoryTag?: string | null
  frequency: 'daily' | 'days_of_week' | 'times_per_week'
  daysOfWeek?: string[]
  timesPerWeek?: number
  currentStreak: number
  longestStreak: number
  completedToday: boolean
  completionRate30d: number
  order: number
}

export interface HabitDetail extends HabitWithStats {
  completions: string[] 
  weeklyCompletions: { week: string; count: number; target: number }[]
}

export interface HabitAnalytics {
  totalHabits: number
  avgCompletionRate: number
  bestStreak: { habitName: string; streak: number } | null
  todayCompleted: number
  todayTotal: number
  heatmapData: { date: string; count: number; total: number }[]
  perHabit: {
    id: number
    name: string
    color: string
    currentStreak: number
    longestStreak: number
    completionRate30d: number
  }[]
}

function computeStreaks(
  completionDates: Set<string>,
  habit: { frequency: string; daysOfWeek?: string[]; timesPerWeek?: number },
  timezone = 'UTC',
): { current: number; longest: number } {
  const today = getTodayKey(timezone)

  if (habit.frequency === 'daily') {
    let current = 0
    let d = today
    while (completionDates.has(d)) {
      current++
      const prev = new Date(d)
      prev.setDate(prev.getDate() - 1)
      d = getDateKey(prev)
    }

    // Longest streak
    const sorted = Array.from(completionDates).sort()
    let longest = 0
    let run = 0
    let prev = ''
    for (const dateStr of sorted) {
      if (prev) {
        const prevDate = new Date(prev)
        prevDate.setDate(prevDate.getDate() + 1)
        if (getDateKey(prevDate) === dateStr) {
          run++
        } else {
          run = 1
        }
      } else {
        run = 1
      }
      if (run > longest) longest = run
      prev = dateStr
    }

    return { current, longest }
  }

  if (habit.frequency === 'days_of_week' && habit.daysOfWeek?.length) {
    const targetDays = new Set(habit.daysOfWeek)

    const isDayTarget = (dateStr: string) => {
      const day = DAY_NAMES[new Date(dateStr + 'T12:00:00').getDay()]
      return targetDays.has(day)
    }

    let current = 0
    let d = new Date(today + 'T12:00:00')
    while (true) {
      const key = getDateKey(d)
      if (key > today) { d = addDays(d, -1); continue }
      if (isDayTarget(key)) {
        if (completionDates.has(key)) {
          current++
        } else if (key === today) {
        } else {
          break
        }
      }
      d = addDays(d, -1)
      if (d < new Date('2020-01-01')) break
    }

    return { current, longest: current } 
  }

  if (habit.frequency === 'times_per_week') {
    const target = habit.timesPerWeek ?? 1
    const weekMap = new Map<string, number>()
    for (const dateStr of completionDates) {
      const d = new Date(dateStr + 'T12:00:00')
      const dow = d.getDay()
      const monday = new Date(d)
      monday.setDate(d.getDate() - ((dow + 6) % 7))
      const weekKey = getDateKey(monday)
      weekMap.set(weekKey, (weekMap.get(weekKey) ?? 0) + 1)
    }

    const todayDate = new Date(today + 'T12:00:00')
    const todayDow = todayDate.getDay()
    const currentMonday = new Date(todayDate)
    currentMonday.setDate(todayDate.getDate() - ((todayDow + 6) % 7))

    let current = 0
    let weekStart = new Date(currentMonday)
    while (true) {
      const wk = getDateKey(weekStart)
      const count = weekMap.get(wk) ?? 0
      if (count >= target) {
        current++
      } else if (wk === getDateKey(currentMonday)) {
      } else {
        break
      }
      weekStart = addDays(weekStart, -7)
      if (weekStart < new Date('2020-01-01')) break
    }

    return { current, longest: current }
  }

  return { current: 0, longest: 0 }
}

function computeCompletionRate(
  completionDates: Set<string>,
  habit: { frequency: string; daysOfWeek?: string[]; timesPerWeek?: number },
  timezone = 'UTC',
  days = 30,
): number {
  const today = new Date(getTodayKey(timezone) + 'T12:00:00')
  let targets = 0
  let completed = 0

  for (let i = 0; i < days; i++) {
    const d = addDays(today, -i)
    const key = getDateKey(d)

    if (habit.frequency === 'daily') {
      targets++
      if (completionDates.has(key)) completed++
    } else if (habit.frequency === 'days_of_week' && habit.daysOfWeek?.length) {
      const dayName = DAY_NAMES[d.getDay()]
      if (habit.daysOfWeek.includes(dayName)) {
        targets++
        if (completionDates.has(key)) completed++
      }
    }
  }

  if (habit.frequency === 'times_per_week') {
    const target = habit.timesPerWeek ?? 1
    const weeks = Math.ceil(days / 7)
    for (let w = 0; w < weeks; w++) {
      const weekStart = addDays(today, -w * 7 - ((today.getDay() + 6) % 7))
      let weekCount = 0
      for (let d = 0; d < 7; d++) {
        const day = addDays(weekStart, d)
        if (day > today) continue
        if (completionDates.has(getDateKey(day))) weekCount++
      }
      targets += target
      completed += Math.min(weekCount, target)
    }
  }

  return targets > 0 ? Math.round((completed / targets) * 100) : 0
}

export const listHabits = async (): Promise<HabitWithStats[]> => {
  const userId = await getUserId()
  if (!userId) return []

  const payload = await getPayload({ config })

  const { docs: habits } = await payload.find({
    collection: 'habits',
    where: {
      and: [
        { userId: { equals: userId } },
        { archivedAt: { exists: false } },
      ],
    },
    sort: 'order',
    limit: 0,
  })

  if (habits.length === 0) return []

  const thirtyDaysAgo = addDays(new Date(), -30)
  const { docs: completions } = await payload.find({
    collection: 'habit-completions',
    where: {
      and: [
        { userId: { equals: userId } },
        { completedAt: { greater_than_equal: thirtyDaysAgo.toISOString() } },
      ],
    },
    limit: 0,
  })

  const today = getTodayKey()

  return habits.map((habit) => {
    const habitCompletions = completions.filter((c) => c.habitId === habit.id)
    const completionDates = new Set(
      habitCompletions.map((c) => getDateKey(new Date(c.completedAt as string))),
    )

    const { current, longest } = computeStreaks(completionDates, habit as any)
    const rate = computeCompletionRate(completionDates, habit as any)
    const completedToday = completionDates.has(today)

    return {
      id: habit.id,
      name: habit.name,
      description: (habit as any).description ?? null,
      color: (habit as any).color ?? '#8b5cf6',
      categoryTag: (habit as any).categoryTag ?? null,
      frequency: habit.frequency as any,
      daysOfWeek: (habit as any).daysOfWeek ?? [],
      timesPerWeek: (habit as any).timesPerWeek ?? undefined,
      currentStreak: current,
      longestStreak: longest,
      completedToday,
      completionRate30d: rate,
      order: (habit as any).order ?? 0,
    }
  })
}

export const getHabitDetail = async (habitId: number): Promise<HabitDetail | null> => {
  const userId = await getUserId()
  if (!userId) return null

  const payload = await getPayload({ config })
  const habit = await payload.findByID({ collection: 'habits', id: habitId })
  if (!habit || (habit as any).userId !== userId) return null

  const ninetyDaysAgo = addDays(new Date(), -90)
  const { docs: completions } = await payload.find({
    collection: 'habit-completions',
    where: {
      and: [
        { userId: { equals: userId } },
        { habitId: { equals: habitId } },
        { completedAt: { greater_than_equal: ninetyDaysAgo.toISOString() } },
      ],
    },
    limit: 0,
  })

  const completionDates = new Set(
    completions.map((c) => getDateKey(new Date(c.completedAt as string))),
  )

  const { current, longest } = computeStreaks(completionDates, habit as any)
  const rate = computeCompletionRate(completionDates, habit as any)
  const today = getTodayKey()

  const weeklyCompletions = Array.from({ length: 12 }, (_, i) => {
    const weekStart = addDays(new Date(today + 'T12:00:00'), -i * 7 - (new Date().getDay() + 6) % 7)
    let count = 0
    let target = 0
    for (let d = 0; d < 7; d++) {
      const day = addDays(weekStart, d)
      if (day > new Date()) continue
      const key = getDateKey(day)
      const dayName = DAY_NAMES[day.getDay()]

      if ((habit as any).frequency === 'daily') {
        target++
        if (completionDates.has(key)) count++
      } else if ((habit as any).frequency === 'days_of_week') {
        if (((habit as any).daysOfWeek ?? []).includes(dayName)) {
          target++
          if (completionDates.has(key)) count++
        }
      } else {
        target = (habit as any).timesPerWeek ?? 1
        if (completionDates.has(key)) count++
      }
    }
    const weekLabel = getDateKey(weekStart)
    return { week: weekLabel, count, target }
  }).reverse()

  return {
    id: habit.id,
    name: habit.name,
    description: (habit as any).description ?? null,
    color: (habit as any).color ?? '#8b5cf6',
    categoryTag: (habit as any).categoryTag ?? null,
    frequency: (habit as any).frequency,
    daysOfWeek: (habit as any).daysOfWeek ?? [],
    timesPerWeek: (habit as any).timesPerWeek ?? undefined,
    currentStreak: current,
    longestStreak: longest,
    completedToday: completionDates.has(today),
    completionRate30d: rate,
    order: (habit as any).order ?? 0,
    completions: Array.from(completionDates).sort(),
    weeklyCompletions,
  }
}

export const createHabit = async (data: HabitData) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const habit = await payload.create({
      collection: 'habits',
      data: {
        userId,
        name: data.name,
        description: data.description,
        color: data.color ?? '#8b5cf6',
        categoryTag: data.categoryTag,
        frequency: data.frequency,
        daysOfWeek: data.daysOfWeek as any,
        timesPerWeek: data.timesPerWeek,
        order: data.order ?? 0,
      },
    })
    return ok(habit)
  } catch (e) {
    console.error(e)
    return err('Error creating habit')
  }
}

export const updateHabit = async (id: number, data: Partial<HabitData>) => {
  try {
    const payload = await getPayload({ config })
    const updated = await payload.update({
      collection: 'habits',
      id,
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.categoryTag !== undefined && { categoryTag: data.categoryTag }),
        ...(data.frequency !== undefined && { frequency: data.frequency }),
        ...(data.daysOfWeek !== undefined && { daysOfWeek: data.daysOfWeek as any }),
        ...(data.timesPerWeek !== undefined && { timesPerWeek: data.timesPerWeek }),
        ...(data.order !== undefined && { order: data.order }),
      },
    })
    return ok(updated)
  } catch {
    return err('Error updating habit')
  }
}

export const archiveHabit = async (id: number) => {
  try {
    const payload = await getPayload({ config })
    await payload.update({
      collection: 'habits',
      id,
      data: { archivedAt: new Date().toISOString() } as any,
    })
    return ok(true)
  } catch {
    return err('Error archiving habit')
  }
}

export const deleteHabit = async (id: number) => {
  try {
    const payload = await getPayload({ config })
    await payload.delete({ collection: 'habits', id })
    const { docs } = await payload.find({
      collection: 'habit-completions',
      where: { habitId: { equals: id } },
      limit: 0,
    })
    for (const c of docs) await payload.delete({ collection: 'habit-completions', id: c.id })
    return ok(true)
  } catch {
    return err('Error deleting habit')
  }
}

export const toggleHabitCompletion = async (habitId: number, dateStr?: string) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')

    const payload = await getPayload({ config })
    const targetDate = dateStr ?? getTodayKey()

    // Check if already completed
    const { docs: existing } = await payload.find({
      collection: 'habit-completions',
      where: {
        and: [
          { userId: { equals: userId } },
          { habitId: { equals: habitId } },
          { completedAt: { greater_than_equal: new Date(targetDate + 'T00:00:00Z').toISOString() } },
          { completedAt: { less_than_equal: new Date(targetDate + 'T23:59:59Z').toISOString() } },
        ],
      },
      limit: 1,
    })

    if (existing.length > 0) {
      await payload.delete({ collection: 'habit-completions', id: existing[0].id })
      return ok({ completed: false })
    } else {
      await payload.create({
        collection: 'habit-completions',
        data: {
          userId,
          habitId,
          completedAt: new Date(targetDate + 'T12:00:00Z').toISOString(),
        },
      })
      return ok({ completed: true })
    }
  } catch (e) {
    console.error(e)
    return err('Error toggling completion')
  }
}

export const getHabitAnalytics = async (): Promise<HabitAnalytics> => {
  const userId = await getUserId()
  const empty: HabitAnalytics = {
    totalHabits: 0,
    avgCompletionRate: 0,
    bestStreak: null,
    todayCompleted: 0,
    todayTotal: 0,
    heatmapData: [],
    perHabit: [],
  }
  if (!userId) return empty

  const payload = await getPayload({ config })

  const { docs: habits } = await payload.find({
    collection: 'habits',
    where: {
      and: [{ userId: { equals: userId } }, { archivedAt: { exists: false } }],
    },
    limit: 0,
  })

  if (habits.length === 0) return empty

  const ninetyDaysAgo = addDays(new Date(), -90)
  const { docs: completions } = await payload.find({
    collection: 'habit-completions',
    where: {
      and: [
        { userId: { equals: userId } },
        { completedAt: { greater_than_equal: ninetyDaysAgo.toISOString() } },
      ],
    },
    limit: 0,
  })

  const today = getTodayKey()
  const todayCompletionSet = new Set(
    completions
      .filter((c) => getDateKey(new Date(c.completedAt as string)) === today)
      .map((c) => c.habitId),
  )
  
  const perHabit = habits.map((habit) => {
    const habitCompletions = completions.filter((c) => c.habitId === habit.id)
    const dates = new Set(habitCompletions.map((c) => getDateKey(new Date(c.completedAt as string))))
    const { current, longest } = computeStreaks(dates, habit as any)
    const rate = computeCompletionRate(dates, habit as any)
    return {
      id: habit.id,
      name: habit.name,
      color: (habit as any).color ?? '#8b5cf6',
      currentStreak: current,
      longestStreak: longest,
      completionRate30d: rate,
    }
  })

  const bestStreak = perHabit.reduce<{ habitName: string; streak: number } | null>(
    (best, h) =>
      h.longestStreak > (best?.streak ?? 0)
        ? { habitName: h.name, streak: h.longestStreak }
        : best,
    null,
  )

  const heatmapData = Array.from({ length: 90 }, (_, i) => {
    const d = addDays(new Date(today + 'T12:00:00'), -i)
    const key = getDateKey(d)
    const dayName = DAY_NAMES[d.getDay()]

    let total = 0
    let count = 0

    for (const habit of habits) {
      const h = habit as any
      let isTarget = false
      if (h.frequency === 'daily') isTarget = true
      else if (h.frequency === 'days_of_week') isTarget = (h.daysOfWeek ?? []).includes(dayName)
      else if (h.frequency === 'times_per_week') isTarget = true // simplified

      if (isTarget) {
        total++
        if (completions.some((c) => c.habitId === habit.id && getDateKey(new Date(c.completedAt as string)) === key)) {
          count++
        }
      }
    }

    return { date: key, count, total }
  }).reverse()

  return {
    totalHabits: habits.length,
    avgCompletionRate:
      perHabit.length > 0
        ? Math.round(perHabit.reduce((s, h) => s + h.completionRate30d, 0) / perHabit.length)
        : 0,
    bestStreak,
    todayCompleted: todayCompletionSet.size,
    todayTotal: habits.length,
    heatmapData,
    perHabit,
  }
}