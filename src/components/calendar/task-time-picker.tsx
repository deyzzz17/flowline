'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const HOURS = Array.from({ length: 24 }, (_, i) => i)

interface TaskTimePickerProps {
  open: boolean
  date: Date | null
  taskTitle: string
  onConfirm: (date: Date) => void
  onCancel: () => void
}

export function TaskTimePicker({ open, date, taskTitle, onConfirm, onCancel }: TaskTimePickerProps) {
  const [selectedHour, setSelectedHour] = useState(9)
  const [selectedMinute, setSelectedMinute] = useState(0)

  if (!date) return null

  const dateLabel = date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const handleConfirm = () => {
    const newDate = new Date(date)
    newDate.setHours(selectedHour, selectedMinute, 0, 0)
    onConfirm(newDate)
  }

  const pad = (n: number) => n.toString().padStart(2, '0')

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel() }}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-violet-500" />
            Set due time
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div>
            <p className="text-xs font-medium text-foreground truncate">{taskTitle}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{dateLabel}</p>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">Hour</p>
            <div className="grid grid-cols-6 gap-1 max-h-36 overflow-y-auto pr-1">
              {HOURS.map((h) => (
                <button key={h} type="button" onClick={() => setSelectedHour(h)}
                  className={cn(
                    'rounded-lg py-1.5 text-xs font-medium transition-all border',
                    selectedHour === h
                      ? 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                      : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}>
                  {pad(h)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">Minutes</p>
            <div className="grid grid-cols-4 gap-1">
              {[0, 15, 30, 45].map((m) => (
                <button key={m} type="button" onClick={() => setSelectedMinute(m)}
                  className={cn(
                    'rounded-lg py-1.5 text-xs font-medium transition-all border',
                    selectedMinute === m
                      ? 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                      : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}>
                  :{pad(m)}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-2.5 text-center">
            <p className="text-sm font-semibold text-foreground">
              {pad(selectedHour)}:{pad(selectedMinute)}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">{dateLabel}</p>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={onCancel}>Cancel</Button>
            <Button className="flex-1" onClick={handleConfirm}>Confirm</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}