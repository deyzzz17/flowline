import { CalendarClient } from '@/components/calendar/calendar-client'
import { CalendarCategoriesComplianceGate } from '@/components/calendar/calendar-categories-compliance-gate'
import { requireAuth } from '@/lib/require-auth'
import { Suspense } from 'react'

export default async function WorkspaceCalendarPage() {
  await requireAuth()

  return (
    <div className="h-full overflow-hidden">
      <CalendarCategoriesComplianceGate />
      <Suspense>
        <CalendarClient scope="workspace" />
      </Suspense>
    </div>
  )
}
