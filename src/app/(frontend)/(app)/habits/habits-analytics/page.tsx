import { getHabitAnalytics } from '@/api/habits/actions'
import { getGoalTrophyAnalytics } from '@/api/habits-analytics/goal-trophy-analytics-actions'
import { getHeatmapAnalytics } from '@/api/habits-analytics/actions'
import { HabitsAnalyticsClient } from '@/components/habits/habits-analytics-client'
import { requireAuth } from '@/lib/require-auth'

export default async function HabitsAnalyticsPage() {
  const [, analytics, trophyData, heatmapData] = await Promise.all([
    requireAuth(),
    getHabitAnalytics(),
    getGoalTrophyAnalytics('month', 0),
    getHeatmapAnalytics(new Date().getFullYear()),
  ])

  return (
    <div className="relative px-4 pb-16 sm:px-6 lg:px-10">
      <HabitsAnalyticsClient
        initialData={analytics}
        initialTrophyData={trophyData}
        initialHeatmapData={heatmapData}
      />
    </div>
  )
}
