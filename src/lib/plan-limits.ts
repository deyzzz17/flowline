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

const ABSOLUTE_MAX_LISTS = 100
const ABSOLUTE_MAX_HABITS = 100
const ABSOLUTE_MAX_TASKS_PER_LIST = 500
const ABSOLUTE_MAX_SUBTASKS_PER_TASK = 100
const ABSOLUTE_MAX_CUSTOM_TAGS = 100
const ABSOLUTE_MAX_TRACKING_FIELDS_PER_HABIT = 50
const ABSOLUTE_MAX_GOALS_PER_HABIT = 50
const ABSOLUTE_MAX_CALENDAR_CATEGORIES = 200
const ABSOLUTE_MAX_CONTACTS = 200
const ABSOLUTE_MAX_TIMER_CATEGORIES = 100
const ABSOLUTE_MAX_TIMER_PRESETS = 100

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    lists: 3,
    habits: 5,
    tasksPerList: 50,
    subtasksPerTask: 10,
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
  const limits = PLAN_LIMITS[plan]
  return {
    lists: Math.min(limits.lists, ABSOLUTE_MAX_LISTS),
    habits: Math.min(limits.habits, ABSOLUTE_MAX_HABITS),
    tasksPerList: Math.min(limits.tasksPerList, ABSOLUTE_MAX_TASKS_PER_LIST),
    subtasksPerTask: Math.min(limits.subtasksPerTask, ABSOLUTE_MAX_SUBTASKS_PER_TASK),
    customTags: Math.min(limits.customTags, ABSOLUTE_MAX_CUSTOM_TAGS),
    trackingFieldsPerHabit: Math.min(
      limits.trackingFieldsPerHabit,
      ABSOLUTE_MAX_TRACKING_FIELDS_PER_HABIT,
    ),
    goalsPerHabit: Math.min(limits.goalsPerHabit, ABSOLUTE_MAX_GOALS_PER_HABIT),
    calendarCategories: Math.min(limits.calendarCategories, ABSOLUTE_MAX_CALENDAR_CATEGORIES),
    contacts: Math.min(limits.contacts, ABSOLUTE_MAX_CONTACTS),
    timerCategories: Math.min(limits.timerCategories, ABSOLUTE_MAX_TIMER_CATEGORIES),
    timerPresets: Math.min(limits.timerPresets, ABSOLUTE_MAX_TIMER_PRESETS),
  }
}

export function isAtLimit(current: number, limit: number): boolean {
  return limit !== Infinity && current >= limit
}

export function isPlanUnlimited(plan: Plan, field: keyof PlanLimits): boolean {
  return PLAN_LIMITS[plan][field] === Infinity
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

export const SAFETY_CAP_ERRORS = {
  LISTS_CAP: 'LISTS_CAP',
  HABITS_CAP: 'HABITS_CAP',
  TASKS_CAP: 'TASKS_CAP',
  SUBTASKS_CAP: 'SUBTASKS_CAP',
  TAGS_CAP: 'TAGS_CAP',
  TRACKING_FIELDS_CAP: 'TRACKING_FIELDS_CAP',
  GOALS_CAP: 'GOALS_CAP',
  CALENDAR_CATEGORIES_CAP: 'CALENDAR_CATEGORIES_CAP',
  CONTACTS_CAP: 'CONTACTS_CAP',
  TIMER_CATEGORIES_CAP: 'TIMER_CATEGORIES_CAP',
  TIMER_PRESETS_CAP: 'TIMER_PRESETS_CAP',
} as const

export type SafetyCapError = (typeof SAFETY_CAP_ERRORS)[keyof typeof SAFETY_CAP_ERRORS]
