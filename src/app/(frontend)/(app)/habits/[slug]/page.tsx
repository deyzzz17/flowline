import { getHabitBySlug } from '@/api/habits/actions'
import { getHabitTrackingAnalytics } from '@/api/habits-analytics/actions'
import { HabitDetailClient } from '@/components/habits/habit-detail-client'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth } from '@/lib/require-auth'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const habit = await getHabitBySlug(slug)
  return { title: habit ? `${habit.name} — Flowline` : 'Habit — Flowline' }
}

export default async function HabitDetailPage({ params }: Props) {
  const { slug } = await params

  const [, habit] = await Promise.all([requireAuth(), getHabitBySlug(slug)])

  if (!habit) notFound()

  const initialTrackingAnalytics = await getHabitTrackingAnalytics(habit.id, 'week', 0)

  return <HabitDetailClient habit={habit} initialTrackingAnalytics={initialTrackingAnalytics} />
}
