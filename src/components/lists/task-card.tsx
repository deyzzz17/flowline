'use client'

import { Checkbox } from '../ui/checkbox'
import { useTask } from '@/hooks/tasks/use-task'
import type { Task } from '@/payload-types'
import { Button } from '../ui/button'
import {
  TrashIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface TaskCardProps {
  task: Task
  onDelete: (id: number) => void
  onRestore?: (id: number) => void
  isEditing?: boolean
  isDisabled?: boolean
  taskManager: ReturnType<typeof useTask>
}

export const TaskCard = ({
  task,
  onDelete,
  onRestore,
  isEditing,
  isDisabled,
  taskManager,
}: TaskCardProps) => {
  const { toggleStatus, isUpdating, startEditing, stopEditing, saveEdit, draft, updateDraft } =
    taskManager

  const isActive = task.status === 'active'
  const isCompleted = task.status === 'completed'
  const isDeleted = task.status === 'deleted'

  return (
    <>
      {isEditing && (
        <div className="fixed inset-0 z-10 cursor-default" onClick={() => saveEdit(task.id)} />
      )}

      <div
        className={`relative z-20 flex items-start space-x-4 p-4 rounded-xl border bg-background transition-all ${
          isEditing ? 'ring-2 ring-primary shadow-md border-transparent' : 'hover:bg-accent/50'
        } ${isDisabled ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'} ${
          isUpdating ? 'opacity-50' : ''
        }`}
      >
        <div className="mt-1">
          <Checkbox
            id={`${task.id}`}
            checked={isCompleted}
            disabled={isUpdating || isDeleted || isEditing || isDisabled}
            onCheckedChange={() => toggleStatus(task.id, task.status as 'active' | 'completed')}
          />
        </div>

        <div className="flex-1 grid gap-1.5 leading-none">
          {isEditing ? (
            <div className="space-y-2">
              <input
                autoFocus
                className="w-full bg-transparent text-base font-semibold outline-none border-b border-primary/30 focus:border-primary transition-colors"
                value={draft.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit(task.id)}
                placeholder="Task title"
              />
              <textarea
                className="w-full bg-accent/30 p-2 rounded-md text-sm outline-none resize-none min-h-15"
                value={draft.description}
                onChange={(e) => updateDraft({ description: e.target.value })}
                placeholder="Add a description..."
              />
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    saveEdit(task.id)
                    stopEditing()
                  }}
                >
                  <CheckIcon />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-muted-foreground"
                  onClick={stopEditing}
                >
                  <XMarkIcon />
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-0.5">
              <label
                className={`text-base font-semibold block transition-colors ${
                  isCompleted ? 'line-through text-muted-foreground/60' : 'text-foreground'
                }`}
              >
                {task.title}
              </label>

              {task.description && (
                <p className="text-sm text-muted-foreground font-normal leading-relaxed mt-1 whitespace-pre-wrap">
                  {task.description}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center self-center space-x-1">
          {!isEditing && isActive && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-primary transition-colors"
              onClick={() => startEditing(task)}
              disabled={isDisabled}
            >
              <PencilSquareIcon className="h-5 w-5" />
            </Button>
          )}

          {isDeleted ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-primary transition-transform hover:rotate-180"
                onClick={() => onRestore?.(task.id)}
                disabled={isDisabled}
              >
                <ArrowPathIcon className="h-5 w-5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the task{' '}
                      <strong>{task.title}</strong> from your list.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(task.id)} variant="destructive">
                      Delete permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              onClick={() => onDelete(task.id)}
              disabled={isDisabled}
            >
              <TrashIcon className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
