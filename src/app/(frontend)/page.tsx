import { api } from '@/api'
import { AchievedList } from '@/components/achieved-list'
import { CreateTask } from '@/components/create-task'
import { TodoList } from '@/components/todo-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2, CheckCircleIcon, ClipboardList, Trash2 } from 'lucide-react'

export default async function HomePage() {
  const result = await api.tasks.list()
  const allTasks = result.docs

  const todoTasks = allTasks.filter((t) => t.status === 'active')
  const achievedTasks = allTasks.filter((t) => t.status === 'completed')
  const trashedTasks = allTasks.filter((t) => t.status === 'deleted')

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10 text-foreground">
      <section className="space-y-1">
        <h1 className="text-5xl space-y-6 font-bold tracking-tight">Dashboard</h1>
        <p className="text-lg text-muted-foreground">
          Manage your workspace and track your progress.
        </p>
      </section>

      <Tabs defaultValue="todo" className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid grid-cols-3 w-full max-w-100">
            <TabsTrigger value="todo" className="gap-2">
              <ClipboardList className="h-3.5 w-3.5" /> To do
            </TabsTrigger>
            <TabsTrigger value="achieved" className="gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" /> Achieved
            </TabsTrigger>
            <TabsTrigger value="trashed" className="gap-2">
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
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                  Tasks in progress ({todoTasks.length})
                </h3>
              </div>
              <TodoList tasks={todoTasks} onDelete={api.tasks.softDelete} />
            </div>
          </section>
        </TabsContent>

        <TabsContent value="achieved" className="outline-none space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <CheckCircleIcon size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-foreground">Achieved Tasks</h3>
              <p className="text-sm text-muted-foreground">Congrats! Here is what you have done.</p>
            </div>
          </div>
          <div className="rounded-xl border bg-card/30 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                Archive
              </h3>
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                {achievedTasks.length} achieved
              </div>
            </div>
            {achievedTasks.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground italic border border-dashed rounded-lg bg-muted/20">
                Nothing here at the moment. Complete a task to see it appear!
              </div>
            ) : (
              <AchievedList tasks={achievedTasks} onDelete={api.tasks.softDelete} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="trashed" className="outline-none space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 text-destructive rounded-lg">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-foreground">Trash</h3>
              <p className="text-sm text-muted-foreground">
                The tasks here will be permanently deleted if you click on the delete icon.
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-card/30 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                Delete Zone
              </h3>
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                {trashedTasks.length} element(s)
              </div>
            </div>

            {trashedTasks.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground italic border border-dashed rounded-lg bg-muted/20">
                The trash can is empty.
              </div>
            ) : (
              <TodoList tasks={trashedTasks} onDelete={api.tasks.trash} />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
