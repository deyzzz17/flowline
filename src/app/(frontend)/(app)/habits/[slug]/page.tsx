import { getHabitBySlug } from '@/api/habits/actions'
import { HabitDetailClient } from '@/components/habits/habit-detail-client'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ProtectedRoute } from '@/components/route/protected-route'

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
  const habit = await getHabitBySlug(slug)
  if (!habit) notFound()
  return (
    <ProtectedRoute>
      <div className="relative px-4 pb-16 sm:px-6 lg:px-10">
        <HabitDetailClient habit={habit} />
      </div>
    </ProtectedRoute>
  )
}
