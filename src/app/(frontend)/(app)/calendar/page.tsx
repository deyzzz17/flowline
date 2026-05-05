import { CalendarClient } from '@/components/calendar/calendar-client'
import { ProtectedRoute } from '@/components/route/protected-route'

export default function CalendarPage() {
  return (
    <div className="h-full overflow-hidden">
      <ProtectedRoute>
        <CalendarClient />
      </ProtectedRoute>
    </div>
  )
}
