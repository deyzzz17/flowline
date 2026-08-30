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
import { requireAuth } from '@/lib/require-auth'

export default async function DashboardPage() {
  const [
    ,
    todayTasksResult,
    timerToday,
    timerYesterday,
    timerWeek,
    timerLastWeek,
    habitAnalytics,
    habits,
    todayEvents,
    allTasksResult,
  ] = await Promise.all([
    requireAuth(),
    listTasksToday('global'),
    getTimerAnalytics('day', 0),
    getTimerAnalytics('day', -1),
    getTimerAnalytics('week', 0),
    getTimerAnalytics('week', -1),
    getHabitAnalytics(),
    listHabits(),
    getDashboardTodayEvents(),
    api.tasks.list(),
  ])

  const todayTasks = todayTasksResult.docs
  const activeTodayTasks = todayTasks.filter((t) => t.status === 'active')
  const completedTodayTasks = todayTasks.filter((t) => t.status === 'completed')
  const overdueTodayTasks = activeTodayTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date(),
  )
  const allActiveTasks = allTasksResult.docs.filter((t) => t.status === 'active')
  const allCompletedTasks = allTasksResult.docs.filter((t) => t.status === 'completed')
  const priorityTask = activeTodayTasks[0] ?? null

  return (
    <div className="relative px-4 pb-16 sm:px-6 lg:px-10">
      <DashboardHeader />
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
        focusYesterdaySeconds={timerYesterday.totalSeconds}
        timerWeek={timerWeek}
        habits={habits}
      />
      <DashboardInsights
        habits={habits}
        timerToday={timerToday}
        timerWeek={timerWeek}
        timerLastWeek={timerLastWeek}
        timerYesterday={timerYesterday}
        activeTasks={allActiveTasks}
        completedTasks={allCompletedTasks}
      />
      <DashboardTimeAndCalendar timerWeek={timerWeek} todayEvents={todayEvents} />
      <DashboardGoals habits={habits} />
    </div>
  )
}
