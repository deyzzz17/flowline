'use client'

import { cn } from '@/lib/utils'

export interface DurationValue {
  hours: number
  minutes: number
  seconds: number
}

interface DurationPickerProps {
  value: DurationValue
  onChange: (value: DurationValue) => void
  error?: boolean
}

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, '0')
}

function Segment({
  value,
  label,
  onIncrement,
  onDecrement,
  onChange,
  error,
}: {
  value: number
  label: string
  onIncrement: () => void
  onDecrement: () => void
  onChange: (v: number) => void
  error?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={onIncrement}
        className="flex h-5 w-8 items-center justify-center rounded text-[10px] text-muted-foreground/50 hover:bg-muted hover:text-foreground transition-colors"
      >
        ▲
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={pad(value)}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, ''), 10)
          if (!isNaN(n)) onChange(n)
        }}
        className={cn(
          'h-8 w-8 rounded-lg border bg-background text-center text-sm font-light tabular-nums outline-none transition-all focus:border-primary/40',
          error ? 'border-destructive' : 'border-border/60',
        )}
      />
      <button
        type="button"
        onClick={onDecrement}
        className="flex h-5 w-8 items-center justify-center rounded text-[10px] text-muted-foreground/50 hover:bg-muted hover:text-foreground transition-colors"
      >
        ▼
      </button>
      <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground/50 mt-0.5">
        {label}
      </span>
    </div>
  )
}

export function DurationPicker({ value, onChange, error }: DurationPickerProps) {
  const set = (field: keyof DurationValue, v: number) => {
    const max = field === 'hours' ? 23 : 59
    onChange({ ...value, [field]: Math.max(0, Math.min(v, max)) })
  }

  return (
    <div className="flex items-start gap-1.5">
      <Segment
        value={value.hours}
        label="hrs"
        onIncrement={() => set('hours', value.hours + 1)}
        onDecrement={() => set('hours', value.hours - 1)}
        onChange={(v) => set('hours', v)}
        error={error}
      />
      <span className="mt-2 text-sm font-light text-muted-foreground/40">:</span>
      <Segment
        value={value.minutes}
        label="min"
        onIncrement={() => set('minutes', value.minutes + 1)}
        onDecrement={() => set('minutes', value.minutes - 1)}
        onChange={(v) => set('minutes', v)}
        error={error}
      />
      <span className="mt-2 text-sm font-light text-muted-foreground/40">:</span>
      <Segment
        value={value.seconds}
        label="sec"
        onIncrement={() => set('seconds', value.seconds + 1)}
        onDecrement={() => set('seconds', value.seconds - 1)}
        onChange={(v) => set('seconds', v)}
        error={error}
      />
    </div>
  )
}

export function durationToSeconds(d: DurationValue): number {
  return d.hours * 3600 + d.minutes * 60 + d.seconds
}

export function secondsToDuration(s: number): DurationValue {
  return {
    hours: Math.floor(s / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  }
}

export function emptyDuration(): DurationValue {
  return { hours: 0, minutes: 0, seconds: 0 }
}
