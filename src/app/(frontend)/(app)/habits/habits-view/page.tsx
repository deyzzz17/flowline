import { listHabits } from '@/api/habits/actions'
import { HabitsClient } from '@/components/habits/habits-client'
import { requireAuth } from '@/lib/require-auth'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Habits — Flowline',
}

export default async function HabitsPage() {
  const [, habits] = await Promise.all([requireAuth(), listHabits()])

  return (
    <div className="relative px-4 pb-16 sm:px-6 lg:px-10">
      <HabitsClient initialHabits={habits} />
    </div>
  )
}
