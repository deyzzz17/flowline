'use client'

import { Task } from '@/payload-types'
import { TaskCard } from './task-card'
import { useTask } from '@/hooks/tasks/useTask'

interface TrashListProps {
  tasks: Task[]
}

export const Trash = ({ tasks }: TrashListProps) => {
  const taskManager = useTask()

  return (
    <div className="grid gap-4 w-full">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} taskManager={taskManager} />
      ))}
    </div>
  )
}
