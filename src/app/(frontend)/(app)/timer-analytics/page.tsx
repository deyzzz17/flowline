import { AnalyticsClient } from '@/components/timer/analytics/analytics-client'
import { ProtectedRoute } from '@/components/route/protected-route'
import { api } from '@/api'

export default async function TimerAnalyticsPage() {
  const analytics = await api.timer.analytics.get('week')

  return (
    <ProtectedRoute>
      <AnalyticsClient initialData={analytics} initialPeriod="week" />
    </ProtectedRoute>
  )
}
