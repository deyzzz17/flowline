'use server'

import 'server-only'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { cacheForUser } from '@/lib/server-cache'
import { getSession } from '@/lib/get-session'
import { getPlanLimitsForUserId } from '@/lib/get-user-plan'
import { getAnalyticsWindowStart, clampToAnalyticsWindow } from '@/lib/analytics-window'
import {
  normalizeGroupValue,
  sanitizeTableRows,
  type TableColumn,
  type TableRow,
} from '@/lib/tracking-fields'

const getUserId = async () => {
  const session = await getSession()
  return session?.user?.id ?? null
}

export type TrackingPeriod = 'week' | 'month' | 'year'

export interface TrackingAnalyticsPoint {
  label: string
  dateKey: string
  value: number
  count: number
}

export interface NumberFieldAnalytics {
  fieldKey: string
  fieldLabel: string
  fieldType: 'number'
  points: TrackingAnalyticsPoint[]
  total: number
  avg: number
  min: number
  max: number
}

export interface BooleanAnalyticsPoint {
  label: string
  dateKey: string
  yes: number
  no: number
  /** % of "yes" among the answers of this bucket, null without any answer. */
  rate: number | null
}

export interface BooleanFieldAnalytics {
  fieldKey: string
  fieldLabel: string
  fieldType: 'boolean'
  points: BooleanAnalyticsPoint[]
  yes: number
  no: number
  rate: number | null
}

export interface TextFieldAnalytics {
  fieldKey: string
  fieldLabel: string
  fieldType: 'text'
  /** Completions with something written in this field. */
  filled: number
  /** Most frequent answers (trimmed, case-insensitive), most frequent first. */
  topValues: { value: string; count: number }[]
  /** Count of the answers not in topValues. */
  otherCount: number
  /** Number of different answers. */
  distinct: number
  /** 'journal' when answers are mostly all different (frequencies say nothing). */
  mode: 'top' | 'journal'
  /** Latest answers of the period, newest first. */
  entries: { dateKey: string; value: string }[]
}

/** Aggregates of one number column, within one group. */
export interface TableNumberStats {
  sum: number
  /** Largest single row value (a record, e.g. heaviest set). */
  max: number
  /** Rows with a value. */
  count: number
}

export interface TableAnalyticsPoint {
  label: string
  dateKey: string
  /** Keyed `${groupKey}|${columnKey}`, plus `${groupKey}|#` = number of rows. */
  stats: Record<string, TableNumberStats>
}

export interface TableGroupSummary {
  key: string
  label: string
  sessions: number
  rows: number
  /** Per number column: whole period, latest session and the one before. */
  columns: Record<
    string,
    { period: TableNumberStats; last: TableNumberStats | null; previous: TableNumberStats | null }
  >
}

export interface TableColumnDistribution {
  columnKey: string
  /** select: every option; boolean: Yes/No; text: most frequent answers. */
  values: { value: string; count: number }[]
}

export interface TableFieldAnalytics {
  fieldKey: string
  fieldLabel: string
  fieldType: 'list'
  columns: TableColumn[]
  groupBy: string | null
  /** Completions of the period with at least one row. */
  sessions: number
  rows: number
  groups: TableGroupSummary[]
  points: TableAnalyticsPoint[]
  distributions: TableColumnDistribution[]
  /** Latest sessions of the period, newest first. */
  history: { dateKey: string; rows: TableRow[] }[]
}

export type TrackingFieldAnalytics =
  | NumberFieldAnalytics
  | BooleanFieldAnalytics
  | TextFieldAnalytics
  | TableFieldAnalytics

export interface HabitTrackingAnalyticsResult {
  periodLabel: string
  fields: TrackingFieldAnalytics[]
  restrictedByPlan: boolean
}

export interface HeatmapDay {
  date: string
  count: number
  total: number
}

export interface HeatmapAnalyticsResult {
  year: number
  data: HeatmapDay[]
  restrictedByPlan: boolean
}

