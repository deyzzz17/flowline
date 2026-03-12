'use client'

import { Checkbox } from './ui/checkbox'
import { useTask } from '@/hooks/useTasks'
import type { Task } from '@/payload-types'

export const TaskCard = ({ task }: { task: Task }) => {
  const { toggleStatus, isUpdating } = useTask()
  const isCompleted = task.status === 'completed'

  return (
    <div
      className={`flex items-start space-x-4 p-4 rounded-lg border bg-background transition-all hover:bg-accent/50 ${
        isUpdating ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div className="mt-1">
        <Checkbox
          id={`${task.id}`}
          checked={isCompleted}
          disabled={isUpdating}
          onCheckedChange={() => toggleStatus(task.id, task.status)}
        />
      </div>

      <div className="grid gap-1.5 leading-none">
        <label
          htmlFor={`${task.id}`}
          className={`text-base font-semibold cursor-pointer transition-colors ${
            isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
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
    </div>
  )
}
