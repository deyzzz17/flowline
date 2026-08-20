'use client'
import { Task } from '@/payload-types'
import { TaskCard } from './task-card'
import { useTask } from '@/hooks/tasks/use-task'

interface AchievedListProps {
  tasks: Task[]
  readOnly?: boolean
  showListBadge?: boolean
  canHardDelete?: boolean
  canAssign?: boolean
}

export const AchievedList = ({
  tasks,
  readOnly,
  showListBadge,
  canHardDelete,
  canAssign,
}: AchievedListProps) => {
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
          canHardDelete={canHardDelete}
          canAssign={canAssign}
          taskManager={taskManager}
        />
      ))}
    </div>
  )
}
