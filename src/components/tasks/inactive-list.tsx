'use client'
import { Task } from '@/payload-types'
import { TaskCard } from './task-card'
import { useTask } from '@/hooks/tasks/use-task'

interface InactiveListProps {
  tasks: Task[]
  readOnly?: boolean
  noEdit?: boolean
  showListBadge?: boolean
  canHardDelete?: boolean
}

export const InactiveList = ({
  tasks,
  readOnly,
  noEdit,
  showListBadge,
  canHardDelete,
}: InactiveListProps) => {
  const taskManager = useTask()
  return (
    <div className="grid gap-3 sm:gap-4 w-full">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          readOnly={readOnly}
          noEdit={noEdit}
          showListBadge={showListBadge}
          canHardDelete={canHardDelete}
          taskManager={taskManager}
        />
      ))}
    </div>
  )
}
