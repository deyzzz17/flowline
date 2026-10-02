'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronDown, Copy, History, Plus, SkipForward, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { getHabitTableHistory, type TrackingField } from '@/api/habits/actions'
import {
  sanitizeTableRows,
  TABLE_MAX_ROWS,
  type TableColumn,
  type TableRow,
  type TrackingValue,
  type TrackingValues,
} from '@/lib/tracking-fields'

interface HabitTrackingDialogProps {
  open: boolean
  /** Needed for list (table) fields: last session and typed-value suggestions. */
  habitId?: number
  habitName: string
  habitColor: string
  fields: TrackingField[]
  onSubmit: (values: TrackingValues) => void
  onSkip: () => void
  onClose: () => void
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: TrackingField
  value: TrackingValue | undefined
  onChange: (v: TrackingValue) => void
}) {
  if (field.type === 'boolean') {
    const checked = value === true
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-xl border-2 transition-all',
            checked ? 'border-transparent text-white' : 'border-border/60',
          )}
          style={checked ? { backgroundColor: '#8b5cf6' } : undefined}
        >
          {checked && <Check className="h-4 w-4" strokeWidth={3} />}
        </button>
        <span className="text-sm text-muted-foreground">{checked ? 'Yes' : 'No'}</span>
      </div>
    )
  }

  if (field.type === 'number') {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, Number(value ?? 0) - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-sm hover:bg-muted"
        >
          −
        </button>
        <input
          type="number"
          value={value === undefined ? '' : String(value)}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          className="w-20 h-8 rounded-lg border border-border/60 bg-background px-3 text-center text-sm outline-none focus:border-primary/40"
          min={0}
        />
        <button
          type="button"
          onClick={() => onChange(Number(value ?? 0) + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-sm hover:bg-muted"
        >
          +
        </button>
      </div>
    )
  }

  return (
    <input
      type="text"
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Type something..."
      className="w-full h-9 rounded-lg border border-border/60 bg-background px-3 text-sm outline-none focus:border-primary/40 transition-colors"
    />
  )
}

const cellInputClass =
  'h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-sm outline-none focus:border-primary/40 transition-colors'

function TableCellInput({
  column,
  value,
  onChange,
  suggestionsId,
}: {
  column: TableColumn
  value: TableRow[string] | undefined
  onChange: (v: TableRow[string] | undefined) => void
  suggestionsId?: string
}) {
  if (column.type === 'boolean') {
    const checked = value === true
    return (
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          'flex h-8 items-center gap-2 rounded-lg border px-2 text-xs font-medium transition-all',
          checked
            ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
            : 'border-border/60 text-muted-foreground hover:bg-muted',
        )}
      >
        <span
          className={cn(
            'flex h-3.5 w-3.5 items-center justify-center rounded border-2',
            checked ? 'border-violet-500 bg-violet-500' : 'border-border/60',
          )}
        >
          {checked && <Check className="h-2 w-2 text-white" strokeWidth={3} />}
        </span>
        {checked ? 'Yes' : 'No'}
      </button>
    )
  }
  if (column.type === 'select') {
    return (
      <select
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className={cellInputClass}
      >
        <option value="">—</option>
        {(column.options ?? []).map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    )
  }
  if (column.type === 'number') {
    return (
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          value={typeof value === 'number' ? String(value) : ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          className={cn(cellInputClass, column.unit && 'pr-9')}
        />
        {column.unit && (
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground/70">
            {column.unit}
          </span>
        )}
      </div>
    )
  }
  return (
    <input
      type="text"
      list={suggestionsId}
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      className={cellInputClass}
    />
  )
}

// A table field: one card per row (no horizontal scrolling, whatever the
// number of columns), each column's input labelled.
function TableInput({
  field,
  rows,
  onChange,
  lastRows,
  suggestions,
}: {
  field: TrackingField
  rows: TableRow[]
  onChange: (rows: TableRow[]) => void
  lastRows: TableRow[]
  suggestions: Record<string, string[]>
}) {
  const columns = field.columns ?? []
  const setCell = (index: number, key: string, v: TableRow[string] | undefined) =>
    onChange(
      rows.map((row, i) => {
        if (i !== index) return row
        const next = { ...row }
        if (v === undefined) delete next[key]
        else next[key] = v
        return next
      }),
    )
  const canAdd = rows.length < TABLE_MAX_ROWS

  return (
    <div className="space-y-2">
      {columns
        .filter((c) => c.type === 'text' && (suggestions[c.key]?.length ?? 0) > 0)
        .map((c) => (
          <datalist key={c.key} id={`${field.key}-${c.key}-suggestions`}>
            {suggestions[c.key].map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        ))}

      {rows.map((row, i) => (
        <div key={i} className="rounded-xl border border-border/50 bg-muted/10 p-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
              Row {i + 1}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() =>
                  canAdd && onChange([...rows.slice(0, i + 1), { ...row }, ...rows.slice(i + 1)])
                }
                disabled={!canAdd}
                title="Duplicate row"
                aria-label="Duplicate row"
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/60 hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => onChange(rows.filter((_, j) => j !== i))}
                title="Remove row"
                aria-label="Remove row"
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {columns.map((col) => (
              <label key={col.key} className="min-w-0 space-y-1">
                <span className="block truncate text-[11px] text-muted-foreground">
                  {col.label}
                </span>
                <TableCellInput
                  column={col}
                  value={row[col.key]}
                  onChange={(v) => setCell(i, col.key, v)}
                  suggestionsId={
                    col.type === 'text' && (suggestions[col.key]?.length ?? 0) > 0
                      ? `${field.key}-${col.key}-suggestions`
                      : undefined
                  }
                />
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => canAdd && onChange([...rows, {}])}
          disabled={!canAdd}
          className="flex items-center gap-1 rounded-full border border-dashed border-border/60 px-3 py-1 text-xs text-muted-foreground transition-all hover:border-border hover:text-foreground disabled:opacity-40"
        >
          <Plus className="h-3 w-3" />
          Add row
        </button>
        {lastRows.length > 0 && (
          <button
            type="button"
            onClick={() => onChange(lastRows.map((r) => ({ ...r })))}
            className="flex items-center gap-1 rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          >
            <History className="h-3 w-3" />
            Repeat last session ({lastRows.length} row{lastRows.length > 1 ? 's' : ''})
          </button>
        )}
      </div>
    </div>
  )
}

export function HabitTrackingDialog({
  open,
  habitId,
  habitName,
  habitColor,
  fields,
  onSubmit,
  onSkip,
  onClose,
}: HabitTrackingDialogProps) {
  const fieldsKey = fields.map((f) => f.key).join(',')
  const [values, setValues] = useState<TrackingValues>({})
  const [expanded, setExpanded] = useState(true)
  const queryClient = useQueryClient()

  const hasTables = fields.some((f) => f.type === 'list')
  const { data: tableHistory } = useQuery({
    queryKey: ['habit-table-history', habitId],
    queryFn: () => getHabitTableHistory(habitId!),
    enabled: open && hasTables && habitId !== undefined,
    staleTime: 0,
  })

  if (!open) return null

  const reset = () => {
    setValues({})
    if (hasTables) queryClient.invalidateQueries({ queryKey: ['habit-table-history', habitId] })
  }

  const handleSubmit = () => {
    const submitted: TrackingValues = {}
    for (const f of fields) {
      const v = values[f.key]
      if (f.type === 'list') {
        // Empty rows are dropped; nothing is saved for an empty table.
        const rows = sanitizeTableRows(f.columns ?? [], v)
        if (rows.length > 0) submitted[f.key] = rows
      } else if (f.type === 'boolean') {
        // A yes/no field shows "No" until toggled: save that "No" explicitly,
        // so analytics can tell it apart from a field never answered.
        submitted[f.key] = v === true
      } else if (v !== undefined) {
        submitted[f.key] = v
      }
    }
    onSubmit(submitted)
    reset()
  }

  const handleSkip = () => {
    onSkip()
    reset()
  }

  const setField = (key: string, val: TrackingValue) => {
    setValues((prev) => ({ ...prev, [key]: val }))
  }

  const filledCount = fields.filter((f) => {
    const v = values[f.key]
    if (f.type === 'list') return sanitizeTableRows(f.columns ?? [], v).length > 0
    return v !== undefined && v !== '' && v !== 0
  }).length

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div
        className={cn(
          'relative z-10 w-full mx-auto rounded-t-2xl sm:rounded-2xl border border-border/60 bg-background shadow-xl overflow-hidden',
          hasTables ? 'sm:max-w-xl' : 'sm:max-w-md',
        )}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-border/40"
          style={{ borderTop: `3px solid ${habitColor}` }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">
              Nice work! 🎉
            </p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{habitName}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')}
              />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {expanded && (
          <div key={fieldsKey} className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <p className="text-xs text-muted-foreground">
              Track your progress — fill in what you can, skip the rest.
            </p>

            {fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{field.label}</label>
                {field.type === 'list' ? (
                  <TableInput
                    field={field}
                    rows={
                      Array.isArray(values[field.key]) ? (values[field.key] as TableRow[]) : [{}]
                    }
                    onChange={(rows) => setField(field.key, rows)}
                    lastRows={tableHistory?.[field.key]?.lastRows ?? []}
                    suggestions={tableHistory?.[field.key]?.suggestions ?? {}}
                  />
                ) : (
                  <FieldInput
                    field={field}
                    value={values[field.key]}
                    onChange={(v) => setField(field.key, v)}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 px-5 py-4 border-t border-border/40 bg-muted/10">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="gap-1.5 text-muted-foreground"
          >
            <SkipForward className="h-3.5 w-3.5" />
            Skip
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            className="flex-1 gap-1.5"
            style={{ backgroundColor: habitColor, color: 'white' }}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
            Save{filledCount > 0 ? ` (${filledCount} field${filledCount > 1 ? 's' : ''})` : ''}
          </Button>
        </div>
      </div>
    </div>
  )
}
