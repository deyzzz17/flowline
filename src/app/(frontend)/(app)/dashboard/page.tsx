import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { DashboardFocusNow } from '@/components/dashboard/dashboard-focus-now'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'
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
  const allActiveTasks = allTasksResult.docs.filter((t) => t.status === 'active')
  const allCompletedTasks = allTasksResult.docs.filter((t) => t.status === 'completed')
  const priorityTask = activeTodayTasks[0] ?? null

  const now = new Date()

  // Genuinely overdue — any active task whose due date has passed, not just
  // ones due earlier today. Computed once here and reused everywhere so the
  // "What needs you next" banner, the Today overview tile, and "What
  // Flowline noticed" always agree on the same number.
  const overdueTasks = allActiveTasks.filter((t) => t.dueDate && new Date(t.dueDate) < now)

  const atRiskHabit =
    habits
      .filter((h) => !h.completedToday && h.currentStreak >= 1)
      .sort((a, b) => b.currentStreak - a.currentStreak || a.completionRate30d - b.completionRate30d)[0] ??
    null

  const nextEvent = todayEvents.find((e) => new Date(e.endDate) >= now) ?? null

  const isNewAccount =
    allActiveTasks.length === 0 &&
    allCompletedTasks.length === 0 &&
    habits.length === 0 &&
    timerWeek.totalSessions === 0 &&
    todayEvents.length === 0

  return (
    <div className="relative px-4 pb-16 sm:px-6 lg:px-10">
      <DashboardHeader />
      <DashboardFocusNow
        priorityTask={priorityTask}
        overdueCount={overdueTasks.length}
        atRiskHabit={atRiskHabit}
        nextEvent={nextEvent}
        isNewAccount={isNewAccount}
      />
      <DashboardOverview
        activeTasks={activeTodayTasks.length}
        completedTasks={completedTodayTasks.length}
        totalTasks={todayTasks.length}
        overdueTasks={overdueTasks.length}
        habitsCompletedToday={habitAnalytics.todayCompleted}
        habitsTotal={habitAnalytics.todayTotal}
        habitWeekRate={habitAnalytics.avgCompletionRate}
        habitStreak={habitAnalytics.bestStreak?.streak ?? 0}
        focusTodaySeconds={timerToday.totalSeconds}
        focusYesterdaySeconds={timerYesterday.totalSeconds}
        timerWeek={timerWeek}
        todayEvents={todayEvents}
      />
      <DashboardInsights
        habits={habits}
        timerToday={timerToday}
        timerWeek={timerWeek}
        timerLastWeek={timerLastWeek}
        timerYesterday={timerYesterday}
        activeTasks={allActiveTasks}
        completedTasks={allCompletedTasks}
        completedTodayCount={completedTodayTasks.length}
        priorityTask={priorityTask}
      />
      <DashboardTimeAndCalendar timerWeek={timerWeek} todayEvents={todayEvents} />
      <DashboardGoals habits={habits} />
    </div>
  )
}