function getPeriodRange(period: TrackingPeriod, offset: number): { from: Date; to: Date } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()

  if (period === 'week') {
    const dow = (now.getDay() + 6) % 7
    const monday = new Date(y, m, d - dow)
    monday.setHours(0, 0, 0, 0)
    const from = new Date(monday)
    from.setDate(from.getDate() + offset * 7)
    const to = new Date(from)
    to.setDate(to.getDate() + 6)
    to.setHours(23, 59, 59, 999)
    return { from, to }
  }

  if (period === 'month') {
    const baseMonth = m + offset
    const from = new Date(y, baseMonth, 1)
    from.setHours(0, 0, 0, 0)
    const to = new Date(y, baseMonth + 1, 0)
    to.setHours(23, 59, 59, 999)
    return { from, to }
  }

  const from = new Date(y + offset, 0, 1)
  from.setHours(0, 0, 0, 0)
  const to = new Date(y + offset, 11, 31)
  to.setHours(23, 59, 59, 999)
  return { from, to }
}

function getPeriodLabel(period: TrackingPeriod, from: Date, to: Date): string {
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString('en-US', opts)
  if (period === 'week') {
    if (from.getMonth() === to.getMonth()) {
      return `${fmt(from, { month: 'short' })} ${from.getDate()}–${to.getDate()}, ${from.getFullYear()}`
    }
    return `${fmt(from, { month: 'short', day: 'numeric' })} – ${fmt(to, { month: 'short', day: 'numeric', year: 'numeric' })}`
  }
  if (period === 'month') return fmt(from, { month: 'long', year: 'numeric' })
  return String(from.getFullYear())
}

function getDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA').format(date)
}

function getBuckets(
  period: TrackingPeriod,
  from: Date,
  to: Date,
): { label: string; dateKey: string; from: Date; to: Date }[] {
  const buckets: { label: string; dateKey: string; from: Date; to: Date }[] = []

  if (period === 'week') {
    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    for (let i = 0; i < 7; i++) {
      const d = new Date(from)
      d.setDate(d.getDate() + i)
      const end = new Date(d)
      end.setHours(23, 59, 59, 999)
      buckets.push({ label: DAYS[i], dateKey: getDateKey(d), from: d, to: end })
    }
    return buckets
  }

  if (period === 'month') {
    const cur = new Date(from)
    while (cur <= to) {
      const end = new Date(cur)
      end.setHours(23, 59, 59, 999)
      buckets.push({
        label: cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dateKey: getDateKey(cur),
        from: new Date(cur),
        to: end,
      })
      cur.setDate(cur.getDate() + 1)
    }
    return buckets
  }

  const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  for (let i = 0; i < 12; i++) {
    const monthFrom = new Date(from.getFullYear(), i, 1)
    const monthTo = new Date(from.getFullYear(), i + 1, 0)
    monthTo.setHours(23, 59, 59, 999)
    buckets.push({ label: MONTHS[i], dateKey: getDateKey(monthFrom), from: monthFrom, to: monthTo })
  }
  return buckets
}

type TrackedEntry = { at: Date; values: Record<string, unknown> }
type Bucket = { label: string; dateKey: string; from: Date; to: Date }
type FieldDef = {
  key: string
  label: string
  columns?: TableColumn[]
  groupBy?: string | null
}

function dateKeyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function numberFieldAnalytics(
  field: FieldDef,
  buckets: Bucket[],
  inBucket: (b: Bucket) => TrackedEntry[],
): NumberFieldAnalytics {
  const points: TrackingAnalyticsPoint[] = buckets.map((bucket) => {
    let sum = 0
    let count = 0
    for (const e of inBucket(bucket)) {
      const v = e.values[field.key]
      if (typeof v === 'number' && v > 0) {
        sum += v
        count++
      }
    }
    return { label: bucket.label, dateKey: bucket.dateKey, value: count > 0 ? sum : 0, count }
  })
  const nonZero = points.filter((p) => p.value > 0).map((p) => p.value)
  return {
    fieldKey: field.key,
    fieldLabel: field.label,
    fieldType: 'number',
    points,
    total: nonZero.reduce((s, v) => s + v, 0),
    avg: nonZero.length > 0 ? Math.round(nonZero.reduce((s, v) => s + v, 0) / nonZero.length) : 0,
    min: nonZero.length > 0 ? Math.min(...nonZero) : 0,
    max: nonZero.length > 0 ? Math.max(...nonZero) : 0,
  }
}

