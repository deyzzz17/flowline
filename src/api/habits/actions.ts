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

export interface TrackingField {
  key: string
  label: string
  type: 'number' | 'text' | 'boolean'
  isDefault: boolean
  enabled: boolean
}

export interface HabitGoalFieldTarget {
  fieldKey: string
  targetValue: number
}

export interface HabitGoal {
  id: string
  type: 'field' | 'manual'
  description: string
  fieldTargets?: HabitGoalFieldTarget[]
  endOnReach?: boolean
  completedAt?: string | null
  fieldKey?: string
  targetValue?: number
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
  startDate?: string
  showInCalendar?: boolean
  calendarMode?: 'time' | 'relative'
  habitTime?: string
  habitDuration?: number
  relativePosition?: 'before' | 'after'
  relativeEventId?: number | null
  trackingFields?: TrackingField[]
  goals?: HabitGoal[]
}

export interface HabitWithStats {
  id: number
  slug: string
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
  startDate?: string | null
  showInCalendar?: boolean
  calendarMode?: 'time' | 'relative' | null
  habitTime?: string | null
  habitDuration?: number | null
  relativePosition?: 'before' | 'after' | null
  relativeEventId?: number | null
  trackingFields?: TrackingField[]
  goals?: HabitGoal[]
  claimableGoalIds?: string[]
}

export interface HabitDetail extends HabitWithStats {
  completions: string[]
  weeklyCompletions: { week: string; count: number; target: number }[]
  trackingData: TrackingDataPoint[]
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
    slug: string
    name: string
    color: string
    currentStreak: number
    longestStreak: number
    completionRate30d: number
  }[]
}

export interface TrackingDataPoint {
  date: string
  values: Record<string, number | string | boolean>
}

function parseJsonField<T>(raw: any): T | null {
  if (!raw) return null
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }
  return raw as T
}

function parseGoals(habit: any): HabitGoal[] {
  const goals = parseJsonField<HabitGoal[]>(habit.goals)
  if (goals && goals.length > 0) return goals
  const old = parseJsonField<any>(habit.goal)
  if (old?.description) {
    return [
      {
        id: old.id ?? `goal_legacy_${habit.id}`,
        type: old.type ?? 'manual',
        description: old.description,
        fieldTargets:
          old.fieldTargets ??
          (old.fieldKey
            ? [{ fieldKey: old.fieldKey, targetValue: old.targetValue ?? 10 }]
            : undefined),
        endOnReach: old.endOnReach,
        completedAt: habit.goalCompletedAt ?? old.completedAt ?? null,
      },
    ]
  }
  return []
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
      if (key > today) {
        d = addDays(d, -1)
        continue
      }
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
      const monday = new Date(d)
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
      const weekKey = getDateKey(monday)
      weekMap.set(weekKey, (weekMap.get(weekKey) ?? 0) + 1)
    }
    const todayDate = new Date(today + 'T12:00:00')
    const currentMonday = new Date(todayDate)
    currentMonday.setDate(todayDate.getDate() - ((todayDate.getDay() + 6) % 7))
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

function shouldUseGoalRate(goals: HabitGoal[]): boolean {
  return goals.some((g) => {
    if (g.type !== 'field' || !g.endOnReach) return false
    const targets =
      g.fieldTargets ??
      (g.fieldKey ? [{ fieldKey: g.fieldKey, targetValue: g.targetValue ?? 1 }] : [])
    return targets.length > 0
  })
}

function computeGoalFieldRate(completions: any[], goals: HabitGoal[]): number {
  const endGoals = goals.filter((g) => {
    if (g.type !== 'field' || !g.endOnReach) return false
    const targets =
      g.fieldTargets ??
      (g.fieldKey ? [{ fieldKey: g.fieldKey, targetValue: g.targetValue ?? 1 }] : [])
    return targets.length > 0
  })
  if (endGoals.length === 0) return 0

  const allPcts: number[] = []
  for (const goal of endGoals) {
    const fieldTargets =
      goal.fieldTargets ??
      (goal.fieldKey ? [{ fieldKey: goal.fieldKey, targetValue: goal.targetValue ?? 1 }] : [])
    for (const ft of fieldTargets) {
      let total = 0
      for (const c of completions) {
        let values: Record<string, any> = {}
        try {
          const raw = (c as any).trackingValues
          values = typeof raw === 'string' ? JSON.parse(raw) : (raw ?? {})
        } catch {}
        const v = values[ft.fieldKey]
        if (typeof v === 'number') total += v
      }
      allPcts.push(Math.min(100, Math.round((total / ft.targetValue) * 100)))
    }
  }
  if (allPcts.length === 0) return 0
  return Math.round(allPcts.reduce((s, p) => s + p, 0) / allPcts.length)
}

