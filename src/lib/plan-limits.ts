import type { Plan } from '@/lib/stripe'

export interface PlanLimits {
  lists: number
  habits: number
  tasksPerList: number
  subtasksPerTask: number
  customTags: number
  trackingFieldsPerHabit: number
  goalsPerHabit: number
  calendarCategories: number
  contacts: number
  timerCategories: number
  timerPresets: number
}

const UNLIMITED = Infinity

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    lists: 3,
    habits: 5,
    tasksPerList: 50,
    subtasksPerTask: 20,
    customTags: 10,
    trackingFieldsPerHabit: 10,
    goalsPerHabit: 5,
    calendarCategories: 20,
    contacts: 10,
    timerCategories: 10,
    timerPresets: 10,
  },
  plus: {
    lists: UNLIMITED,
    habits: UNLIMITED,
    tasksPerList: UNLIMITED,
    subtasksPerTask: UNLIMITED,
    customTags: UNLIMITED,
    trackingFieldsPerHabit: UNLIMITED,
    goalsPerHabit: UNLIMITED,
    calendarCategories: UNLIMITED,
    contacts: UNLIMITED,
    timerCategories: UNLIMITED,
    timerPresets: UNLIMITED,
  },
  pro: {
    lists: UNLIMITED,
    habits: UNLIMITED,
    tasksPerList: UNLIMITED,
    subtasksPerTask: UNLIMITED,
    customTags: UNLIMITED,
    trackingFieldsPerHabit: UNLIMITED,
    goalsPerHabit: UNLIMITED,
    calendarCategories: UNLIMITED,
    contacts: UNLIMITED,
    timerCategories: UNLIMITED,
    timerPresets: UNLIMITED,
  },
}

export function getLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan]
}

export function isAtLimit(current: number, limit: number): boolean {
  return limit !== Infinity && current >= limit
}

export const LIMIT_ERRORS = {
  LISTS_LIMIT: 'LISTS_LIMIT',
  HABITS_LIMIT: 'HABITS_LIMIT',
  TASKS_LIMIT: 'TASKS_LIMIT',
  SUBTASKS_LIMIT: 'SUBTASKS_LIMIT',
  TAGS_LIMIT: 'TAGS_LIMIT',
  TRACKING_FIELDS_LIMIT: 'TRACKING_FIELDS_LIMIT',
  GOALS_LIMIT: 'GOALS_LIMIT',
  CALENDAR_CATEGORIES_LIMIT: 'CALENDAR_CATEGORIES_LIMIT',
  CONTACTS_LIMIT: 'CONTACTS_LIMIT',
  TIMER_CATEGORIES_LIMIT: 'TIMER_CATEGORIES_LIMIT',
  TIMER_PRESETS_LIMIT: 'TIMER_PRESETS_LIMIT',
} as const

export type LimitError = (typeof LIMIT_ERRORS)[keyof typeof LIMIT_ERRORS]