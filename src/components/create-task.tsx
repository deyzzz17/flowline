'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useManageForm, useTaskCreation } from '@/hooks/useTaskForm'

const CreateTask = () => {
  const { isOpen, open, close } = useManageForm()
  const { title, setTitle, description, setDescription, showError, isLoading, saveTask } =
    useTaskCreation()

  const handleOnSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await saveTask()
    if (success) {
      close()
    }
  }

  return (
    <Dialog open={isOpen}>
      <DialogTrigger asChild>
        <Button onClick={open} className="gap-2">
          <PlusIcon className="h-5 w-5" /> New Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleOnSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className={`text-sm font-medium ${showError ? 'text-red-500' : ''}`}>
              Title {showError && '(Requis)'}
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={showError ? 'border-red-500' : ''}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Recording...' : 'Record'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateTask
