import { ProtectedRoute } from '@/components/route/protected-route'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { DashboardDayProgress } from '@/components/dashboard/dashboard-day-progress'
import { DashboardPriority } from '@/components/dashboard/dashboard-priority'
import { DashboardPillars } from '@/components/dashboard/dashboard-pillars'
import { DashboardInsights } from '@/components/dashboard/dashboard-insights'
import { DashboardTimeAndCalendar } from '@/components/dashboard/dashboard-time-and-calendar'
import { DashboardGoals } from '@/components/dashboard/dashboard-goals'
import { api } from '@/api'
import { listHabits, getHabitAnalytics } from '@/api/habits/actions'
import { getTimerAnalytics } from '@/api/timer-analytics/actions'
import { getDashboardTodayEvents } from '@/api/dashboard/actions'
import { listTasksToday } from '@/api/tasks/actions'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { Task } from '@/payload-types'

export default async function DashboardPage() {
  const [
    todayTasksResult,
    timerToday,
    timerWeek,
    timerLastWeek,
    habitAnalytics,
    habits,
    session,
    todayEvents,
  ] = await Promise.all([
    listTasksToday(),
    getTimerAnalytics('day', 0),
    getTimerAnalytics('week', 0),
    getTimerAnalytics('week', -1),
    getHabitAnalytics(),
    listHabits(),
    auth.api.getSession({ headers: await headers() }),
    getDashboardTodayEvents(),
  ])

  const user = session?.user ?? null
  const todayTasks = todayTasksResult.docs
  const activeTodayTasks = todayTasks.filter((t: Task) => t.status === 'active')
  const completedTodayTasks = todayTasks.filter((t: Task) => t.status === 'completed')
  const overdueTodayTasks = activeTodayTasks.filter(
    (t: Task) => t.dueDate && new Date(t.dueDate) < new Date(),
  )

  const allTasksResult = await api.tasks.list()
  const allActiveTasks = allTasksResult.docs.filter((t) => t.status === 'active')
  const allCompletedTasks = allTasksResult.docs.filter((t) => t.status === 'completed')

  const priorityTask = activeTodayTasks[0] ?? null

  return (
    <ProtectedRoute>
      <div className="relative px-4 pb-16 sm:px-6 lg:px-10">
        <DashboardHeader user={user} />

        <DashboardDayProgress
          activeTasks={activeTodayTasks.length}
          completedTasks={completedTodayTasks.length}
          totalTasks={todayTasks.length}
          habitsCompletedToday={habitAnalytics.todayCompleted}
          habitsTotal={habitAnalytics.todayTotal}
          focusTodaySeconds={timerToday.totalSeconds}
          todayEvents={todayEvents}
        />

        {priorityTask && (
          <DashboardPriority task={priorityTask} weekFocusSeconds={timerWeek.totalSeconds} />
        )}

        <DashboardPillars
          activeTasks={activeTodayTasks.length}
          overdueTasks={overdueTodayTasks.length}
          completedTodayTasks={completedTodayTasks.length}
          habitWeekRate={habitAnalytics.avgCompletionRate}
          habitStreak={habitAnalytics.bestStreak?.streak ?? 0}
          focusTodaySeconds={timerToday.totalSeconds}
          focusWeekSeconds={timerWeek.totalSeconds}
          habits={habits}
        />

        <DashboardInsights
          habits={habits}
          timerToday={timerToday}
          timerWeek={timerWeek}
          timerLastWeek={timerLastWeek}
          activeTasks={allActiveTasks}
          completedTasks={allCompletedTasks}
        />

        <DashboardTimeAndCalendar timerWeek={timerWeek} todayEvents={todayEvents} />

        <DashboardGoals habits={habits} />
      </div>
    </ProtectedRoute>
  )
}
