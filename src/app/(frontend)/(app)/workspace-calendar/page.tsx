import { redirect } from 'next/navigation'
import { getCurrentWorkspaceId } from '@/lib/get-current-workspace'
import { WorkspaceCalendarClient } from '@/components/calendar/workspace-calendar-client'
import { CalendarCategoriesComplianceGate } from '@/components/calendar/calendar-categories-compliance-gate'
import { requireAuth } from '@/lib/require-auth'
import { Suspense } from 'react'

export default async function WorkspaceCalendarPage() {
  await requireAuth()

  // Personal has no workspace calendar — only Lists and Timer.
  const workspaceId = await getCurrentWorkspaceId()
  if (workspaceId === null) redirect('/lists/today')

  return (
    <div className="h-full overflow-hidden">
      <CalendarCategoriesComplianceGate />
      <Suspense>
        <WorkspaceCalendarClient />
      </Suspense>
    </div>
  )
}
