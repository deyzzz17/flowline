import { CalendarClient } from '@/components/calendar/calendar-client'
import { requireAuth } from '@/lib/require-auth'
import { Suspense } from 'react'

export default async function CalendarPage() {
  await requireAuth()

  return (
    <div className="h-full overflow-hidden">
      <Suspense>
        <CalendarClient />
      </Suspense>
    </div>
  )
}