function computeClaimableGoalIds(completions: any[], goals: HabitGoal[]): string[] {
  const claimable: string[] = []
  for (const goal of goals) {
    if (goal.completedAt) continue
    if (goal.type !== 'field' || !goal.endOnReach) continue
    const fieldTargets =
      goal.fieldTargets ??
      (goal.fieldKey ? [{ fieldKey: goal.fieldKey, targetValue: goal.targetValue ?? 1 }] : [])
    if (fieldTargets.length === 0) continue

    const allReached = fieldTargets.every((ft) => {
      let total = 0
      for (const c of completions) {
        let values: Record<string, any> = {}
        try {
          const raw = (c as any).trackingValues
          values = typeof raw === 'string' ? JSON.parse(raw) : (raw ?? {})
        } catch {}
        const v = values[ft.fieldKey]
        if (typeof v === 'number') total += v
      }
      return total >= ft.targetValue
    })

    if (allReached) claimable.push(goal.id)
  }
  return claimable
}

function mapHabitDoc(
  habit: any,
): Omit<
  HabitWithStats,
  'currentStreak' | 'longestStreak' | 'completedToday' | 'completionRate30d' | 'claimableGoalIds'
> {
  return {
    id: habit.id,
    slug: habit.slug ?? '',
    name: habit.name,
    description: habit.description ?? null,
    color: habit.color ?? '#8b5cf6',
    categoryTag: habit.categoryTag ?? null,
    frequency: habit.frequency,
    daysOfWeek: habit.daysOfWeek ?? [],
    timesPerWeek: habit.timesPerWeek ?? undefined,
    order: habit.order ?? 0,
    startDate: habit.startDate ?? null,
    showInCalendar: habit.showInCalendar ?? false,
    calendarMode: habit.calendarMode ?? null,
    habitTime: habit.habitTime ?? null,
    habitDuration: habit.habitDuration ?? null,
    relativePosition: habit.relativePosition ?? null,
    relativeEventId: habit.relativeEventId ?? null,
    trackingFields: parseJsonField<TrackingField[]>(habit.trackingFields) ?? [],
    goals: parseGoals(habit),
  }
}

