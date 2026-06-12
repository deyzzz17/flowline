import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { api } from '@/api'
import { TodayClient } from '@/components/lists/today-client'
import { requireAuth } from '@/lib/require-auth'

export default async function TodayPage() {
  const queryClient = new QueryClient()

  await Promise.all([
    requireAuth(),
    queryClient.prefetchQuery({
      queryKey: ['tasks', 'today'],
      queryFn: () => api.tasks.listToday(),
    }),
  ])

  return (
    <div className="relative px-4 pb-16 sm:px-6 lg:px-10">
      <div className="relative z-10">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <TodayClient />
        </HydrationBoundary>
      </div>
    </div>
  )
}
