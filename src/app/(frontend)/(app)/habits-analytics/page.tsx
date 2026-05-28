import { getHabitAnalytics } from '@/api/habits/actions'
import { HabitsAnalyticsClient } from '@/components/habits/habits-analytics-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Habits Analytics — Flowline',
}

export default async function HabitsAnalyticsPage() {
  const analytics = await getHabitAnalytics()
  return <HabitsAnalyticsClient initialData={analytics} />
}
