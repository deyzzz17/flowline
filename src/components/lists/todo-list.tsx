'use client'

import { Task } from '@/payload-types'
import { TaskCard } from './task-card'
import { useTask } from '@/hooks/tasks/use-task'

interface TaskListProps {
  tasks: Task[]
  onDelete: (id: number) => void
}

export function TodoList({ tasks, onDelete }: TaskListProps) {
  const taskManager = useTask()

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-dashed bg-card/30 text-center">
        <p className="text-sm text-muted-foreground">
          Your todo list is empty. Start by creating one!
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 w-full">
      {tasks.map((task) => {
        const isEditing = taskManager.editingId === task.id
        const isDisabled = taskManager.editingId !== undefined && !isEditing
        return (
          <TaskCard
            key={task.id}
            task={task}
            onDelete={onDelete}
            isEditing={isEditing}
            isDisabled={isDisabled}
            taskManager={taskManager}
          />
        )
      })}
    </div>
  )
}
