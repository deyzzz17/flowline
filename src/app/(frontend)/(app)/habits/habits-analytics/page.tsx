import { getHabitAnalytics } from '@/api/habits/actions'
import { HabitsAnalyticsClient } from '@/components/habits/habits-analytics-client'
import { ProtectedRoute } from '@/components/route/protected-route'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Habits Analytics — Flowline',
}

export default async function HabitsAnalyticsPage() {
  const analytics = await getHabitAnalytics()
  return (
    <ProtectedRoute>
      <div className="relative px-4 pb-16 sm:px-6 lg:px-10">
        <HabitsAnalyticsClient initialData={analytics} />
      </div>
    </ProtectedRoute>
  )
}
