import { getHabitAnalytics } from '@/api/habits/actions'
import { getGoalTrophyAnalytics } from '@/api/habits-analytics/goal-trophy-analytics-actions'
import { getHeatmapAnalytics } from '@/api/habits-analytics/actions'
import { HabitsAnalyticsClient } from '@/components/habits/habits-analytics-client'
import { ProtectedRoute } from '@/components/route/protected-route'

export default async function HabitsAnalyticsPage() {
  const [analytics, trophyData, heatmapData] = await Promise.all([
    getHabitAnalytics(),
    getGoalTrophyAnalytics('month', 0),
    getHeatmapAnalytics(new Date().getFullYear()),
  ])

  return (
    <ProtectedRoute>
      <div className="relative px-4 pb-16 sm:px-6 lg:px-10">
        <HabitsAnalyticsClient
          initialData={analytics}
          initialTrophyData={trophyData}
          initialHeatmapData={heatmapData}
        />
      </div>
    </ProtectedRoute>
  )
}
