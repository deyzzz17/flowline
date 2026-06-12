import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { api } from '@/api'
import { RecurringClient } from '@/components/lists/recurring-client'
import { requireAuth } from '@/lib/require-auth'

export default async function RecurringPage() {
  const queryClient = new QueryClient()

  await Promise.all([
    requireAuth(),
    queryClient.prefetchQuery({
      queryKey: ['tasks', 'recurring'],
      queryFn: () => api.tasks.listRecurring(),
    }),
  ])

  return (
    <div className="relative px-4 pb-16 sm:px-6 lg:px-10">
      <div className="relative z-10">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <RecurringClient />
        </HydrationBoundary>
      </div>
    </div>
  )
}
