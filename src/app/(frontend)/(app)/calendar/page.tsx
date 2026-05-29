import { CalendarClient } from '@/components/calendar/calendar-client'
import { ProtectedRoute } from '@/components/route/protected-route'
import { Suspense } from 'react'

export default function CalendarPage() {
  return (
    <div className="h-full overflow-hidden">
      <ProtectedRoute>
        <Suspense>
          <CalendarClient />
        </Suspense>
      </ProtectedRoute>
    </div>
  )
}
