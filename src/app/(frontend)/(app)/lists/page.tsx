import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { requireAuth } from '@/lib/require-auth'
import { api } from '@/api'
import { TasksClient } from '@/components/lists/tasks-client'
import { ListHeader } from '@/components/lists/list-header'

export default async function TasksPage() {
  await requireAuth()

  const queryClient = new QueryClient()

  await queryClient.prefetchInfiniteQuery({
    queryKey: ['tasks'],
    queryFn: ({ pageParam = 1 }) => api.tasks.list(pageParam as number),
    initialPageParam: 1,
  })

  return (
    <div className="relative mx-auto max-w-screen-2xl px-4 pb-16 sm:px-6 lg:px-10">
      <div className="relative z-10">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ListHeader />
          <TasksClient />
        </HydrationBoundary>
      </div>
    </div>
  )
}
