import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { api } from '@/api'
import { ListClient } from '@/components/lists/list-client'
import { ProtectedRoute } from '@/components/route/protected-route'
import { notFound } from 'next/navigation'

interface ListPageProps {
  params: Promise<{ id: string }>
}

export default async function ListPage({ params }: ListPageProps) {
  const { id } = await params
  const listId = parseInt(id)

  if (isNaN(listId)) notFound()

  const listResult = await api.lists.getById(listId)
  if (!listResult.ok) notFound()

  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['tasks', listId],
    queryFn: () => api.tasks.list(1, listId),
  })

  return (
    <ProtectedRoute>
      <div className="relative mx-auto max-w-screen-2xl px-4 pb-16 sm:px-6 lg:px-10">
        <div className="relative z-10">
          <HydrationBoundary state={dehydrate(queryClient)}>
            <ListClient list={listResult.value} />
          </HydrationBoundary>
        </div>
      </div>
    </ProtectedRoute>
  )
}
