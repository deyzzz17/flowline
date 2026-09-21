import { redirect } from 'next/navigation'
import { getCurrentWorkspaceId } from '@/lib/get-current-workspace'
import { requireAuth } from '@/lib/require-auth'
import { getTeamsAccess } from '@/api/teams/actions'
import { TeamsClient } from '@/components/dashboard/teams-client'
import { TeamsUpgradePrompt } from '@/components/dashboard/teams-upgrade-prompt'

export default async function TeamsPage() {
  // Personal isn't an organization — Teams only exist inside a real workspace.
  const workspaceId = await getCurrentWorkspaceId()
  if (workspaceId === null) redirect('/lists/today')

  await requireAuth()
  const { hasAccess } = await getTeamsAccess()

  return (
    <div className="relative px-4 pb-16 sm:px-6 lg:px-10">
      {hasAccess ? (
        <TeamsClient />
      ) : (
        <>
          <section className="mb-8 mt-10">
            <p className="mb-1 text-xl font-semibold uppercase text-violet-500 dark:text-violet-400">
              Workspace
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Teams</h1>
          </section>
          <TeamsUpgradePrompt />
        </>
      )}
    </div>
  )
}
