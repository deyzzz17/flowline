import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { api } from '@/api'
import { ListClient } from '@/components/lists/list-client'
import { ProtectedRoute } from '@/components/route/protected-route'
import { notFound } from 'next/navigation'

interface ListPageProps {
  params: Promise<{ slug: string }>
}

export default async function ListPage({ params }: ListPageProps) {
  const { slug } = await params

  const listResult = await api.lists.slug(slug)
  if (!listResult.ok) notFound()

  const list = listResult.value
  const listId = list.id

  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({
    queryKey: ['tasks', listId],
    queryFn: () => api.tasks.list(1, listId),
  })

  return (
    <ProtectedRoute>
      <div className="relative px-4 pb-16 sm:px-6 lg:px-10">
        <div className="relative z-10">
          <HydrationBoundary state={dehydrate(queryClient)}>
            <ListClient list={list} />
          </HydrationBoundary>
        </div>
      </div>
    </ProtectedRoute>
  )
}
