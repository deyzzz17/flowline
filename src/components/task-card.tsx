'use client'

import { Checkbox } from './ui/checkbox'
import { useTask } from '@/hooks/useTasks'
import type { Task } from '@/payload-types'
import { Button } from './ui/button'
import { TrashIcon } from '@heroicons/react/24/outline'

interface TaskCardProps {
  task: Task
  onDelete: (id: number) => void
}

export const TaskCard = ({ task, onDelete }: TaskCardProps) => {
  const { toggleStatus, isUpdating } = useTask()
  const isCompleted = task.status === 'completed'

  return (
    <div
      className={`flex items-start space-x-4 p-4 rounded-xl border bg-background transition-all hover:bg-accent/50 ${
        isUpdating ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div className="mt-1">
        <Checkbox
          id={`${task.id}`}
          checked={isCompleted}
          disabled={isUpdating}
          onCheckedChange={() => toggleStatus(task.id, task.status as 'active' | 'completed')}
        />
      </div>

      <div className="flex-1 grid gap-1.5 leading-none">
        <label
          htmlFor={`${task.id}`}
          className={`text-base font-semibold cursor-pointer transition-colors ${
            isCompleted ? 'line-through text-muted-foreground/60' : 'text-foreground'
          }`}
        >
          {task.title}
        </label>

        {task.description && (
          <p className="text-sm text-muted-foreground font-normal leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      <div className="flex items-center self-center">
        {' '}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          onClick={() => onDelete(task.id)}
        >
          <TrashIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
