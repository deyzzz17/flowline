import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getCurrentWorkspace } from '@/lib/get-current-workspace'
import { WorkspaceCalendarClient } from '@/components/calendar/workspace-calendar-client'
import { CalendarCategoriesComplianceGate } from '@/components/calendar/calendar-categories-compliance-gate'
import { requireAuth } from '@/lib/require-auth'
import { Suspense } from 'react'

export default async function WorkspaceCalendarPage() {
  const session = await requireAuth()

  // Personal has no workspace calendar — only Lists and Timer.
  const payload = await getPayload({ config })
  const workspace = await getCurrentWorkspace(payload, session.user.id)
  if (workspace.isPersonal) redirect('/lists/today')

  return (
    <div className="h-full overflow-hidden">
      <CalendarCategoriesComplianceGate />
      <Suspense>
        <WorkspaceCalendarClient />
      </Suspense>
    </div>
  )
}
