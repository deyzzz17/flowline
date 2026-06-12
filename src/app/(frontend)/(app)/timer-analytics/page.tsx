import { AnalyticsClient } from '@/components/timer/analytics/analytics-client'
import { requireAuth } from '@/lib/require-auth'
import { getTimerAnalytics } from '@/api/timer-analytics/actions'

export default async function TimerAnalyticsPage() {
  const [, analytics] = await Promise.all([requireAuth(), getTimerAnalytics('week', 0)])

  return <AnalyticsClient initialData={analytics} initialPeriod="week" />
}