// Only explicit answers count: a completion without a value for this field
// (older entries, or a skipped form) is neither "yes" nor "no".
function booleanFieldAnalytics(
  field: FieldDef,
  buckets: Bucket[],
  inBucket: (b: Bucket) => TrackedEntry[],
): BooleanFieldAnalytics {
  let yesTotal = 0
  let noTotal = 0
  const points: BooleanAnalyticsPoint[] = buckets.map((bucket) => {
    let yes = 0
    let no = 0
    for (const e of inBucket(bucket)) {
      const v = e.values[field.key]
      if (v === true) yes++
      else if (v === false) no++
    }
    yesTotal += yes
    noTotal += no
    const answered = yes + no
    return {
      label: bucket.label,
      dateKey: bucket.dateKey,
      yes,
      no,
      rate: answered > 0 ? Math.round((yes / answered) * 100) : null,
    }
  })
  const answered = yesTotal + noTotal
  return {
    fieldKey: field.key,
    fieldLabel: field.label,
    fieldType: 'boolean',
    points,
    yes: yesTotal,
    no: noTotal,
    rate: answered > 0 ? Math.round((yesTotal / answered) * 100) : null,
  }
}

const TEXT_TOP_VALUES = 8
const TEXT_JOURNAL_ENTRIES = 20
// Above this share of distinct answers, frequencies say nothing: show a journal.
const TEXT_JOURNAL_UNIQUE_RATIO = 0.7

function textFieldAnalytics(field: FieldDef, entries: TrackedEntry[]): TextFieldAnalytics {
  const answers = entries
    .map((e) => ({
      at: e.at,
      value: typeof e.values[field.key] === 'string' ? (e.values[field.key] as string).trim() : '',
    }))
    .filter((a) => a.value !== '')

  // Group case-insensitively, shown with the first spelling met.
  const groups = new Map<string, { value: string; count: number }>()
  for (const a of answers) {
    const k = a.value.toLowerCase()
    const g = groups.get(k)
    if (g) g.count++
    else groups.set(k, { value: a.value, count: 1 })
  }
  const sorted = [...groups.values()].sort((a, b) => b.count - a.count)
  const topValues = sorted.slice(0, TEXT_TOP_VALUES)
  const otherCount = sorted.slice(TEXT_TOP_VALUES).reduce((s, g) => s + g.count, 0)
  const mode =
    answers.length >= 3 && groups.size / answers.length > TEXT_JOURNAL_UNIQUE_RATIO
      ? 'journal'
      : 'top'

  return {
    fieldKey: field.key,
    fieldLabel: field.label,
    fieldType: 'text',
    filled: answers.length,
    topValues,
    otherCount,
    distinct: groups.size,
    mode,
    entries: answers
      .slice(-TEXT_JOURNAL_ENTRIES)
      .reverse()
      .map((a) => ({ dateKey: dateKeyOf(a.at), value: a.value })),
  }
}

const TABLE_MAX_GROUPS = 12
const TABLE_HISTORY_SESSIONS = 30
const TABLE_TEXT_TOP_VALUES = 8
const ALL_GROUP = '__all__'
const NONE_GROUP = '__none__'
const OTHER_GROUP = '__other__'

function emptyStats(): TableNumberStats {
  return { sum: 0, max: 0, count: 0 }
}

function addToStats(stats: TableNumberStats, n: number) {
  stats.sum = Math.round((stats.sum + n) * 1000) / 1000
  stats.max = stats.count === 0 ? n : Math.max(stats.max, n)
  stats.count++
}

