'use client'

import { Task } from '@/payload-types'
import { TaskCard } from './task-card'
import { useTask } from '@/hooks/tasks/use-task'

interface TrashListProps {
  tasks: Task[]
  showListBadge?: boolean
  readOnly?: boolean
  canHardDelete?: boolean
}

export const Trash = ({ tasks, showListBadge, readOnly, canHardDelete }: TrashListProps) => {
  const taskManager = useTask()

  return (
    <div className="grid gap-3 sm:gap-4 w-full">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          showListBadge={showListBadge}
          readOnly={readOnly}
          canHardDelete={canHardDelete}
          taskManager={taskManager}
        />
      ))}
    </div>
  )
}
