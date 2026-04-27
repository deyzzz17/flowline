'use client'

import { useState, useRef } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task } from '@/payload-types'

function hexToRgba(hex: string, alpha: number) {
  try {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${alpha})`
  } catch {
    return `rgba(139,92,246,${alpha})`
  }
}

interface TaskSelectProps {
  tasks: Task[]
  value: number | null
  onChange: (id: number | null) => void
}

export function TaskSelect({ tasks, value, onChange }: TaskSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  type ListObj = { name: string; category?: { color?: string | null } | null }

  const selectedTask = tasks.find((t) => t.id === value) ?? null

  const filtered = tasks.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))

  const handleTriggerClick = () => {
    if (open) {
      setOpen(false)
      setSearch('')
    } else {
      setOpen(true)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  const handleSelect = (task: Task | null) => {
    onChange(task?.id ?? null)
    setOpen(false)
    setSearch('')
  }

  const handleBlur = () => {
    setTimeout(() => {
      if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
        setOpen(false)
        setSearch('')
      }
    }, 150)
  }

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <button
        type="button"
        onClick={handleTriggerClick}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-xl border bg-background px-3 py-2.5 text-sm transition-all',
          open
            ? 'border-primary/40 ring-1 ring-primary/20'
            : 'border-border/60 hover:border-border',
        )}
      >
        {selectedTask ? (
          <div className="flex flex-1 items-center gap-2 min-w-0">
            {(() => {
              const list =
                selectedTask.list && typeof selectedTask.list === 'object'
                  ? (selectedTask.list as ListObj)
                  : null
              const color = list?.category?.color ?? '#8b5cf6'
              return list ? (
                <span
                  className="inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: hexToRgba(color, 0.1),
                    color,
                    border: `1px solid ${hexToRgba(color, 0.25)}`,
                  }}
                >
                  {list.name}
                </span>
              ) : null
            })()}
            <span className="truncate text-foreground">{selectedTask.title}</span>
          </div>
        ) : (
          <span className="flex-1 text-left text-muted-foreground">No task</span>
        )}

        <div className="flex shrink-0 items-center gap-1">
          {selectedTask && (
            <span
              role="button"
              tabIndex={0}
              onMouseDown={(e) => {
                e.stopPropagation()
                onChange(null)
              }}
              className="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground/50 transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 bottom-full mb-1.5 w-full rounded-xl border border-border/60 bg-popover shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
              onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            />
          </div>

          <div className="max-h-52 overflow-y-auto py-1">
            <button
              type="button"
              onMouseDown={() => handleSelect(null)}
              className={cn(
                'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-muted/60',
                !value && 'bg-muted/40',
              )}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                {!value && <Check className="h-3.5 w-3.5 text-violet-500" />}
              </span>
              <span className="text-muted-foreground">No task</span>
            </button>

            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground/60">
                No tasks found
              </p>
            ) : (
              filtered.map((task) => {
                const list =
                  task.list && typeof task.list === 'object' ? (task.list as ListObj) : null
                const color = list?.category?.color ?? '#8b5cf6'
                const isSelected = task.id === value

                return (
                  <button
                    key={task.id}
                    type="button"
                    onMouseDown={() => handleSelect(task)}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-muted/60',
                      isSelected && 'bg-muted/40',
                    )}
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                      {isSelected && <Check className="h-3.5 w-3.5 text-violet-500" />}
                    </span>
                    <div className="flex flex-1 items-center gap-2 min-w-0">
                      <span className="truncate text-foreground">{task.title}</span>
                    </div>
                    {list && (
                      <span
                        className="shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: hexToRgba(color, 0.1),
                          color,
                          border: `1px solid ${hexToRgba(color, 0.25)}`,
                        }}
                      >
                        {list.name}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
