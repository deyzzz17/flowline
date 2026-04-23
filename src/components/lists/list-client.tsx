'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TodoList } from '@/components/tasks/todo-list'
import { AchievedList } from '@/components/tasks/achieved-list'
import { InactiveList } from '@/components/tasks/inactive-list'
import { Trash } from '@/components/tasks/trash-list'
import { CreateTask } from '@/components/tasks/create-task'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import {
  CheckCircle2,
  CheckCircleIcon,
  ClipboardList,
  ListTodo,
  Loader2,
  Check,
  Sparkles,
  Trash2,
  PauseCircle,
} from 'lucide-react'
import { useEditList } from '@/hooks/lists/use-edit-list'
import { useDeleteList } from '@/hooks/lists/use-delete-list'
import { cn } from '@/lib/utils'
import type { List } from '@/payload-types'

function hexToRgba(hex: string, alpha: number) {
  try {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${alpha})`
  } catch {
    return `rgba(139,92,246,${alpha})`
  }
}

const PRESET_COLORS = [
  '#8b5cf6',
  '#6366f1',
  '#3b82f6',
  '#0ea5e9',
  '#10b981',
  '#84cc16',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#f97316',
  '#14b8a6',
  '#64748b',
]

interface ListClientProps {
  list: List
}

export const ListClient = ({ list }: ListClientProps) => {
  const { data } = useQuery({
    queryKey: ['tasks', list.id],
    queryFn: () => api.tasks.list(1, list.id),
  })

  const allTasks = data?.docs ?? []
  const todoTasks = allTasks.filter((t) => t.status === 'active')
  const achievedTasks = allTasks.filter((t) => t.status === 'completed')
  const inactiveTasks = allTasks.filter((t) => t.status === 'inactive')
  const trashedTasks = allTasks.filter((t) => t.status === 'deleted')

  const activePlusDone = allTasks.filter((t) => t.status === 'active' || t.status === 'completed')
  const completionRate =
    activePlusDone.length > 0 ? Math.round((achievedTasks.length / activePlusDone.length) * 100) : 0

  const categoryColor = list.category?.color ?? '#8b5cf6'

  const {
    editOpen,
    setEditOpen,
    name,
    setName,
    categoryName,
    setCategoryName,
    color,
    setColor,
    editError,
    setEditError,
    handleOpen,
    handleSubmit,
    isPending: isEditing,
  } = useEditList(list)

  const { handleDelete, isPending: isDeleting } = useDeleteList(list)

  return (
    <>
      <section className="mb-8 mt-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: categoryColor }}
              />
              <p className="text-xl font-semibold uppercase" style={{ color: categoryColor }}>
                {list.category?.name ?? 'List'}
              </p>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{list.name}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {allTasks.length === 0
                ? 'No tasks yet, create your first one below.'
                : `${todoTasks.length} active · ${achievedTasks.length} completed · ${trashedTasks.length} trashed`}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleOpen}
              >
                <PencilSquareIcon className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TrashIcon className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this list?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete <strong>{list.name}</strong> and all its tasks.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      variant="destructive"
                      disabled={isDeleting}
                    >
                      Delete list
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {activePlusDone.length > 0 && (
              <>
                <span className="text-xs text-muted-foreground">
                  {achievedTasks.length}/{activePlusDone.length} done
                </span>
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${completionRate}%`, backgroundColor: categoryColor }}
                  />
                </div>
                <span className="text-xs font-semibold" style={{ color: categoryColor }}>
                  {completionRate}%
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit list</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-1">
            {editError && <p className="text-sm text-destructive">{editError}</p>}
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setEditError(null)
                }}
                placeholder="List name..."
                className={cn('h-11', editError && !name.trim() && 'border-destructive')}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">
                Category{' '}
                <span className="text-xs font-normal text-muted-foreground ml-1">Optional</span>
              </Label>
              <Input
                id="edit-category"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g. Work, Health..."
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      'h-7 w-7 rounded-full transition-all',
                      color === c
                        ? 'ring-2 ring-offset-2 ring-offset-background scale-110'
                        : 'hover:scale-105',
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <div className="relative">
                  <div
                    className="h-7 w-7 rounded-full border-2 border-dashed border-border/60 cursor-pointer"
                    style={{
                      backgroundColor: PRESET_COLORS.includes(color) ? 'transparent' : color,
                    }}
                  />
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full rounded-full"
                  />
                </div>
              </div>
              <div
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium mt-1"
                style={{
                  backgroundColor: hexToRgba(color, 0.1),
                  borderColor: hexToRgba(color, 0.3),
                  color,
                }}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                {name || 'Preview'}
                {categoryName && <span className="text-xs opacity-70">· {categoryName}</span>}
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isEditing || !name.trim()} className="gap-2">
                {isEditing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Save changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="todo" className="w-full">
        <div className="mb-8">
          <TabsList className="h-10 w-full rounded-xl bg-muted/60 p-1 sm:w-auto">
            <TabsTrigger
              value="todo"
              className="flex-1 sm:flex-none gap-1.5 rounded-lg px-2 sm:px-4 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <ClipboardList className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden xs:inline sm:inline">To do</span>
              {todoTasks.length > 0 && (
                <span className="ml-0.5 rounded-full bg-violet-500/15 px-1.5 py-px text-[10px] font-bold text-violet-600 dark:text-violet-400">
                  {todoTasks.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="achieved"
              className="flex-1 sm:flex-none gap-1.5 rounded-lg px-2 sm:px-4 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden xs:inline sm:inline">Achieved</span>
            </TabsTrigger>
            <TabsTrigger
              value="inactive"
              className="flex-1 sm:flex-none gap-1.5 rounded-lg px-2 sm:px-4 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <PauseCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden xs:inline sm:inline">Inactive</span>
              {inactiveTasks.length > 0 && (
                <span className="ml-0.5 rounded-full bg-muted px-1.5 py-px text-[10px] font-bold text-muted-foreground">
                  {inactiveTasks.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="trashed"
              className="flex-1 sm:flex-none gap-1.5 rounded-lg px-2 sm:px-4 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden xs:inline sm:inline">Trash</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="todo" className="outline-none">
          <div className="space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">To do</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {todoTasks.length === 0
                    ? 'Your list is clear, add something to get started.'
                    : `${todoTasks.length} task${todoTasks.length !== 1 ? 's' : ''} remaining.`}
                </p>
              </div>
              <CreateTask listId={list.id} />
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                    In progress
                  </span>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  {todoTasks.length}
                </span>
              </div>
              <div className="p-3 sm:p-5">
                {todoTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                      <Sparkles className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">All clear</p>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      Create a task above to get started.
                    </p>
                  </div>
                ) : (
                  <TodoList tasks={todoTasks} />
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="achieved" className="outline-none">
          <div className="space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">Completed</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {achievedTasks.length === 0
                    ? 'Nothing completed yet, keep going!'
                    : `${achievedTasks.length} task${achievedTasks.length !== 1 ? 's' : ''} completed. Great work.`}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <CheckCircleIcon size={18} />
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Archive
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {achievedTasks.length} completed
                </span>
              </div>
              <div className="p-3 sm:p-5">
                {achievedTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Nothing here yet</p>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      Complete a task and it will show up here.
                    </p>
                  </div>
                ) : (
                  <AchievedList tasks={achievedTasks} />
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inactive" className="outline-none">
          <div className="space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">Inactive</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {inactiveTasks.length === 0
                    ? 'No inactive recurring tasks.'
                    : `${inactiveTasks.length} recurring task${inactiveTasks.length !== 1 ? 's' : ''} not scheduled for today.`}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <PauseCircle size={18} />
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <PauseCircle className="h-3.5 w-3.5 text-muted-foreground/60" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Sleeping
                  </span>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  {inactiveTasks.length}
                </span>
              </div>
              <div className="p-3 sm:p-5">
                {inactiveTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                      <PauseCircle className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      All recurring tasks are active
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      Recurring tasks not scheduled for today appear here.
                    </p>
                  </div>
                ) : (
                  <InactiveList tasks={inactiveTasks} />
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trashed" className="outline-none">
          <div className="space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">Trash</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {trashedTasks.length === 0
                    ? 'Nothing in the trash.'
                    : `${trashedTasks.length} item${trashedTasks.length !== 1 ? 's' : ''} — permanently delete or restore.`}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <Trash2 size={18} />
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Delete zone
                </span>
                <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                  {trashedTasks.length} item{trashedTasks.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="p-3 sm:p-5">
                {trashedTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                      <Trash2 className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Trash is empty</p>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      Deleted tasks will appear here.
                    </p>
                  </div>
                ) : (
                  <Trash tasks={trashedTasks} />
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}
