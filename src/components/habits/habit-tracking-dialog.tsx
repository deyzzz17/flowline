'use client'

import { useState } from 'react'
import { Check, ChevronDown, SkipForward, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { TrackingField } from '@/api/habits/actions'

interface HabitTrackingDialogProps {
  open: boolean
  habitName: string
  habitColor: string
  fields: TrackingField[]
  onSubmit: (values: Record<string, number | string | boolean>) => void
  onSkip: () => void
  onClose: () => void
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: TrackingField
  value: number | string | boolean | undefined
  onChange: (v: number | string | boolean) => void
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
        >−</button>
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
        >+</button>
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

export function HabitTrackingDialog({
  open,
  habitName,
  habitColor,
  fields,
  onSubmit,
  onSkip,
  onClose,
}: HabitTrackingDialogProps) {
  const [values, setValues] = useState<Record<string, number | string | boolean>>({})
  const [expanded, setExpanded] = useState(true)

  if (!open) return null

  const handleSubmit = () => {
    onSubmit(values)
    setValues({})
  }

  const handleSkip = () => {
    onSkip()
    setValues({})
  }

  const setField = (key: string, val: number | string | boolean) => {
    setValues((prev) => ({ ...prev, [key]: val }))
  }

  const filledCount = Object.keys(values).filter((k) => {
    const v = values[k]
    return v !== undefined && v !== '' && v !== 0
  }).length

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-md mx-auto rounded-t-2xl sm:rounded-2xl border border-border/60 bg-background shadow-xl overflow-hidden">
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
              <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
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
          <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <p className="text-xs text-muted-foreground">
              Track your progress — fill in what you can, skip the rest.
            </p>

            {fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{field.label}</label>
                <FieldInput
                  field={field}
                  value={values[field.key]}
                  onChange={(v) => setField(field.key, v)}
                />
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