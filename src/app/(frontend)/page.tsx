import { TodoList } from '@/components/todo-list'
import { AchievedList } from '@/components/achieved-list'
import { CreateTask } from '@/components/create-task'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Task } from '@/payload-types'
import { api } from '@/api'
import { ClipboardList, CheckCircle2, Trash2 } from 'lucide-react'
import { moveToTrashAction, softDeleteTaskAction } from './Tasks/actions'
import { CheckCircleIcon } from 'lucide-react'

export default async function HomePage() {
  const result = await api.tasks.list()
  const allTasks = result.docs

  const todoTasks = allTasks.filter((t) => t.status === 'active')
  const achievedTasks = allTasks.filter((t) => t.status === 'completed')
  const trashedTasks = allTasks.filter((t) => t.status === 'deleted')

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10 text-foreground">
      <section className="space-y-1">
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-base">
          Manage your workspace and track your progress.
        </p>
      </section>

      <Tabs defaultValue="todo" className="w-full">
        <div className="mt-16 mb-8">
          <TabsList className="bg-muted/50 p-1 h-9">
            <TabsTrigger value="todo" className="gap-2 px-4 h-7 text-xs font-medium">
              <ClipboardList className="h-3.5 w-3.5" /> To do
            </TabsTrigger>
            <TabsTrigger value="achieved" className="gap-2 px-4 h-7 text-xs font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> Achieved
            </TabsTrigger>
            <TabsTrigger value="trashed" className="gap-2 px-4 h-7 text-xs font-medium">
              <Trash2 className="h-3.5 w-3.5" /> Trashed
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="todo" className="space-y-8 outline-none">
          <section className="space-y-5">
            <div className="flex items-end justify-between border-b pb-4">
              <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">My Todolist</h2>
                <p className="text-sm text-muted-foreground">Manage your daily tasks in style.</p>
              </div>
              <CreateTask />
            </div>

            <div className="rounded-xl border bg-card/30 p-5">
              <div className="mb-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                  Tasks in progress ({todoTasks.length})
                </h3>
              </div>
              <TodoList tasks={todoTasks} onDelete={softDeleteTaskAction} />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="achieved" className="outline-none space-y-6">
          <div className="flex items-center gap-4 pb-2">
            <div className="rounded-xl border bg-muted/50 p-2.5 text-primary shadow-sm">
              <CheckCircleIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Achieved Tasks</h2>
              <p className="text-sm text-muted-foreground">Congrats! Here is what you have done.</p>
            </div>
          </div>
          <div className="rounded-xl border bg-card/30 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Archive
              </h3>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                {achievedTasks.length} achieved
              </div>
            </div>
            {achievedTasks.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground italic border border-dashed rounded-lg bg-muted/20">
                Nothing here at the moment. Complete a task to see it appear!
              </div>
            ) : (
              <AchievedList tasks={achievedTasks} onDelete={softDeleteTaskAction} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="trashed" className="outline-none space-y-6">
          <div className="flex items-center gap-4 pb-2">
            <div className="rounded-xl border bg-destructive/10 p-2.5 text-destructive shadow-sm">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Trash</h2>
              <p className="text-sm text-muted-foreground">
                The tasks here will be permanently deleted if you click on the delete icon.
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-card/30 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Delete Zone
              </h3>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                {trashedTasks.length} element(s)
              </div>
            </div>

            {trashedTasks.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground italic border border-dashed rounded-lg bg-muted/20">
                The trash can is empty.
              </div>
            ) : (
              <TodoList tasks={trashedTasks} onDelete={moveToTrashAction} />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
