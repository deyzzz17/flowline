import { getHabitDetail } from '@/api/habits/actions'
import { HabitDetailClient } from '@/components/habits/habit-detail-client'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const habit = await getHabitDetail(Number(id))
  return { title: habit ? `${habit.name} — Flowline` : 'Habit — Flowline' }
}

export default async function HabitDetailPage({ params }: Props) {
  const { id } = await params
  const habit = await getHabitDetail(Number(id))
  if (!habit) notFound()
  return <HabitDetailClient habit={habit} />
}
