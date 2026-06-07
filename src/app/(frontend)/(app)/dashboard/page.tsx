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
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export default async function DashboardPage() {
  const [tasksResult, timerToday, timerWeek, timerLastWeek, habitAnalytics, habits, session] =
    await Promise.all([
      api.tasks.list(),
      getTimerAnalytics('day', 0),
      getTimerAnalytics('week', 0),
      getTimerAnalytics('week', -1), 
      getHabitAnalytics(),
      listHabits(),
      auth.api.getSession({ headers: await headers() }),
    ])

  const user = session?.user ?? null
  const allTasks = tasksResult.docs
  const activeTasks = allTasks.filter((t) => t.status === 'active')
  const completedTasks = allTasks.filter((t) => t.status === 'completed')
  const overdueTasks = activeTasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date())
  const priorityTask = activeTasks[0] ?? null

  return (
    <ProtectedRoute>
      <div className="relative px-4 pb-16 sm:px-6 lg:px-10">
        <DashboardHeader user={user} />

        <DashboardDayProgress
          activeTasks={activeTasks.length}
          completedTasks={completedTasks.length}
          totalTasks={allTasks.filter((t) => t.status !== 'deleted').length}
          habitsCompletedToday={habitAnalytics.todayCompleted}
          habitsTotal={habitAnalytics.todayTotal}
          focusTodaySeconds={timerToday.totalSeconds}
          focusGoalSeconds={4 * 3600}
        />

        {priorityTask && (
          <DashboardPriority task={priorityTask} weekFocusSeconds={timerWeek.totalSeconds} />
        )}

        <DashboardPillars
          activeTasks={activeTasks.length}
          overdueTasks={overdueTasks.length}
          completedTodayTasks={completedTasks.length}
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
          activeTasks={activeTasks}
          completedTasks={completedTasks}
        />

        <DashboardTimeAndCalendar timerWeek={timerWeek} />

        <DashboardGoals habits={habits} />
      </div>
    </ProtectedRoute>
  )
}
