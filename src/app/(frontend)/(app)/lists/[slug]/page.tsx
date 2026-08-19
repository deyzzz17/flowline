import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { api } from '@/api'
import { ListClient } from '@/components/lists/list-client'
import { TasksSubtasksComplianceGate } from '@/components/tasks/tasks-subtasks-compliance-gate'
import { requireAuth } from '@/lib/require-auth'
import { notFound } from 'next/navigation'

interface ListPageProps {
  params: Promise<{ slug: string }>
}

export default async function ListPage({ params }: ListPageProps) {
  const { slug } = await params
  const [, listResult] = await Promise.all([requireAuth(), api.lists.slug(slug)])
  if (!listResult.ok) notFound()
  const list = listResult.value
  const listId = list.id
  const queryClient = new QueryClient()
  const [role] = await Promise.all([
    api.lists.role(listId),
    queryClient.prefetchQuery({
      queryKey: ['tasks', listId],
      queryFn: () => api.tasks.list(1, listId),
    }),
  ])
  if (!role) notFound()
  return (
    <div className="relative px-4 pb-16 sm:px-6 lg:px-10">
      <div className="relative z-10">
        <TasksSubtasksComplianceGate listId={listId} />
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ListClient list={list} role={role} />
        </HydrationBoundary>
      </div>
    </div>
  )
}
