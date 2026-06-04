import { getHabitAnalytics } from '@/api/habits/actions'
import { getGoalTrophyAnalytics } from '@/api/habits-analytics/goal-trophy-analytics-actions'
import { HabitsAnalyticsClient } from '@/components/habits/habits-analytics-client'
import { ProtectedRoute } from '@/components/route/protected-route'
import type { Metadata } from 'next'

export default async function HabitsAnalyticsPage() {
  const [analytics, trophyData] = await Promise.all([
    getHabitAnalytics(),
    getGoalTrophyAnalytics('month', 0),
  ])

  return (
    <ProtectedRoute>
      <div className="relative px-4 pb-16 sm:px-6 lg:px-10">
        <HabitsAnalyticsClient initialData={analytics} initialTrophyData={trophyData} />
      </div>
    </ProtectedRoute>
  )
}
