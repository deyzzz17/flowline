'use client'

import TaskCard from './task-card'
import type { Task } from '@/types'

interface TaskListProps {
  tasks: Task[]
}

export function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50">
        <p className="text-slate-500">Your todo list is empty. Start by creating one!</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 w-full">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          id={task.id}
          title={task.title}
          description={task.description}
          status={task.status}
        />
      ))}
    </div>
  )
}
