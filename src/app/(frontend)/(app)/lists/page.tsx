import { api } from '@/api'
import { AchievedList } from '@/components/lists/achieved-list'
import { CreateTask } from '@/components/lists/create-task'
import { TodoList } from '@/components/lists/todo-list'
import { Trash } from '@/components/lists/trash-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CheckCircle2,
  CheckCircleIcon,
  ClipboardList,
  Trash2,
  ListTodo,
  Sparkles,
} from 'lucide-react'

export default async function HomePage() {
  const result = await api.tasks.list()
  const allTasks = result.docs

  const todoTasks = allTasks.filter((t) => t.status === 'active')
  const achievedTasks = allTasks.filter((t) => t.status === 'completed')
  const trashedTasks = allTasks.filter((t) => t.status === 'deleted')

  const completionRate =
    allTasks.length > 0 ? Math.round((achievedTasks.length / allTasks.length) * 100) : 0

  return (
    <div className="relative mx-auto max-w-screen-2xl px-4 pb-16 sm:px-6 lg:px-10">
      <div
        className="pointer-events-none absolute inset-0 z-0 hidden dark:block"
        style={{
          backgroundImage: `linear-gradient(to right,rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.02) 1px,transparent 1px)`,
          backgroundSize: '72px 72px',
        }}
      />

      <div className="relative z-10">
        <section className="mb-8 mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-xl font-semibold uppercase text-violet-600 dark:text-violet-400">
                My workspace
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Tasks</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {allTasks.length === 0
                  ? 'No tasks yet — create your first one below.'
                  : `${todoTasks.length} active · ${achievedTasks.length} completed · ${trashedTasks.length} trashed`}
              </p>
            </div>

            {allTasks.length > 0 && (
              <div className="hidden flex-col items-end gap-1.5 sm:flex">
                <span className="text-xs text-muted-foreground">
                  {achievedTasks.length}/{allTasks.length} done
                </span>
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all duration-700"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                  {completionRate}%
                </span>
              </div>
            )}
          </div>
        </section>

        <Tabs defaultValue="todo" className="w-full">
          <div className="mb-8 flex items-center justify-between gap-4">
            <TabsList className="h-10 rounded-xl bg-muted/60 p-1">
              <TabsTrigger
                value="todo"
                className="gap-1.5 rounded-lg px-4 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                To do
                {todoTasks.length > 0 && (
                  <span className="ml-0.5 rounded-full bg-violet-500/15 px-1.5 py-px text-[10px] font-bold text-violet-600 dark:text-violet-400">
                    {todoTasks.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="achieved"
                className="gap-1.5 rounded-lg px-4 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Achieved
              </TabsTrigger>
              <TabsTrigger
                value="trashed"
                className="gap-1.5 rounded-lg px-4 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Trash
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="todo" className="outline-none">
            <div className="space-y-6">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">Today</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {todoTasks.length === 0
                      ? 'Your list is clear — add something to get started.'
                      : `${todoTasks.length} task${todoTasks.length !== 1 ? 's' : ''} remaining.`}
                  </p>
                </div>
                <CreateTask />
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
                <div className="p-5">
                  {todoTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                        <Sparkles className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">All clear!</p>
                      <p className="mt-1 text-xs text-muted-foreground/60">
                        Create a task above to get started.
                      </p>
                    </div>
                  ) : (
                    <TodoList tasks={todoTasks} onDelete={api.tasks.softDelete} />
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="achieved" className="outline-none">
            <div className="space-y-6">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    Completed
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {achievedTasks.length === 0
                      ? 'Nothing completed yet — keep going.'
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
                <div className="p-5">
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
                    <AchievedList tasks={achievedTasks} onDelete={api.tasks.softDelete} />
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
                <div className="p-5">
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
                    <Trash
                      tasks={trashedTasks}
                      onDelete={api.tasks.trash}
                      onRestore={api.tasks.restore}
                    />
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
