'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PlusIcon } from '@heroicons/react/24/outline'
import { AlertCircleIcon } from 'lucide-react'
import { useManageForm } from '@/hooks/tasks/use-manage-form'
import { useTaskCreation } from '@/hooks/tasks/use-task-creation'

export const CreateTask = () => {
  const { isOpen, close, setIsOpen } = useManageForm()
  const { title, setTitle, description, setDescription, showError, isLoading, saveTask } =
    useTaskCreation()

  const handleOnSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await saveTask()
    if (success) {
      close()
    }
  }

  const handleCancel = () => {
    close()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full max-w-48 justify-between h-12 px-5 shadow-sm group"
        >
          <span className="font-medium text-muted-foreground group-hover:text-foreground">
            Add a new task
          </span>
          <div className="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors ml-4">
            <PlusIcon className="size-4" strokeWidth={3} />
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogTitle>New Task</DialogTitle>
        <DialogHeader>
          <DialogDescription>Add a title and description for your task.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleOnSubmit} className="space-y-6">
          <div className="space-y-2">
            {' '}
            <div className="flex items-center justify-between">
              <label htmlFor="taskTitle" className="text-sm font-medium leading-none">
                Title
              </label>
              {showError && (
                <p className="text-destructive text-xs font-semibold flex items-center gap-1 animate-in fade-in slide-in-from-right-1">
                  <AlertCircleIcon size={12} />
                  Title is required
                </p>
              )}
            </div>
            <Input
              id="taskTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className={cn(
                'transition-all',
                showError && 'border-destructive focus-visible:ring-destructive bg-destructive/5',
              )}
            />
          </div>
          <div className="space-y-2">
            {' '}
            <label htmlFor="taskDescription" className="text-sm font-medium leading-none">
              Description
            </label>
            <Textarea
              id="taskDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              className="mt-3 p-3 h-24 overflow-y-auto text-base text-foreground border-input resize-none leading-relaxed break-all"
            />
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button type="button" variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button disabled={isLoading} className="bg-primary px-8">
              {isLoading ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
