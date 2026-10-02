// "List" habit tracking fields (Pro) are free-form tables: the user defines
// the columns (e.g. Exercise · Sets · Reps · Weight kg) and fills one or more
// rows each time the habit is completed. Shared by the habit form, the
// tracking dialog, the server validation and the analytics — keep it free of
// server-only imports.

export type TableColumnType = 'text' | 'number' | 'select' | 'boolean'

export interface TableColumn {
  key: string
  label: string
  type: TableColumnType
  /** Shown after number values (kg, min, km…). */
  unit?: string
  /** Choices of a 'select' column, in display order. */
  options?: string[]
}

export type TableCell = string | number | boolean
export type TableRow = Record<string, TableCell>

/** A value saved for one tracking field on one completion. */
export type TrackingValue = number | string | boolean | TableRow[]
export type TrackingValues = Record<string, TrackingValue>

export const TABLE_MIN_COLUMNS = 1
export const TABLE_MAX_COLUMNS = 10
export const TABLE_MAX_ROWS = 50
export const TABLE_LABEL_MAX_LENGTH = 40
export const TABLE_UNIT_MAX_LENGTH = 12
export const TABLE_TEXT_MAX_LENGTH = 120
export const TABLE_SELECT_MIN_OPTIONS = 2
export const TABLE_SELECT_MAX_OPTIONS = 30

export const TABLE_COLUMN_TYPES: TableColumnType[] = ['text', 'number', 'select', 'boolean']

export const TABLE_COLUMN_TYPE_LABELS: Record<TableColumnType, string> = {
  text: 'Text',
  number: 'Number',
  select: 'Choice',
  boolean: 'Yes / No',
}

export function newTableColumnKey(): string {
  return `col_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/** Columns a table can be grouped by ("per exercise"): text and choice ones. */
export function isGroupableColumn(column: TableColumn): boolean {
  return column.type === 'text' || column.type === 'select'
}

/** Text answers are grouped trimmed and case-insensitively. */
export function normalizeGroupValue(value: string): string {
  return value.trim().toLowerCase()
}

/**
 * Validates a table definition. Returns the cleaned columns and group-by key,
 * or an error message.
 */
export function sanitizeTableDefinition(
  columns: TableColumn[] | undefined,
  groupBy: string | null | undefined,
): { ok: true; columns: TableColumn[]; groupBy: string | null } | { ok: false; error: string } {
  const out: TableColumn[] = []
  const keys = new Set<string>()
  for (const raw of columns ?? []) {
    const key = String(raw?.key ?? '').slice(0, 40)
    const label = String(raw?.label ?? '')
      .trim()
      .slice(0, TABLE_LABEL_MAX_LENGTH)
    if (!key || keys.has(key)) return { ok: false, error: 'Invalid table column' }
    if (!label) return { ok: false, error: 'Every column needs a name' }
    if (!TABLE_COLUMN_TYPES.includes(raw.type)) return { ok: false, error: 'Invalid column type' }
    keys.add(key)
    const column: TableColumn = { key, label, type: raw.type }
    if (raw.type === 'number') {
      const unit = String(raw.unit ?? '')
        .trim()
        .slice(0, TABLE_UNIT_MAX_LENGTH)
      if (unit) column.unit = unit
    }
    if (raw.type === 'select') {
      const seen = new Set<string>()
      const options: string[] = []
      for (const o of raw.options ?? []) {
        const option = String(o).trim().slice(0, TABLE_LABEL_MAX_LENGTH)
        if (!option || seen.has(option.toLowerCase())) continue
        seen.add(option.toLowerCase())
        options.push(option)
      }
      if (options.length < TABLE_SELECT_MIN_OPTIONS || options.length > TABLE_SELECT_MAX_OPTIONS) {
        return {
          ok: false,
          error: `"${label}" needs between ${TABLE_SELECT_MIN_OPTIONS} and ${TABLE_SELECT_MAX_OPTIONS} choices`,
        }
      }
      column.options = options
    }
    out.push(column)
  }
  if (out.length < TABLE_MIN_COLUMNS || out.length > TABLE_MAX_COLUMNS) {
    return {
      ok: false,
      error: `A list field needs between ${TABLE_MIN_COLUMNS} and ${TABLE_MAX_COLUMNS} columns`,
    }
  }
  const groupColumn = groupBy ? out.find((c) => c.key === groupBy) : undefined
  return {
    ok: true,
    columns: out,
    groupBy: groupColumn && isGroupableColumn(groupColumn) ? groupColumn.key : null,
  }
}

/**
 * Cleans the rows entered for a table: unknown columns dropped, values coerced
 * to their column type, invalid choices and empty rows removed, capped.
 */
export function sanitizeTableRows(columns: TableColumn[], rows: unknown): TableRow[] {
  if (!Array.isArray(rows)) return []
  const out: TableRow[] = []
  for (const raw of rows) {
    if (!raw || typeof raw !== 'object') continue
    const row: TableRow = {}
    for (const col of columns) {
      const v = (raw as Record<string, unknown>)[col.key]
      if (v === undefined || v === null || v === '') continue
      if (col.type === 'number') {
        const n = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(n)) row[col.key] = Math.round(n * 1000) / 1000
      } else if (col.type === 'boolean') {
        if (typeof v === 'boolean') row[col.key] = v
      } else if (col.type === 'select') {
        if (typeof v === 'string' && col.options?.includes(v)) row[col.key] = v
      } else {
        const text = String(v).trim().slice(0, TABLE_TEXT_MAX_LENGTH)
        if (text) row[col.key] = text
      }
    }
    // A row with only yes/no answers left unticked carries nothing.
    const meaningful = Object.entries(row).some(([, v]) => v !== false)
    if (meaningful) out.push(row)
    if (out.length >= TABLE_MAX_ROWS) break
  }
  return out
}

export function formatTableCell(column: TableColumn, value: TableCell | undefined): string {
  if (value === undefined || value === '') return '—'
  if (column.type === 'boolean') return value ? 'Yes' : 'No'
  if (column.type === 'number') return column.unit ? `${value} ${column.unit}` : String(value)
  return String(value)
}
