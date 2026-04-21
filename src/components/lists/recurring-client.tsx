'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TodoList } from '@/components/tasks/todo-list'
import { AchievedList } from '@/components/tasks/achieved-list'
import { InactiveList } from '@/components/tasks/inactive-list'
import {
  CheckCircle2,
  ClipboardList,
  ListTodo,
  PauseCircle,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { Trash } from '../tasks/trash-list'

export const RecurringClient = () => {
  const { data } = useQuery({
    queryKey: ['tasks', 'recurring'],
    queryFn: () => api.tasks.listRecurring(),
  })

  const allTasks = data?.docs ?? []
  const todoTasks = allTasks.filter((t) => t.status === 'active')
  const achievedTasks = allTasks.filter((t) => t.status === 'completed')
  const inactiveTasks = allTasks.filter((t) => t.status === 'inactive')
  const trashedTasks = allTasks.filter((t) => t.status === 'deleted')

  return (
    <>
      <section className="mb-8 mt-10">
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="mb-1 text-xl font-semibold uppercase text-violet-600 dark:text-violet-400">
              Smart list
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Recurring</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {allTasks.length === 0
                ? 'No recurring tasks yet.'
                : `${todoTasks.length} active · ${inactiveTasks.length} inactive · ${achievedTasks.length} completed`}
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <RefreshCw size={18} />
          </div>
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
              <span className="hidden xs:inline sm:inline">Active</span>
              {todoTasks.length > 0 && (
                <span className="ml-0.5 rounded-full bg-violet-500/15 px-1.5 py-px text-[10px] font-bold text-violet-600 dark:text-violet-400">
                  {todoTasks.length}
                </span>
              )}
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
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Active today</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {todoTasks.length === 0
                  ? 'No recurring tasks active today.'
                  : `${todoTasks.length} recurring task${todoTasks.length !== 1 ? 's' : ''} active.`}
              </p>
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
                    <p className="text-sm font-medium text-muted-foreground">All clear</p>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      No recurring tasks scheduled for today.
                    </p>
                  </div>
                ) : (
                  <TodoList tasks={todoTasks} readOnly />
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inactive" className="outline-none">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Inactive</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {inactiveTasks.length === 0
                  ? 'All recurring tasks are active today.'
                  : `${inactiveTasks.length} task${inactiveTasks.length !== 1 ? 's' : ''} not scheduled for today.`}
              </p>
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
              <div className="p-5">
                {inactiveTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                      <PauseCircle className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">All active today</p>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      Recurring tasks not scheduled for today appear here.
                    </p>
                  </div>
                ) : (
                  <InactiveList tasks={inactiveTasks} readOnly />
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
                  ? 'Nothing completed yet.'
                  : `${achievedTasks.length} task${achievedTasks.length !== 1 ? 's' : ''} completed today.`}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Done
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
                      Complete a recurring task and it will show up here.
                    </p>
                  </div>
                ) : (
                  <AchievedList tasks={achievedTasks} readOnly />
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
