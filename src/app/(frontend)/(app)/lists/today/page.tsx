import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { api } from '@/api'
import { TodayClient } from '@/components/lists/today-client'
import { ProtectedRoute } from '@/components/route/protected-route'

export default async function TodayPage() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['tasks', 'today'],
    queryFn: () => api.tasks.listToday(),
  })

  return (
    <ProtectedRoute>
      <div className="relative mx-auto max-w-screen-2xl px-4 pb-16 sm:px-6 lg:px-10">
        <div className="relative z-10">
          <HydrationBoundary state={dehydrate(queryClient)}>
            <TodayClient />
          </HydrationBoundary>
        </div>
      </div>
    </ProtectedRoute>
  )
}
