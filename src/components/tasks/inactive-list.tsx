'use client'
import { Task } from '@/payload-types'
import { TaskCard } from './task-card'
import { useTask } from '@/hooks/tasks/use-task'

interface InactiveListProps {
  tasks: Task[]
  readOnly?: boolean
  noEdit?: boolean
  showListBadge?: boolean
}

export const InactiveList = ({ tasks, readOnly, noEdit, showListBadge }: InactiveListProps) => {
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
          taskManager={taskManager}
        />
      ))}
    </div>
  )
}
