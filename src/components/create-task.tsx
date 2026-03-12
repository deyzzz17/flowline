'use client'

import * as React from 'react'
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
import { Separator } from './ui/separator'
import { useManageForm, useTaskCreation } from '@/hooks/useTaskForm'

export const CreateTask = () => {
  const { isOpen, open, close, setIsOpen } = useManageForm()
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
          onClick={open}
          className="group gap-3 px-4 py-6 rounded-xl border border-input bg-background text-foreground hover:bg-accent transition-all shadow-sm"
        >
          <span className="text-muted-foreground group-hover:text-foreground transition-colors">
            Add a new task
          </span>
          <div className="bg-blue-50 dark:bg-blue-950 p-1.5 rounded-md transition-colors group-hover:bg-blue-100 dark:group-hover:bg-blue-900">
            <PlusIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-131.25 max-h-[90vh] overflow-y-auto gap-6 p-6 bg-card text-card-foreground border rounded-2xl shadow-lg">
        <DialogHeader className="p-0 pt-8 flex flex-col items-center">
          <DialogTitle className="text-xl font-semibold tracking-tight text-foreground leading-none">
            New Task
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-0 px-8 text-center">
            Add a title and description for your task.
          </DialogDescription>
          <Separator className="mt-0 bg-border/40" />
        </DialogHeader>
        <form onSubmit={handleOnSubmit} className="space-y-6">
          <div className="space-y-3">
            {' '}
            <div className="flex items-center justify-between">
              <label htmlFor="taskTitle" className="text-base font-semibold text-foreground">
                Title
              </label>
              {showError && (
                <div className="flex items-center gap-1.5 text-sm font-medium text-red-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Title is required
                </div>
              )}
            </div>
            <Input
              id="taskTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className={`p-3 h-12 text-base rounded-xl bg-background transition-all max-w-full break-all focus-visible:ring-0 focus-visible:ring-offset-0 ${
                showError ? 'border-red-500 bg-red-50/30' : 'border-input'
              }`}
            />
          </div>
          <div className="flex flex-col">
            {' '}
            <label htmlFor="taskDescription" className="text-base font-semibold text-foreground">
              Description
            </label>
            <Textarea
              id="taskDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              className="mt-3 p-3 h-32 overflow-y-auto text-base rounded-xl bg-background text-foreground border-input resize-none leading-relaxed break-all focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t mt-8">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              className="px-6 h-12 text-base font-semibold rounded-xl text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="px-6 h-12 text-base font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              {isLoading ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
