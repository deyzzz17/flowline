import { notFound, redirect } from 'next/navigation'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { getCurrentWorkspaceId } from '@/lib/get-current-workspace'
import { requireAuth } from '@/lib/require-auth'
import { getTeamOverview, listTeamRoles } from '@/api/teams/actions'
import { TeamDetailClient } from '@/components/dashboard/team-detail-client'

interface TeamPageProps {
  params: Promise<{ id: string }>
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { id } = await params
  const teamId = Number(id)
  if (!Number.isFinite(teamId)) notFound()

  const workspaceId = await getCurrentWorkspaceId()
  if (workspaceId === null) redirect('/lists/today')

  await requireAuth()

  const queryClient = new QueryClient()
  const overview = await getTeamOverview(teamId)
  if (!overview) notFound()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['teams', teamId, 'overview'],
      queryFn: () => Promise.resolve(overview),
    }),
    queryClient.prefetchQuery({
      queryKey: ['teams', teamId, 'roles'],
      queryFn: () => listTeamRoles(teamId),
    }),
  ])

  return (
    <div className="relative px-4 pb-16 sm:px-6 lg:px-10">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <TeamDetailClient teamId={teamId} initialOverview={overview} />
      </HydrationBoundary>
    </div>
  )
}
