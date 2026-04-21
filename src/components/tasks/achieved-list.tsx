'use client'

import { Task } from '@/payload-types'
import { TaskCard } from './task-card'
import { useTask } from '@/hooks/tasks/use-task'

interface AchievedListProps {
  tasks: Task[]
  readOnly?: boolean
}

export const AchievedList = ({ tasks, readOnly }: AchievedListProps) => {
  const taskManager = useTask()

  return (
    <div className="grid gap-4 w-full">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} isDisabled={readOnly} taskManager={taskManager} />
      ))}
    </div>
  )
}
