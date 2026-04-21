'use client'

import { Task } from '@/payload-types'
import { TaskCard } from './task-card'
import { useTask } from '@/hooks/tasks/use-task'

interface TrashListProps {
  tasks: Task[]
  showListBadge?: boolean
}

export const Trash = ({ tasks, showListBadge }: TrashListProps) => {
  const taskManager = useTask()

  return (
    <div className="grid gap-4 w-full">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          showListBadge={showListBadge}
          taskManager={taskManager}
        />
      ))}
    </div>
  )
}