export const listHabits = async (): Promise<HabitWithStats[]> => {
  const userId = await getUserId()
  if (!userId) return []

  const payload = await getPayload({ config })
  const { docs: habits } = await payload.find({
    collection: 'habits',
    where: { and: [{ userId: { equals: userId } }, { archivedAt: { exists: false } }] },
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
    const goals = parseGoals(habit)

    const rate = shouldUseGoalRate(goals)
      ? computeGoalFieldRate(habitCompletions, goals)
      : computeCompletionRate(completionDates, habit as any)

    const claimableGoalIds = computeClaimableGoalIds(habitCompletions, goals)

    return {
      ...mapHabitDoc(habit),
      currentStreak: current,
      longestStreak: longest,
      completedToday: completionDates.has(today),
      completionRate30d: rate,
      claimableGoalIds,
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
  const goals = parseGoals(habit)
  const rate = shouldUseGoalRate(goals)
    ? computeGoalFieldRate(completions, goals)
    : computeCompletionRate(completionDates, habit as any)

  const claimableGoalIds = computeClaimableGoalIds(completions, goals)

  const today = getTodayKey()

  const weeklyCompletions = Array.from({ length: 12 }, (_, i) => {
    const weekStart = addDays(
      new Date(today + 'T12:00:00'),
      -i * 7 - ((new Date().getDay() + 6) % 7),
    )
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
    return { week: getDateKey(weekStart), count, target }
  }).reverse()

  return {
    ...mapHabitDoc(habit),
    currentStreak: current,
    longestStreak: longest,
    completedToday: completionDates.has(today),
    completionRate30d: rate,
    claimableGoalIds,
    completions: Array.from(completionDates).sort(),
    weeklyCompletions,
    trackingData: completions
      .filter((c) => (c as any).trackingValues)
      .map((c) => {
        let values: Record<string, number | string | boolean> = {}
        try {
          const raw = (c as any).trackingValues
          values = typeof raw === 'string' ? JSON.parse(raw) : raw
        } catch {}
        return { date: getDateKey(new Date(c.completedAt as string)), values }
      })
      .sort((a, b) => a.date.localeCompare(b.date)),
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
        startDate: data.startDate ?? undefined,
        showInCalendar: data.showInCalendar ?? false,
        calendarMode: data.calendarMode ?? undefined,
        habitTime: data.habitTime ?? undefined,
        habitDuration: data.habitDuration ?? undefined,
        relativePosition: data.relativePosition ?? undefined,
        relativeEventId: data.relativeEventId ?? undefined,
        trackingFields: data.trackingFields ? JSON.stringify(data.trackingFields) : undefined,
        goals: data.goals ? JSON.stringify(data.goals) : undefined,
      } as any,
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
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.showInCalendar !== undefined && { showInCalendar: data.showInCalendar }),
        ...(data.calendarMode !== undefined && { calendarMode: data.calendarMode }),
        ...(data.habitTime !== undefined && { habitTime: data.habitTime }),
        ...(data.habitDuration !== undefined && { habitDuration: data.habitDuration }),
        ...(data.relativePosition !== undefined && { relativePosition: data.relativePosition }),
        ...(data.relativeEventId !== undefined && { relativeEventId: data.relativeEventId }),
        ...(data.trackingFields !== undefined && {
          trackingFields: data.trackingFields ? JSON.stringify(data.trackingFields) : null,
        }),
        ...(data.goals !== undefined && {
          goals: data.goals ? JSON.stringify(data.goals) : null,
        }),
      } as any,
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

export const toggleHabitCompletion = async (
  habitId: number,
  dateStr?: string,
  trackingValues?: Record<string, number | string | boolean>,
) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')
    const payload = await getPayload({ config })
    const targetDate = dateStr ?? getTodayKey()

    const { docs: existing } = await payload.find({
      collection: 'habit-completions',
      where: {
        and: [
          { userId: { equals: userId } },
          { habitId: { equals: habitId } },
          {
            completedAt: { greater_than_equal: new Date(targetDate + 'T00:00:00Z').toISOString() },
          },
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
          trackingValues: trackingValues ? JSON.stringify(trackingValues) : undefined,
        } as any,
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
    where: { and: [{ userId: { equals: userId } }, { archivedAt: { exists: false } }] },
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
    const dates = new Set(
      habitCompletions.map((c) => getDateKey(new Date(c.completedAt as string))),
    )
    const { current, longest } = computeStreaks(dates, habit as any)
    const goals = parseGoals(habit)
    const rate = shouldUseGoalRate(goals)
      ? computeGoalFieldRate(habitCompletions, goals)
      : computeCompletionRate(dates, habit as any)
    return {
      id: habit.id,
      slug: (habit as any).slug ?? '',
      name: habit.name,
      color: (habit as any).color ?? '#8b5cf6',
      currentStreak: current,
      longestStreak: longest,
      completionRate30d: rate,
    }
  })

  const bestStreak = perHabit.reduce<{ habitName: string; streak: number } | null>(
    (best, h) =>
      h.longestStreak > (best?.streak ?? 0) ? { habitName: h.name, streak: h.longestStreak } : best,
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
      else if (h.frequency === 'times_per_week') isTarget = true
      if (isTarget) {
        total++
        if (
          completions.some(
            (c) => c.habitId === habit.id && getDateKey(new Date(c.completedAt as string)) === key,
          )
        )
          count++
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

export const getHabitBySlug = async (slug: string): Promise<HabitDetail | null> => {
  const userId = await getUserId()
  if (!userId) return null
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'habits',
    where: {
      and: [
        { userId: { equals: userId } },
        { slug: { equals: slug } },
        { archivedAt: { exists: false } },
      ],
    },
    limit: 1,
  })
  if (!docs[0]) return null
  return getHabitDetail(docs[0].id)
}

export const markGoalComplete = async (habitId: number, goalId: string, completed: boolean) => {
  try {
    const userId = await getUserId()
    if (!userId) return err('Not authenticated')
    const payload = await getPayload({ config })
    const habit = await payload.findByID({ collection: 'habits', id: habitId })
    if (!habit || (habit as any).userId !== userId) return err('Not authorized')
    const goals = parseGoals(habit)
    const updatedGoals = goals.map((g) =>
      g.id === goalId ? { ...g, completedAt: completed ? new Date().toISOString() : null } : g,
    )
    await payload.update({
      collection: 'habits',
      id: habitId,
      data: { goals: JSON.stringify(updatedGoals) } as any,
    })
    return ok({ completed })
  } catch {
    return err('Error updating goal')
  }
}
