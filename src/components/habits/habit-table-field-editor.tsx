'use client'

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  isGroupableColumn,
  newTableColumnKey,
  TABLE_COLUMN_TYPE_LABELS,
  TABLE_COLUMN_TYPES,
  TABLE_LABEL_MAX_LENGTH,
  TABLE_MAX_COLUMNS,
  TABLE_UNIT_MAX_LENGTH,
  type TableColumn,
  type TableColumnType,
} from '@/lib/tracking-fields'

/** A column being edited: choices are typed as one comma-separated string. */
export interface TableColumnDraft {
  key: string
  label: string
  type: TableColumnType
  unit: string
  optionsText: string
}

/** Group-by choice: a column key, 'auto' (first text/choice column) or 'none'. */
export type TableGroupByDraft = string

export function newColumnDraft(label = '', type: TableColumnType = 'text'): TableColumnDraft {
  return { key: newTableColumnKey(), label, type, unit: '', optionsText: '' }
}

export function columnsToDrafts(columns: TableColumn[]): TableColumnDraft[] {
  return columns.map((c) => ({
    key: c.key,
    label: c.label,
    type: c.type,
    unit: c.unit ?? '',
    optionsText: (c.options ?? []).join(', '),
  }))
}

export function draftsToColumns(drafts: TableColumnDraft[]): TableColumn[] {
  return drafts.map((d) => ({
    key: d.key,
    label: d.label,
    type: d.type,
    ...(d.type === 'number' && d.unit.trim() && { unit: d.unit.trim() }),
    ...(d.type === 'select' && {
      options: d.optionsText
        .split(/[,\n]/)
        .map((o) => o.trim())
        .filter(Boolean),
    }),
  }))
}

/** Resolves the group-by choice against the columns ('auto' → first groupable). */
export function resolveGroupBy(drafts: TableColumnDraft[], groupBy: TableGroupByDraft): string | null {
  if (groupBy === 'none') return null
  const columns = draftsToColumns(drafts)
  if (groupBy === 'auto') return columns.find(isGroupableColumn)?.key ?? null
  const col = columns.find((c) => c.key === groupBy)
  return col && isGroupableColumn(col) ? col.key : null
}

const fieldClass =
  'h-8 rounded-lg border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary/40'

export function TableFieldEditor({
  columns,
  groupBy,
  onColumnsChange,
  onGroupByChange,
}: {
  columns: TableColumnDraft[]
  groupBy: TableGroupByDraft
  onColumnsChange: (columns: TableColumnDraft[]) => void
  onGroupByChange: (groupBy: TableGroupByDraft) => void
}) {
  const update = (key: string, patch: Partial<TableColumnDraft>) =>
    onColumnsChange(columns.map((c) => (c.key === key ? { ...c, ...patch } : c)))
  const move = (index: number, dir: -1 | 1) => {
    const next = [...columns]
    const [col] = next.splice(index, 1)
    next.splice(index + dir, 0, col)
    onColumnsChange(next)
  }
  const groupable = columns.filter((c) => c.type === 'text' || c.type === 'select')

  return (
    <div className="space-y-2.5">
      <p className="text-[11px] text-muted-foreground">
        Columns of the table you fill each time — e.g. Exercise · Sets · Reps · Weight (kg).
      </p>

      <div className="space-y-2">
        {columns.map((col, i) => (
          <div key={col.key} className="space-y-1.5 rounded-xl border border-border/50 bg-muted/10 p-2">
            <div className="flex items-center gap-1.5">
              <Input
                value={col.label}
                onChange={(e) => update(col.key, { label: e.target.value })}
                maxLength={TABLE_LABEL_MAX_LENGTH}
                placeholder={`Column ${i + 1} name`}
                className="h-8 min-w-0 flex-1 text-sm"
              />
              <select
                value={col.type}
                onChange={(e) => update(col.key, { type: e.target.value as TableColumnType })}
                className={fieldClass}
                aria-label="Column type"
              >
                {TABLE_COLUMN_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TABLE_COLUMN_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move column up"
                  className="flex h-7 w-6 items-center justify-center rounded-md text-muted-foreground/60 hover:bg-muted disabled:opacity-30"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === columns.length - 1}
                  aria-label="Move column down"
                  className="flex h-7 w-6 items-center justify-center rounded-md text-muted-foreground/60 hover:bg-muted disabled:opacity-30"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onColumnsChange(columns.filter((c) => c.key !== col.key))}
                  disabled={columns.length <= 1}
                  aria-label="Remove column"
                  className="flex h-7 w-6 items-center justify-center rounded-md text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
            {col.type === 'number' && (
              <Input
                value={col.unit}
                onChange={(e) => update(col.key, { unit: e.target.value })}
                maxLength={TABLE_UNIT_MAX_LENGTH}
                placeholder="Unit (optional) — kg, min, km…"
                className="h-7 text-xs"
              />
            )}
            {col.type === 'select' && (
              <Input
                value={col.optionsText}
                onChange={(e) => update(col.key, { optionsText: e.target.value })}
                placeholder="Choices, separated by commas — e.g. Easy, Medium, Hard"
                className="h-7 text-xs"
              />
            )}
          </div>
        ))}
      </div>

      {columns.length < TABLE_MAX_COLUMNS && (
        <button
          type="button"
          onClick={() => onColumnsChange([...columns, newColumnDraft('', 'number')])}
          className="flex items-center gap-1 rounded-full border border-dashed border-border/60 px-3 py-1 text-xs text-muted-foreground transition-all hover:border-border hover:text-foreground"
        >
          <Plus className="h-3 w-3" />
          Add column
        </button>
      )}

      <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="shrink-0">Analytics split by</span>
        <select
          value={groupBy}
          onChange={(e) => onGroupByChange(e.target.value)}
          className={`${fieldClass} min-w-0 flex-1`}
        >
          <option value="auto">
            Automatic{groupable[0]?.label ? ` (${groupable[0].label})` : ''}
          </option>
          <option value="none">Nothing — whole table</option>
          {groupable.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label || 'Unnamed column'}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