// A table field: rows per completion, split by the group-by column when set
// (e.g. per exercise), with the number columns aggregated per bucket.
function tableFieldAnalytics(
  field: FieldDef,
  buckets: Bucket[],
  entries: TrackedEntry[],
): TableFieldAnalytics {
  const columns = field.columns ?? []
  const numberColumns = columns.filter((c) => c.type === 'number')
  const groupColumn = field.groupBy ? columns.find((c) => c.key === field.groupBy) : undefined

  const sessions = entries
    .map((e) => ({ at: e.at, rows: sanitizeTableRows(columns, e.values[field.key]) }))
    .filter((s) => s.rows.length > 0)

  // Group of a row (text answers grouped case-insensitively).
  const rawGroupOf = (row: TableRow): string => {
    if (!groupColumn) return ALL_GROUP
    const v = row[groupColumn.key]
    return typeof v === 'string' && v.trim() ? normalizeGroupValue(v) : NONE_GROUP
  }
  const labels = new Map<string, string>()
  const rowCounts = new Map<string, number>()
  for (const s of sessions) {
    for (const row of s.rows) {
      const g = rawGroupOf(row)
      rowCounts.set(g, (rowCounts.get(g) ?? 0) + 1)
      const v = groupColumn ? row[groupColumn.key] : undefined
      // Shown with the latest spelling used.
      if (typeof v === 'string' && v.trim()) labels.set(g, v.trim())
    }
  }
  // Keep the most used groups; the rest are folded into "Other".
  const kept = new Set(
    [...rowCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, TABLE_MAX_GROUPS)
      .map(([g]) => g),
  )
  const groupOf = (row: TableRow) => {
    const g = rawGroupOf(row)
    return kept.has(g) ? g : OTHER_GROUP
  }
  const groupLabel = (g: string) =>
    g === ALL_GROUP
      ? 'All'
      : g === NONE_GROUP
        ? 'Unspecified'
        : g === OTHER_GROUP
          ? 'Other'
          : (labels.get(g) ?? g)

  const points: TableAnalyticsPoint[] = buckets.map((bucket) => {
    const stats: Record<string, TableNumberStats> = {}
    for (const s of sessions) {
      if (s.at < bucket.from || s.at > bucket.to) continue
      for (const row of s.rows) {
        const g = groupOf(row)
        const countKey = `${g}|#`
        stats[countKey] ??= emptyStats()
        addToStats(stats[countKey], 1)
        for (const col of numberColumns) {
          const v = row[col.key]
          if (typeof v !== 'number') continue
          const k = `${g}|${col.key}`
          stats[k] ??= emptyStats()
          addToStats(stats[k], v)
        }
      }
    }
    return { label: bucket.label, dateKey: bucket.dateKey, stats }
  })

  // Per group: period totals, and the latest two sessions it appears in.
  const summaries = new Map<string, TableGroupSummary>()
  const sessionStatsByGroup = new Map<string, Record<string, TableNumberStats>[]>()
  for (const s of sessions) {
    const perGroup = new Map<string, Record<string, TableNumberStats>>()
    for (const row of s.rows) {
      const g = groupOf(row)
      let summary = summaries.get(g)
      if (!summary) {
        summary = {
          key: g,
          label: groupLabel(g),
          sessions: 0,
          rows: 0,
          columns: Object.fromEntries(
            numberColumns.map((c) => [c.key, { period: emptyStats(), last: null, previous: null }]),
          ),
        }
        summaries.set(g, summary)
      }
      summary.rows++
      let sessionStats = perGroup.get(g)
      if (!sessionStats) {
        sessionStats = Object.fromEntries(numberColumns.map((c) => [c.key, emptyStats()]))
        perGroup.set(g, sessionStats)
        summary.sessions++
      }
      for (const col of numberColumns) {
        const v = row[col.key]
        if (typeof v !== 'number') continue
        addToStats(summary.columns[col.key].period, v)
        addToStats(sessionStats[col.key], v)
      }
    }
    for (const [g, st] of perGroup) {
      const list = sessionStatsByGroup.get(g) ?? []
      list.push(st)
      sessionStatsByGroup.set(g, list)
    }
  }
  for (const [g, list] of sessionStatsByGroup) {
    const summary = summaries.get(g)!
    const last = list[list.length - 1]
    const previous = list.length > 1 ? list[list.length - 2] : null
    for (const col of numberColumns) {
      summary.columns[col.key].last = last[col.key].count > 0 ? last[col.key] : null
      summary.columns[col.key].previous =
        previous && previous[col.key].count > 0 ? previous[col.key] : null
    }
  }
  const groups = [...summaries.values()].sort((a, b) => {
    if (a.key === OTHER_GROUP) return 1
    if (b.key === OTHER_GROUP) return -1
    return b.rows - a.rows
  })

  // How the other (non-group) columns were answered.
  const distributions: TableColumnDistribution[] = columns
    .filter((c) => c.key !== groupColumn?.key && c.type !== 'number')
    .map((col) => {
      const counts = new Map<string, { value: string; count: number }>()
      if (col.type === 'select')
        for (const o of col.options ?? []) counts.set(o, { value: o, count: 0 })
      for (const s of sessions) {
        for (const row of s.rows) {
          const v = row[col.key]
          if (v === undefined) continue
          const value = col.type === 'boolean' ? (v ? 'Yes' : 'No') : String(v)
          const k = col.type === 'text' ? normalizeGroupValue(value) : value
          const c = counts.get(k)
          if (c) c.count++
          else counts.set(k, { value, count: 1 })
        }
      }
      let values = [...counts.values()]
      if (col.type === 'text')
        values = values.sort((a, b) => b.count - a.count).slice(0, TABLE_TEXT_TOP_VALUES)
      return { columnKey: col.key, values }
    })
    .filter((d) => d.values.some((v) => v.count > 0))

  return {
    fieldKey: field.key,
    fieldLabel: field.label,
    fieldType: 'list',
    columns,
    groupBy: groupColumn?.key ?? null,
    sessions: sessions.length,
    rows: sessions.reduce((n, s) => n + s.rows.length, 0),
    groups,
    points,
    distributions,
    history: sessions
      .slice(-TABLE_HISTORY_SESSIONS)
      .reverse()
      .map((s) => ({ dateKey: dateKeyOf(s.at), rows: s.rows })),
  }
}

