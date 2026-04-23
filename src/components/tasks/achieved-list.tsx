'use client'
import { Task } from '@/payload-types'
import { TaskCard } from './task-card'
import { useTask } from '@/hooks/tasks/use-task'

interface AchievedListProps {
  tasks: Task[]
  readOnly?: boolean
  showListBadge?: boolean
}

export const AchievedList = ({ tasks, readOnly, showListBadge }: AchievedListProps) => {
  const taskManager = useTask()
  return (
    <div className="grid gap-3 sm:gap-4 w-full">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          isDisabled={readOnly ? false : undefined}
          readOnly={readOnly}
          showListBadge={showListBadge}
          taskManager={taskManager}
        />
      ))}
    </div>
  )
}
