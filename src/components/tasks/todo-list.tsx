'use client'

import { Task } from '@/payload-types'
import { TaskCard } from './task-card'
import { useTask } from '@/hooks/tasks/use-task'

interface TodoListProps {
  tasks: Task[]
  readOnly?: boolean
  noEdit?: boolean
}

export const TodoList = ({ tasks, readOnly, noEdit }: TodoListProps) => {
  const taskManager = useTask()

  return (
    <div className="grid gap-4 w-full">
      {tasks.map((task) => {
        const isEditing = taskManager.editingId === task.id
        const isDisabled = taskManager.editingId !== undefined && !isEditing
        return (
          <TaskCard
            key={task.id}
            task={task}
            isEditing={isEditing}
            isDisabled={isDisabled}
            readOnly={readOnly}
            noEdit={noEdit}
            taskManager={taskManager}
          />
        )
      })}
    </div>
  )
}