// Cached per user (dropped as soon as a habit or completion of theirs changes — see server-cache.ts).
export const getHabitTrackingAnalytics = async (
  habitId: number,
  period: TrackingPeriod,
  offset: number,
): Promise<HabitTrackingAnalyticsResult> => {
  const userId = await getUserId()
  if (!userId) return computeGetHabitTrackingAnalytics(null, habitId, period, offset)
  return cacheForUser(userId, ['habits'], ['habit-tracking-v3', habitId, period, offset], () =>
    computeGetHabitTrackingAnalytics(userId, habitId, period, offset),
  )
}

async function computeGetHabitTrackingAnalytics(
  userId: string | null,
  habitId: number,
  period: TrackingPeriod,
  offset: number,
): Promise<HabitTrackingAnalyticsResult> {
  const empty: HabitTrackingAnalyticsResult = {
    periodLabel: '',
    fields: [],
    restrictedByPlan: false,
  }
  if (!userId) return empty

  const payload = await getPayload({ config })

  const habit = await payload.findByID({ collection: 'habits', id: habitId })
  if (!habit || (habit as any).userId !== userId) return empty

  let trackingFields: any[] = []
  try {
    const raw = (habit as any).trackingFields
    trackingFields = typeof raw === 'string' ? JSON.parse(raw) : (raw ?? [])
  } catch {}

  const activeFields = trackingFields.filter(
    (f: any) => f.enabled && ['number', 'boolean', 'text', 'list'].includes(f.type),
  )
  if (activeFields.length === 0) return empty

  const { from, to } = getPeriodRange(period, offset)
  const periodLabel = getPeriodLabel(period, from, to)
  const buckets = getBuckets(period, from, to)

  const { plan } = await getPlanLimitsForUserId(userId)
  const windowStart = getAnalyticsWindowStart(plan)
  const { fetchFrom, restrictedByPlan } = clampToAnalyticsWindow(from, windowStart)

  const { docs: completions } = await payload.find({
    collection: 'habit-completions',
    where: {
      and: [
        { userId: { equals: userId } },
        { habitId: { equals: habitId } },
        { completedAt: { greater_than_equal: fetchFrom.toISOString() } },
        { completedAt: { less_than_equal: to.toISOString() } },
      ],
    },
    limit: 0,
  })

  // Each completion's tracked values, parsed once.
  const entries = completions
    .map((c) => {
      let values: Record<string, unknown> = {}
      try {
        const raw = (c as any).trackingValues
        values = typeof raw === 'string' ? JSON.parse(raw) : (raw ?? {})
      } catch {}
      return { at: new Date(c.completedAt as string), values }
    })
    .sort((a, b) => a.at.getTime() - b.at.getTime())
  const inBucket = (bucket: { from: Date; to: Date }) =>
    entries.filter((e) => e.at >= bucket.from && e.at <= bucket.to)

  const fields: TrackingFieldAnalytics[] = activeFields.map(
    (field: any): TrackingFieldAnalytics => {
      if (field.type === 'boolean') return booleanFieldAnalytics(field, buckets, inBucket)
      if (field.type === 'text') return textFieldAnalytics(field, entries)
      if (field.type === 'list') return tableFieldAnalytics(field, buckets, entries)
      return numberFieldAnalytics(field, buckets, inBucket)
    },
  )

  return { periodLabel, fields, restrictedByPlan }
}

