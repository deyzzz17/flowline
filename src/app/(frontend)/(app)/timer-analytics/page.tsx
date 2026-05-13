import { AnalyticsClient } from '@/components/timer/analytics/analytics-client'
import { ProtectedRoute } from '@/components/route/protected-route'
import { getTimerAnalytics } from '@/api/timer-analytics/actions'

export default async function TimerAnalyticsPage() {
  const analytics = await getTimerAnalytics('week', 0)
  return (
    <ProtectedRoute>
      <AnalyticsClient initialData={analytics} initialPeriod="week" />
    </ProtectedRoute>
  )
}
