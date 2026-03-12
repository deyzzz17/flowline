import { TaskList } from '@/components/task-list'
import { CreateTask } from '@/components/create-task'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Task } from '@/payload-types'
import { api } from '@/api'
import { ClipboardList, CheckCircle2, Trash2 } from 'lucide-react'

export default async function HomePage() {
  const result = await api.tasks.list()
  const tasks = result.docs

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10 text-foreground">
      <section className="space-y-1">
        <h1 className="text-5xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-base">
          Manage your workspace and track your progress.
        </p>
      </section>

      <div className="mt-16 mb-3">
        <Tabs defaultValue="todo" className="w-fit">
          <TabsList className="bg-muted/50 p-1 h-9">
            <TabsTrigger value="todo" className="gap-2 px-4 h-7 text-xs font-medium">
              <ClipboardList className="h-3.5 w-3.5" /> To do
            </TabsTrigger>
            <TabsTrigger value="achieved" disabled className="gap-2 px-4 h-7 text-xs font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> Achieved
            </TabsTrigger>
            <TabsTrigger value="trashed" disabled className="gap-2 px-4 h-7 text-xs font-medium">
              <Trash2 className="h-3.5 w-3.5" /> Trashed
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <section className="space-y-5">
        <div className="flex items-end justify-between border-b pb-4">
          <div className="space-y-0.5">
            <h2 className="text-2xl font-bold tracking-tight">My Todolist</h2>
            <p className="text-muted-foreground">Manage your daily tasks in style.</p>
          </div>
          <CreateTask />
        </div>

        <div className="rounded-xl border bg-card/30 text-card-foreground shadow-sm p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">
              Tasks in progress ({tasks.length})
            </h3>
          </div>
          <TaskList tasks={tasks as Task[]} />
        </div>
      </section>
    </div>
  )
}
