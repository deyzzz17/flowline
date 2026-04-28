import { CalendarClient } from '@/components/calendar/calendar-client'
import { ProtectedRoute } from '@/components/route/protected-route'

export default function CalendarPage() {
  return (
    <ProtectedRoute>
      <CalendarClient />
    </ProtectedRoute>
  )
}
