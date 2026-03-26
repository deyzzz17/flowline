'use client'

import { Task } from '@/payload-types'
import { TaskCard } from './task-card'
import { useTask } from '@/hooks/tasks/use-task'

interface InactiveListProps {
  tasks: Task[]
}

export const InactiveList = ({ tasks }: InactiveListProps) => {
  const taskManager = useTask()
  return (
    <div className="grid gap-4 w-full">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} taskManager={taskManager} />
      ))}
    </div>
  )
}
