import { listHabits } from '@/api/habits/actions'
import { HabitsClient } from '@/components/habits/habits-client'
import { ProtectedRoute } from '@/components/route/protected-route'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Habits — Flowline',
}

export default async function HabitsPage() {
  const habits = await listHabits()
  return (
    <ProtectedRoute>
      <div className="relative px-4 pb-16 sm:px-6 lg:px-10">
        <HabitsClient initialHabits={habits} />
      </div>
    </ProtectedRoute>
  )
}