// Cached per user (dropped as soon as a habit or completion of theirs changes — see server-cache.ts).
export const getHeatmapAnalytics = async (year: number): Promise<HeatmapAnalyticsResult> => {
  const userId = await getUserId()
  if (!userId) return computeGetHeatmapAnalytics(null, year)
  return cacheForUser(userId, ['habits'], ['habit-heatmap-analytics', year], () =>
    computeGetHeatmapAnalytics(userId, year),
  )
}

async function computeGetHeatmapAnalytics(
  userId: string | null,
  year: number,
): Promise<HeatmapAnalyticsResult> {
  if (!userId) return { year, data: [], restrictedByPlan: false }

  const payload = await getPayload({ config })

  const { docs: habits } = await payload.find({
    collection: 'habits',
    where: { and: [{ userId: { equals: userId } }, { archivedAt: { exists: false } }] },
    limit: 0,
  })

  if (habits.length === 0) return { year, data: [], restrictedByPlan: false }

  const from = new Date(year, 0, 1)
  from.setHours(0, 0, 0, 0)
  const to = new Date(year, 11, 31)
  to.setHours(23, 59, 59, 999)

  const { plan } = await getPlanLimitsForUserId(userId)
  const windowStart = getAnalyticsWindowStart(plan)
  const { fetchFrom, restrictedByPlan } = clampToAnalyticsWindow(from, windowStart)

  const { docs: completions } = await payload.find({
    collection: 'habit-completions',
    where: {
      and: [
        { userId: { equals: userId } },
        { completedAt: { greater_than_equal: fetchFrom.toISOString() } },
        { completedAt: { less_than_equal: to.toISOString() } },
      ],
    },
    limit: 0,
  })

  const today = getDateKey(new Date())
  const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
  const data: HeatmapDay[] = []
  const cur = new Date(from)

  while (cur <= to) {
    const key = getDateKey(cur)
    if (key > today) {
      data.push({ date: key, count: 0, total: 0 })
      cur.setDate(cur.getDate() + 1)
      continue
    }

    const dayName = DAY_NAMES[cur.getDay()]
    let total = 0
    let count = 0

    for (const habit of habits) {
      const h = habit as any
      let isTarget = false
      if (h.frequency === 'daily') {
        isTarget = true
      } else if (h.frequency === 'days_of_week') {
        isTarget = (h.daysOfWeek ?? []).includes(dayName)
      } else if (h.frequency === 'times_per_week') {
        isTarget = true
      } else if (h.frequency === 'every_x_days') {
        const interval = h.repeatEveryDays ?? 2
        const anchor = h.startDate ? new Date(h.startDate) : from
        anchor.setHours(0, 0, 0, 0)
        const diffDays = Math.round((cur.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays >= 0 && diffDays % interval === 0) isTarget = true
      }

      if (isTarget) {
        total++
        if (
          completions.some(
            (c) => c.habitId === habit.id && getDateKey(new Date(c.completedAt as string)) === key,
          )
        ) {
          count++
        }
      }
    }

    if (total > 0) data.push({ date: key, count, total })
    cur.setDate(cur.getDate() + 1)
  }

  return { year, data, restrictedByPlan }
}
