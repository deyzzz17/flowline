'use client'

import { Checkbox } from './ui/checkbox'
import { useTask } from '@/hooks/useTasks'
import type { Task } from '@/types'

const TaskCard = ({ id, title, description, status }: Task) => {
  const { toggleStatus, isUpdating } = useTask()
  const isCompleted = status === 'completed'

  return (
    <div
      className={`flex items-start space-x-4 p-4 bg-white border rounded-lg transition-opacity ${isUpdating ? 'opacity-50' : 'opacity-100'}`}
    >
      <div className="mt-1">
        <Checkbox
          id={id}
          checked={isCompleted}
          disabled={isUpdating}
          onCheckedChange={() => toggleStatus(id, status)}
        />
      </div>

      <div className="grid gap-1.5 leading-none">
        <label
          htmlFor={id}
          className={`text-base font-semibold cursor-pointer ${
            isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
          }`}
        >
          {title}
        </label>

        {description && <p className="text-sm text-slate-500 font-normal">{description}</p>}
      </div>
    </div>
  )
}

export default TaskCard
