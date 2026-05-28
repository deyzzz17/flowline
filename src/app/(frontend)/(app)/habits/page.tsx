import { listHabits } from '@/api/habits/actions'
import { HabitsClient } from '@/components/habits/habits-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Habits — Flowline',
}

export default async function HabitsPage() {
  const habits = await listHabits()
  return <HabitsClient initialHabits={habits} />
}
