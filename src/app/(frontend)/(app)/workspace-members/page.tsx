import { redirect } from 'next/navigation'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { api } from '@/api'
import { getCurrentWorkspaceId } from '@/lib/get-current-workspace'
import { requireAuth } from '@/lib/require-auth'
import { WorkspaceMembersClient } from '@/components/dashboard/workspace-members-client'

export default async function WorkspaceMembersPage() {
  // Personal has no members — it's not an organization.
  const workspaceId = await getCurrentWorkspaceId()
  if (workspaceId === null) redirect('/lists/today')

  const queryClient = new QueryClient()

  await Promise.all([
    requireAuth(),
    queryClient.prefetchQuery({
      queryKey: ['workspace-members'],
      queryFn: () => api.workspaces.listMembers(),
    }),
  ])

  return (
    <div className="relative px-4 pb-16 sm:px-6 lg:px-10">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <WorkspaceMembersClient />
      </HydrationBoundary>
    </div>
  )
}
