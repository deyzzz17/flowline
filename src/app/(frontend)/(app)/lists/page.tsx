import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { api } from '@/api'
import { TasksClient } from '@/components/lists/tasks-client'
import { ListHeader } from '@/components/lists/list-header'
import { ProtectedRoute } from '@/components/route/protected-route'

export default async function TasksPage() {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({
    queryKey: ['tasks'],
    queryFn: () => api.tasks.list(),
  })

  return (
    <ProtectedRoute>
      <div className="relative mx-auto max-w-screen-2xl px-4 pb-16 sm:px-6 lg:px-10">
        <div className="relative z-10">
          <HydrationBoundary state={dehydrate(queryClient)}>
            <ListHeader />
            <TasksClient />
          </HydrationBoundary>
        </div>
      </div>
    </ProtectedRoute>
  )
}
