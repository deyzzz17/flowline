'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TodoList } from '@/components/tasks/todo-list'
import { AchievedList } from '@/components/tasks/achieved-list'
import { CheckCircle2, ClipboardList, ListTodo, Sun } from 'lucide-react'

export const TodayClient = () => {
  const { data } = useQuery({
    queryKey: ['tasks', 'today'],
    queryFn: () => {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      return api.tasks.listToday(userTimezone)
    },
  })

  const allTasks = data?.docs ?? []
  const todoTasks = allTasks.filter((t) => t.status === 'active')
  const achievedTasks = allTasks.filter((t) => t.status === 'completed')

  const completionRate =
    allTasks.length > 0 ? Math.round((achievedTasks.length / allTasks.length) * 100) : 0

  return (
    <>
      <section className="mb-8 mt-10">
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="mb-1 text-xl font-semibold uppercase text-amber-500 dark:text-amber-400">
              Smart list
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Today</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {allTasks.length === 0
                ? 'Nothing due today. Enjoy your day!'
                : `${todoTasks.length} active · ${achievedTasks.length} completed`}
            </p>
            {allTasks.length > 0 && (
              <div className="mt-3 flex items-center gap-3 sm:hidden">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-700"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <span className="text-xs font-semibold shrink-0 text-amber-500 dark:text-amber-400">
                  {completionRate}%
                </span>
              </div>
            )}
          </div>
          {allTasks.length > 0 && (
            <div className="hidden flex-col items-end gap-1.5 sm:flex">
              <span className="text-xs text-muted-foreground">
                {achievedTasks.length}/{allTasks.length} done
              </span>
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-700"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-amber-500 dark:text-amber-400">
                {completionRate}%
              </span>
            </div>
          )}
        </div>
      </section>

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
                <span className="ml-0.5 rounded-full bg-amber-500/15 px-1.5 py-px text-[10px] font-bold text-amber-600 dark:text-amber-400">
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
          </TabsList>
        </div>

        <TabsContent value="todo" className="outline-none">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Today</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {todoTasks.length === 0
                  ? 'All done for today!'
                  : `${todoTasks.length} task${todoTasks.length !== 1 ? 's' : ''} remaining.`}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
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
                      <Sun className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">All done for today!</p>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      Tasks due today and recurring tasks appear here.
                    </p>
                  </div>
                ) : (
                  <TodoList tasks={todoTasks} readOnly showListBadge />
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="achieved" className="outline-none">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Completed</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {achievedTasks.length === 0
                  ? 'Nothing completed yet today.'
                  : `${achievedTasks.length} task${achievedTasks.length !== 1 ? 's' : ''} completed today.`}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Done today
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
                  <AchievedList tasks={achievedTasks} readOnly showListBadge />
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}
